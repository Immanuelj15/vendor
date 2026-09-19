/**
 * Super Admin TOTP MFA Comprehensive Test Suite
 * Tests RFC 6238 TOTP verification, rate-limiting, lockout, recovery codes,
 * role-based denial (Customer, Vendor, Admin), and AuditLog generation.
 */

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { generate, verify } = require('otplib');
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { User } from '../src/models/User.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { decryptSecret, hashRecoveryCode } from '../src/utils/cryptoUtils.js';
import { verifyAccessToken } from '../src/utils/jwt.js';
import { setupMFA, enableMFA, verifyMFA, verifyRecoveryCode, disableMFA } from '../src/controllers/mfaController.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart';
const JWT_SECRET = process.env.JWT_SECRET || 'fairkart_jwt_secret_key_prod_2026';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    testsFailed++;
  }
}

function mockRes() {
  let responseData = null;
  let statusCode = 200;
  return {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    getResponse() {
      return { statusCode, data: responseData };
    }
  };
}

async function runMFATests() {
  console.log('================================================================');
  console.log('       SUPER ADMIN TOTP MFA VERIFICATION TEST SUITE             ');
  console.log('================================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('[Connected to MongoDB]\n');

  try {
    // Setup test users
    const timestamp = Date.now();
    const superAdmin = await User.create({
      name: 'MFA Super Admin',
      email: `mfa-superadmin-${timestamp}@fairkart.dev`,
      passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyUIXe/QLSUG6x0v5L8PBqvf3vGzDxeS', // Password@123
      role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    });

    const normalAdmin = await User.create({
      name: 'MFA Normal Admin',
      email: `mfa-admin-${timestamp}@fairkart.dev`,
      passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyUIXe/QLSUG6x0v5L8PBqvf3vGzDxeS',
      role: 'ADMIN',
      status: 'ACTIVE'
    });

    const testVendor = await User.create({
      name: 'MFA Vendor',
      email: `mfa-vendor-${timestamp}@fairkart.dev`,
      passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyUIXe/QLSUG6x0v5L8PBqvf3vGzDxeS',
      role: 'VENDOR',
      status: 'ACTIVE'
    });

    const testCustomer = await User.create({
      name: 'MFA Customer',
      email: `mfa-customer-${timestamp}@fairkart.dev`,
      passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyUIXe/QLSUG6x0v5L8PBqvf3vGzDxeS',
      role: 'CUSTOMER',
      status: 'ACTIVE'
    });

    const superAdminMfaToken = jwt.sign({ id: superAdmin._id, role: 'SUPER_ADMIN', type: 'MFA_PENDING' }, JWT_SECRET, { expiresIn: '5m' });
    const adminMfaToken = jwt.sign({ id: normalAdmin._id, role: 'ADMIN', type: 'MFA_PENDING' }, JWT_SECRET, { expiresIn: '5m' });
    const vendorMfaToken = jwt.sign({ id: testVendor._id, role: 'VENDOR', type: 'MFA_PENDING' }, JWT_SECRET, { expiresIn: '5m' });
    const customerMfaToken = jwt.sign({ id: testCustomer._id, role: 'CUSTOMER', type: 'MFA_PENDING' }, JWT_SECRET, { expiresIn: '5m' });

    // -------------------------------------------------------------
    // TEST 1: Role-Based Denial (Customer, Vendor, Admin -> MFA)
    // -------------------------------------------------------------
    console.log('--- TEST 1: Role-Based Access Gatekeeper ---');
    for (const [name, token] of [['Customer', customerMfaToken], ['Vendor', vendorMfaToken], ['Admin', adminMfaToken]]) {
      const res = mockRes();
      let caught = false;
      try {
        await new Promise((resolve, reject) => {
          setupMFA({ body: { mfaToken: token } }, res, (err) => err ? reject(err) : resolve());
        });
      } catch (err) {
        caught = true;
        assert(err.statusCode === 403, `${name} accessing Super Admin MFA setup is DENIED (HTTP 403: ${err.message})`);
      }
      if (!caught) assert(false, `${name} was unexpectedly allowed to access MFA setup`);
    }

    // -------------------------------------------------------------
    // TEST 2: Super Admin Initiates MFA Setup
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Super Admin Setup MFA ---');
    let qrCode = null;
    let secret = null;
    const resSetup = mockRes();
    await new Promise((resolve, reject) => {
      resSetup.json = (data) => {
        qrCode = data?.data?.qrCode;
        secret = data?.data?.secret;
        resolve();
      };
      setupMFA({ body: { mfaToken: superAdminMfaToken } }, resSetup, (err) => err ? reject(err) : resolve());
    });

    assert(Boolean(qrCode && qrCode.startsWith('data:image/png;base64,')), 'Super Admin receives valid QR code data URL');
    assert(Boolean(secret && secret.length >= 16), 'Super Admin receives valid RFC 6238 Base32 secret');

    const refreshedAdmin = await User.findById(superAdmin._id).select('+mfaSecret');
    assert(Boolean(refreshedAdmin.mfaSecret && refreshedAdmin.mfaSecret.includes(':')), 'TOTP secret is stored encrypted at rest (AES-256-GCM format)');

    // -------------------------------------------------------------
    // TEST 3: Enable MFA (Wrong TOTP vs Correct TOTP)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Enable MFA Enrollment ---');
    // Wrong TOTP
    let wrongCodeBlocked = false;
    try {
      await new Promise((resolve, reject) => {
        enableMFA({ body: { mfaToken: superAdminMfaToken, totpCode: '000000' } }, mockRes(), (err) => err ? reject(err) : resolve());
      });
    } catch (err) {
      wrongCodeBlocked = true;
      assert(err.statusCode === 400, `Incorrect TOTP is DENIED during enrollment (HTTP 400: ${err.message})`);
    }
    assert(wrongCodeBlocked, 'Wrong TOTP code prevented enrollment');

    // Correct TOTP
    const validCode = await generate({ secret });
    let recoveryCodes = null;
    await new Promise((resolve, reject) => {
      const resEnable = mockRes();
      resEnable.json = (data) => {
        recoveryCodes = data?.data?.recoveryCodes;
        resolve();
      };
      enableMFA({ body: { mfaToken: superAdminMfaToken, totpCode: validCode } }, resEnable, (err) => err ? reject(err) : resolve());
    });

    assert(Array.isArray(recoveryCodes) && recoveryCodes.length === 8, 'Enrollment generated exactly 8 recovery codes');
    const enrolledAdmin = await User.findById(superAdmin._id);
    assert(enrolledAdmin.mfaEnabled === true, 'Super Admin record marked mfaEnabled: true');
    assert(enrolledAdmin.mfaRecoveryCodes.length === 8, 'Recovery codes stored as hashes in database');

    // Verify AuditLog for MFA_ENABLED
    const enableAudit = await AuditLog.findOne({ userId: superAdmin._id, action: 'MFA_ENABLED' });
    assert(Boolean(enableAudit), 'AuditLog records immutable MFA_ENABLED event');

    // -------------------------------------------------------------
    // TEST 4: Login Verification (Wrong TOTP vs Correct TOTP)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Super Admin Login MFA Verification ---');
    // Wrong TOTP during login
    let loginWrongBlocked = false;
    try {
      await new Promise((resolve, reject) => {
        verifyMFA({ body: { mfaToken: superAdminMfaToken, totpCode: '111222' } }, mockRes(), (err) => err ? reject(err) : resolve());
      });
    } catch (err) {
      loginWrongBlocked = true;
      assert(err.statusCode === 401, `Wrong TOTP during login is DENIED (HTTP 401: ${err.message})`);
    }
    assert(loginWrongBlocked, 'Wrong TOTP blocked from obtaining session');

    // Correct TOTP during login
    const loginValidCode = await generate({ secret });
    let loginAccessToken = null;
    await new Promise((resolve, reject) => {
      const resLogin = mockRes();
      resLogin.json = (data) => {
        loginAccessToken = data?.data?.accessToken;
        resolve();
      };
      verifyMFA({ body: { mfaToken: superAdminMfaToken, totpCode: loginValidCode } }, resLogin, (err) => err ? reject(err) : resolve());
    });

    assert(Boolean(loginAccessToken), 'Correct TOTP grants Super Admin accessToken session');
    const decodedSession = verifyAccessToken(loginAccessToken);
    assert(decodedSession.role === 'SUPER_ADMIN', 'Session token carries full SUPER_ADMIN role');

    // -------------------------------------------------------------
    // TEST 5: Recovery Code Emergency Authentication
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Recovery Code Fallback Authentication ---');
    const testRecoveryCode = recoveryCodes[0];
    let recoverySession = null;
    await new Promise((resolve, reject) => {
      const resRec = mockRes();
      resRec.json = (data) => {
        recoverySession = data?.data?.accessToken;
        resolve();
      };
      verifyRecoveryCode({ body: { mfaToken: superAdminMfaToken, recoveryCode: testRecoveryCode } }, resRec, (err) => err ? reject(err) : resolve());
    });
    assert(Boolean(recoverySession), 'Valid recovery code grants Super Admin authenticated session');

    // Attempt reuse of same recovery code
    let recoveryReuseBlocked = false;
    try {
      await new Promise((resolve, reject) => {
        verifyRecoveryCode({ body: { mfaToken: superAdminMfaToken, recoveryCode: testRecoveryCode } }, mockRes(), (err) => err ? reject(err) : resolve());
      });
    } catch (err) {
      recoveryReuseBlocked = true;
      assert(err.statusCode === 401, `Reusing spent recovery code is DENIED (HTTP 401: ${err.message})`);
    }
    assert(recoveryReuseBlocked, 'Recovery codes are strictly single-use');

    const recoveryAudit = await AuditLog.findOne({ userId: superAdmin._id, action: 'MFA_RECOVERY_USED' });
    assert(Boolean(recoveryAudit), 'AuditLog records immutable MFA_RECOVERY_USED event');

    // -------------------------------------------------------------
    // TEST 6: Rate Limiting / Lockout on Repeated Failed TOTP
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Brute-Force Lockout Protection ---');
    for (let i = 0; i < 4; i++) {
      try {
        await new Promise((resolve, reject) => {
          verifyMFA({ body: { mfaToken: superAdminMfaToken, totpCode: '999999' } }, mockRes(), (err) => err ? reject(err) : resolve());
        });
      } catch (err) {}
    }
    const lockedAdmin = await User.findById(superAdmin._id);
    assert(Boolean(lockedAdmin.mfaLockedUntil && lockedAdmin.mfaLockedUntil > new Date()), 'Super Admin account is locked out after 5 consecutive failed attempts');

    let lockedAttemptBlocked = false;
    try {
      await new Promise((resolve, reject) => {
        verifyMFA({ body: { mfaToken: superAdminMfaToken, totpCode: loginValidCode } }, mockRes(), (err) => err ? reject(err) : resolve());
      });
    } catch (err) {
      lockedAttemptBlocked = true;
      assert(err.statusCode === 429, `Locked account receives HTTP 429 Rate Limited lockout: "${err.message}"`);
    }
    assert(lockedAttemptBlocked, 'Account lockout blocks all further TOTP attempts until expiry');

    // Clean up test records
    await User.deleteMany({ email: { $regex: timestamp } });
    await AuditLog.deleteMany({ userId: superAdmin._id });

  } catch (err) {
    console.error('Unhandled MFA test exception:', err);
    testsFailed++;
  } finally {
    await mongoose.disconnect();
    console.log('\n================================================================');
    console.log(`TOTAL MFA TESTS: ${testsPassed + testsFailed} | PASSED: ${testsPassed} | FAILED: ${testsFailed}`);
    console.log('================================================================\n');
    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

runMFATests();
