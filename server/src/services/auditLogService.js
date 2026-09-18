import { AuditLog } from '../models/AuditLog.js';

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
      oldValue: oldValue || null,
      newValue: newValue || null,
      ipAddress: ipAddress || '',
    });
  } catch (error) {
    console.error('[AuditLog Error] Failed to write audit record:', error.message);
    return null;
  }
};
