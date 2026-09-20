import { AuditLog } from '../models/AuditLog.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'refreshtoken',
  'refreshtokenhash',
  'mfasecret',
  'secret',
  'otp',
  'recoverycode',
  'codehash',
  'apikey',
]);

/**
 * Recursively sanitize objects to ensure no sensitive authentication secrets
 * or unmasked bank account numbers are stored in AuditLog.
 */
function sanitizeAuditData(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeAuditData);

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      clean[key] = '[REDACTED]';
    } else if (lowerKey === 'accountnumber' && typeof value === 'string') {
      const raw = value.trim();
      clean[key] = raw.length >= 4 ? `XXXXXX${raw.slice(-4)}` : 'XXXXXX';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeAuditData(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Log an immutable administrative action.
 * Supports both object style: ({ userId, action, entity, entityId, oldValue, newValue, ipAddress })
 * and positional/Express style: (reqOrUserId, action, entity, entityId, details)
 */
export const logAdminAction = async (...args) => {
  try {
    let userId, action, entity, entityId, oldValue, newValue, ipAddress;
    if (args.length === 1 && typeof args[0] === 'object' && !args[0].user && !args[0].headers) {
      ({ userId, action, entity, entityId = '', oldValue = null, newValue = null, ipAddress = '' } = args[0]);
    } else {
      const first = args[0];
      if (first && typeof first === 'object' && (first.user || first.headers)) {
        userId = first.user?._id;
        ipAddress = first.ip || '';
      } else {
        userId = first;
      }
      action = args[1];
      entity = args[2];
      entityId = args[3] ? String(args[3]) : '';
      newValue = args[4] || null;
    }

    if (!userId) {
      console.warn('[AuditLog Warning] Attempted to log admin action without valid userId');
      return null;
    }

    return await AuditLog.create({
      userId,
      action,
      entity: entity || 'SYSTEM',
      entityId: entityId || '',
      oldValue: sanitizeAuditData(oldValue),
      newValue: sanitizeAuditData(newValue),
      ipAddress: ipAddress || '',
    });
  } catch (error) {
    console.error('[AuditLog Error] Failed to write audit record:', error.message);
    return null;
  }
};

export default logAdminAction;
