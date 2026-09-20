import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { CustomerProfile } from '../src/models/CustomerProfile.js';
import { AdminProfile } from '../src/models/AdminProfile.js';
import { SuperAdminProfile } from '../src/models/SuperAdminProfile.js';
import { Vendor } from '../src/models/Vendor.js';
import { VendorBankAccount } from '../src/models/VendorBankAccount.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { authService } from '../src/services/authService.js';
import { tokenService } from '../src/services/tokenService.js';
import { vendorService } from '../src/services/vendorService.js';
import { ROLES, USER_STATUS } from '../src/constants/roles.js';
import { customerRegistrationSchema, vendorRegistrationSchema, customerProfileSchema } from '../src/validators/roleAuthValidators.js';
import { verifyAccessToken } from '../src/utils/jwt.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('  FAIRKART ROLE-SPECIFIC AUTH, PROFILES & SECURITY AUDIT TEST  ');
  console.log('===============================================================');

  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('[Database] Connected to MongoDB\n');

    const testTimestamp = Date.now();

    // -------------------------------------------------------------
    // Test 1: Canonical Roles Enforcement
    // -------------------------------------------------------------
    console.log('--- Suite 1: Canonical Roles & User Model ---');
    assert(ROLES.CUSTOMER === 'CUSTOMER', 'Canonical role CUSTOMER is defined');
    assert(ROLES.VENDOR === 'VENDOR', 'Canonical role VENDOR is defined');
    assert(ROLES.ADMIN === 'ADMIN', 'Canonical role ADMIN is defined');
    assert(ROLES.SUPER_ADMIN === 'SUPER_ADMIN', 'Canonical role SUPER_ADMIN is defined');
    assert(ROLES.USER === 'CUSTOMER', 'Legacy USER maps to canonical CUSTOMER');

    const legacyDbCount = await User.countDocuments({ role: 'USER' });
    assert(legacyDbCount === 0, `Zero documents in users collection have role 'USER' (found: ${legacyDbCount})`);

    // -------------------------------------------------------------
    // Test 2: Customer Registration & CustomerProfile
    // -------------------------------------------------------------
    console.log('\n--- Suite 2: Customer Registration & CustomerProfile ---');
    const customerEmail = `test_cust_${testTimestamp}@fairkart.dev`;
    const custRegResult = await authService.register({
      firstName: 'Rohan',
      lastName: 'Sharma',
      email: customerEmail,
      password: 'StrongPassword123!',
      mobileNumber: `98${testTimestamp.toString().slice(-8)}`,
      address: '123 MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
    });

    assert(custRegResult.user.role === ROLES.CUSTOMER, 'Registered user has canonical role CUSTOMER');
    assert(custRegResult.tokens.accessToken && custRegResult.tokens.refreshToken, 'Tokens generated on registration');

    const createdProfile = await CustomerProfile.findOne({ userId: custRegResult.user._id });
    assert(!!createdProfile, 'CustomerProfile was automatically created for new customer');
    assert(createdProfile.firstName === 'Rohan' && createdProfile.lastName === 'Sharma', 'CustomerProfile contains firstName and lastName');
    assert(createdProfile.addresses && createdProfile.addresses.length === 1, 'Customer address linked in CustomerProfile');

    // Test rejection of privilege escalation during registration
    let escalationBlocked = false;
    try {
      customerRegistrationSchema.parse({
        name: 'Attacker',
        email: 'attacker@evil.com',
        password: 'Password123!',
        role: 'SUPER_ADMIN',
      });
    } catch (err) {
      escalationBlocked = true;
    }
    assert(escalationBlocked, 'Customer registration schema strictly rejects role: SUPER_ADMIN payload');

    let adminFlagBlocked = false;
    try {
      customerRegistrationSchema.parse({
        name: 'Attacker',
        email: 'attacker2@evil.com',
        password: 'Password123!',
        isAdmin: true,
      });
    } catch (err) {
      adminFlagBlocked = true;
    }
    assert(adminFlagBlocked, 'Customer registration schema strictly rejects isAdmin: true payload');

    // -------------------------------------------------------------
    // Test 3: Referral Validation
    // -------------------------------------------------------------
    console.log('\n--- Suite 3: Referral Code Validation ---');
    let invalidRefRejected = false;
    try {
      await authService.register({
        name: 'Invalid Ref User',
        email: `invalid_ref_${testTimestamp}@fairkart.dev`,
        password: 'Password123!',
        referralCode: 'NON_EXISTENT_CODE_9999',
      });
    } catch (err) {
      if (err.message.includes('Invalid referral code')) {
        invalidRefRejected = true;
      }
    }
    assert(invalidRefRejected, 'Registration with invalid/fake referral code is rejected with 400 Bad Request');

    // Registration with valid referral code
    const referredCustomerEmail = `test_referred_${testTimestamp}@fairkart.dev`;
    const referredResult = await authService.register({
      name: 'Referred Customer',
      email: referredCustomerEmail,
      password: 'Password123!',
      referralCode: custRegResult.user.referralCode,
    });
    assert(String(referredResult.user.referredBy) === String(custRegResult.user._id), 'ReferredBy correctly resolved to referrer User ID');

    // -------------------------------------------------------------
    // Test 4: Vendor Registration & Bank Details Masking
    // -------------------------------------------------------------
    console.log('\n--- Suite 4: Vendor Registration & Bank Payout Masking ---');
    const vendorUser = await User.create({
      name: 'Test Vendor Owner',
      email: `test_vendor_${testTimestamp}@fairkart.dev`,
      passwordHash: await bcrypt.hash('Password123!', 10),
      role: ROLES.VENDOR,
      status: USER_STATUS.ACTIVE,
    });

    const vendorDoc = await Vendor.create({
      userId: vendorUser._id,
      storeName: `Organic Spices ${testTimestamp}`,
      slug: `organic-spices-${testTimestamp}`,
      status: 'APPROVED',
    });

    const rawAccountNumber = '12345678901234';
    const bankDoc = await VendorBankAccount.create({
      vendorId: vendorDoc._id,
      accountHolderName: 'Test Vendor Owner',
      bankName: 'HDFC Bank',
      accountNumber: rawAccountNumber,
      ifscCode: 'HDFC0001234',
      branchName: 'Koramangala',
    });

    assert(bankDoc.accountNumberMasked === 'XXXXXXXXXX1234', `Bank account number masked properly: ${bankDoc.accountNumberMasked}`);
    assert(bankDoc.accountNumberEncrypted && bankDoc.accountNumberEncrypted.includes(':'), 'Bank account number encrypted at rest with AES-256-GCM');

    // Verify safe DTO serialization
    const maskedJson = bankDoc.toMaskedJSON();
    assert(!maskedJson.accountNumberEncrypted, 'toMaskedJSON strips accountNumberEncrypted');
    assert(maskedJson.accountNumber === 'XXXXXXXXXX1234', 'toMaskedJSON returns masked account number');

    // Verify vendorService.getVendorProfile returns masked bank
    const vendorProfileResponse = await vendorService.getVendorProfile(vendorUser._id);
    assert(vendorProfileResponse.bank.accountNumber === 'XXXXXXXXXX1234', 'vendorService.getVendorProfile returns masked bank account');

    // Verify bank update
    const updatedBank = await vendorService.updateVendorBank(vendorUser._id, {
      accountHolderName: 'Test Vendor Owner Updated',
      bankName: 'ICICI Bank',
      accountNumber: '98765432109999',
      ifscCode: 'ICIC0005678',
    });
    assert(updatedBank.accountNumber === 'XXXXXXXXXX9999', 'updateVendorBank returns updated masked account number');

    // -------------------------------------------------------------
    // Test 5: Role-Specific Login Portal Isolation
    // -------------------------------------------------------------
    console.log('\n--- Suite 5: Role-Specific Login Portal Enforcement ---');
    // Customer login via Customer portal -> OK
    const custLogin = await authService.login({
      email: customerEmail,
      password: 'StrongPassword123!',
      portal: 'CUSTOMER',
    });
    assert(custLogin.user.role === ROLES.CUSTOMER, 'Customer successfully logs in via CUSTOMER portal');

    // Customer login via Vendor portal -> Blocked
    let custAtVendorPortalBlocked = false;
    try {
      await authService.login({
        email: customerEmail,
        password: 'StrongPassword123!',
        portal: 'VENDOR',
      });
    } catch (err) {
      custAtVendorPortalBlocked = err.statusCode === 403;
    }
    assert(custAtVendorPortalBlocked, 'Customer credentials rejected on VENDOR portal (403 Forbidden)');

    // Customer login via Admin portal -> Blocked
    let custAtAdminPortalBlocked = false;
    try {
      await authService.login({
        email: customerEmail,
        password: 'StrongPassword123!',
        portal: 'ADMIN',
      });
    } catch (err) {
      custAtAdminPortalBlocked = err.statusCode === 403;
    }
    assert(custAtAdminPortalBlocked, 'Customer credentials rejected on ADMIN portal (403 Forbidden)');

    // Customer login via Super Admin portal -> Blocked
    let custAtSuperAdminPortalBlocked = false;
    try {
      await authService.login({
        email: customerEmail,
        password: 'StrongPassword123!',
        portal: 'SUPER_ADMIN',
      });
    } catch (err) {
      custAtSuperAdminPortalBlocked = err.statusCode === 403;
    }
    assert(custAtSuperAdminPortalBlocked, 'Customer credentials rejected on SUPER_ADMIN portal (403 Forbidden)');

    // -------------------------------------------------------------
    // Test 6: Super Admin Provisioning of Admins & Profiles
    // -------------------------------------------------------------
    console.log('\n--- Suite 6: Super Admin Admin Provisioning & AdminProfile ---');
    const primarySuperAdmin = await User.findOne({ role: ROLES.SUPER_ADMIN, status: USER_STATUS.ACTIVE });
    assert(!!primarySuperAdmin, 'Active Super Admin account exists in database');

    const newAdminEmail = `test_admin_${testTimestamp}@fairkart.dev`;
    const mockReq = {
      user: primarySuperAdmin,
      body: {
        name: 'Finance Admin User',
        email: newAdminEmail,
        password: 'AdminPassword123!',
        role: ROLES.ADMIN,
      },
      ip: '127.0.0.1',
    };
    let createdAdminUser = null;
    await new Promise((resolve, reject) => {
      const mockRes = {
        status(code) {
          return {
            json(payload) {
              createdAdminUser = payload?.data?.admin;
              resolve(payload);
            },
          };
        },
      };
      const mockNext = (err) => reject(err);

      (import('../src/controllers/superAdminController.js')).then(mod => {
        mod.createAdmin(mockReq, mockRes, mockNext);
      }).catch(reject);
    });
    assert(!!createdAdminUser && createdAdminUser.role === ROLES.ADMIN, 'Super Admin successfully provisioned new ADMIN');

    const adminProfileDoc = await AdminProfile.findOne({ userId: createdAdminUser.id || createdAdminUser._id });
    assert(!!adminProfileDoc, 'AdminProfile automatically created for provisioned Admin');
    assert(String(adminProfileDoc.createdBy) === String(primarySuperAdmin._id), 'AdminProfile records createdBy Super Admin ID');

    // -------------------------------------------------------------
    // Test 7: JWT Claim Minimization
    // -------------------------------------------------------------
    console.log('\n--- Suite 7: JWT Security & Minimal Claims ---');
    const userTokens = await tokenService.generateTokens(primarySuperAdmin);
    const decodedPayload = verifyAccessToken(userTokens.accessToken);
    assert(decodedPayload.id && decodedPayload.role, 'JWT contains id and role');
    assert(!decodedPayload.password && !decodedPayload.passwordHash, 'JWT does not contain password or passwordHash');
    assert(!decodedPayload.bankAccount && !decodedPayload.accountNumber, 'JWT does not contain bank details');
    assert(!decodedPayload.email, 'JWT access token conforms to minimal claims without redundant email');

    // -------------------------------------------------------------
    // Test 8: Refresh Token Rotation & Reuse Detection
    // -------------------------------------------------------------
    console.log('\n--- Suite 8: Refresh Token Rotation & Family Reuse Detection ---');
    const initialRefreshToken = userTokens.refreshToken;

    // First rotation (valid)
    const rotatedUser = await tokenService.verifyAndRotateRefreshToken(initialRefreshToken);
    assert(!!rotatedUser, 'Valid refresh token rotation succeeded');
    const secondTokens = await tokenService.generateTokens(rotatedUser);

    // Stolen/Reused token submission (attempting to use initialRefreshToken again)
    let reuseDetected = false;
    try {
      await tokenService.verifyAndRotateRefreshToken(initialRefreshToken);
    } catch (err) {
      if (err.message.includes('reuse detected') || err.message.includes('Session terminated')) {
        reuseDetected = true;
      }
    }
    assert(reuseDetected, 'Refresh token reuse detected when re-submitting previously rotated token');

    // Verify that the entire session family was invalidated
    const refreshedUserDb = await User.findById(primarySuperAdmin._id).select('+refreshTokenHash');
    assert(refreshedUserDb.refreshTokenHash === null, 'Token family revoked: active refreshTokenHash set to null');

    // -------------------------------------------------------------
    // Test 9: Profile Editing Protected Fields
    // -------------------------------------------------------------
    console.log('\n--- Suite 9: Protected Fields in Profile Editing ---');
    let profileEscalationBlocked = false;
    try {
      customerProfileSchema.parse({
        name: 'Legit Name',
        role: 'SUPER_ADMIN',
      });
    } catch (err) {
      profileEscalationBlocked = true;
    }
    assert(profileEscalationBlocked, 'customerProfileSchema rejects attempts to inject role: SUPER_ADMIN');

    // -------------------------------------------------------------
    // Test 10: Audit Log Security & Sanitization
    // -------------------------------------------------------------
    console.log('\n--- Suite 10: Audit Log Sanitization & Sensitive Event Tracking ---');
    const sampleAudit = await (await import('../src/services/auditLogService.js')).logAdminAction({
      userId: primarySuperAdmin._id,
      action: 'SECURITY_AUDIT_TEST',
      entity: 'Test',
      entityId: '123',
      oldValue: { password: 'PlainTextPassword!', accountNumber: '1234567890' },
      newValue: { token: 'secret_jwt_token', mfaSecret: 'JBSWY3DPEHPK3PXP', accountNumber: '9876543210' },
    });

    assert(sampleAudit.oldValue.password === '[REDACTED]', 'AuditLog masks password with [REDACTED]');
    assert(sampleAudit.newValue.token === '[REDACTED]', 'AuditLog masks token with [REDACTED]');
    assert(sampleAudit.newValue.mfaSecret === '[REDACTED]', 'AuditLog masks mfaSecret with [REDACTED]');
    assert(sampleAudit.oldValue.accountNumber === 'XXXXXX7890', `AuditLog masks bank account: ${sampleAudit.oldValue.accountNumber}`);

    // Cleanup test data
    await User.deleteMany({ email: { $in: [customerEmail, referredCustomerEmail, newAdminEmail, `test_vendor_${testTimestamp}@fairkart.dev`] } });
    await CustomerProfile.deleteMany({ userId: { $in: [custRegResult.user._id, referredResult.user._id] } });
    if (createdAdminUser) {
      await AdminProfile.deleteMany({ userId: createdAdminUser.id || createdAdminUser._id });
    }
    await Vendor.deleteMany({ _id: vendorDoc._id });
    await VendorBankAccount.deleteMany({ _id: bankDoc._id });
    await AuditLog.deleteMany({ action: 'SECURITY_AUDIT_TEST' });

    console.log('\n===============================================================');
    console.log(`  AUDIT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================');

    await mongoose.disconnect();
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
