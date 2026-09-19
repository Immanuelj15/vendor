import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const ENCRYPTION_KEY_SOURCE = process.env.MFA_ENCRYPTION_KEY || process.env.JWT_SECRET || 'fairkart_mfa_secure_key_32_bytes_2026';
// Derive a 32-byte key using SHA-256
const ALGORITHM = 'aes-256-gcm';
const KEY = crypto.createHash('sha256').update(ENCRYPTION_KEY_SOURCE).digest();

/**
 * Encrypt plaintext (e.g. TOTP secret) with AES-256-GCM
 */
export function encryptSecret(plainText) {
  if (!plainText) return '';
  const iv = crypto.randomBytes(12); // 12-byte IV standard for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt ciphertext with AES-256-GCM
 */
export function decryptSecret(cipherText) {
  if (!cipherText || !cipherText.includes(':')) return '';
  const parts = cipherText.split(':');
  if (parts.length !== 3) return '';
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Hash recovery code with SHA-256
 */
export function hashRecoveryCode(code) {
  return crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
}

/**
 * Generate 8 random recovery codes formatted as XXXX-XXXX
 */
export function generateRecoveryCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
    codes.push(formatted);
  }
  return codes;
}
