import http from 'http';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Settings } from '../src/models/Settings.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { triggerJobsManually } from '../src/jobs/jobRunner.js';
import { env } from '../src/config/env.js';

dotenv.config();

let server;

async function runTests() {
  console.log('🧪 Starting Phase 10 integration and security tests...\n');

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27018/fairkart_test';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ Connected to MongoDB Test Instance');

    // Clean test users
    await User.deleteMany({ email: /@testphase10\.com$/ });
    await Settings.deleteMany({ key: 'TEST_SETTING' });

    // Start HTTP Server
    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, () => {
        const port = server.address().port;
        console.log(`✅ Test server running on port ${port}`);
        resolve(port);
      });
    });

    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    // Request helper
    async function request(path, options = {}) {
      const res = await fetch(`${baseUrl}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
      });
      const contentType = res.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }
      return { status: res.status, data, headers: res.headers };
    }

    // Seed test users
    const adminUser = await User.create({
      name: 'Admin Ten',
      email: 'admin@testphase10.com',
      passwordHash: 'password',
      role: 'ADMIN',
      status: 'ACTIVE',
      referralCode: User.generateReferralCode('Admin Ten')
    });

    const superAdminUser = await User.create({
      name: 'Super Admin Ten',
      email: 'superadmin@testphase10.com',
      passwordHash: 'password',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      referralCode: User.generateReferralCode('Super Admin Ten')
    });

    const normalUser = await User.create({
      name: 'Normal Ten',
      email: 'user@testphase10.com',
      passwordHash: 'password',
      role: 'USER',
      status: 'ACTIVE',
      referralCode: User.generateReferralCode('Normal Ten')
    });

    // Helper to generate access tokens
    const getAuthHeader = (user) => {
      const token = jwt.sign({ id: user._id, role: user.role }, env.JWT_ACCESS_SECRET);
      return { Authorization: `Bearer ${token}` };
    };

    const adminHeaders = getAuthHeader(adminUser);
    const superAdminHeaders = getAuthHeader(superAdminUser);
    const userHeaders = getAuthHeader(normalUser);

    // TEST 1: Health Probes
    console.log('\n--> Testing Health Probe Endpoints');
    const healthRes = await request('/api/health');
    const livenessRes = await request('/api/health/liveness');
    const readinessRes = await request('/api/health/readiness');

    if (healthRes.status === 200 && livenessRes.status === 200 && readinessRes.status === 200) {
      console.log('  PASSED: Health, Liveness, and Readiness endpoints returned 200 OK');
    } else {
      throw new Error(`Health check failures: Health:${healthRes.status}, Live:${livenessRes.status}, Ready:${readinessRes.status}`);
    }

    // TEST 2: RBAC and IDOR isolation
    console.log('\n--> Testing RBAC & IDOR Route Security');
    const userAlertsRes = await request('/api/admin/alerts', { headers: userHeaders });
    if (userAlertsRes.status === 403) {
      console.log('  PASSED: Normal user was correctly blocked (403 Forbidden) from admin endpoint');
    } else {
      throw new Error(`RBAC failure: Normal user got status ${userAlertsRes.status} on admin route`);
    }

    const adminAlertsRes = await request('/api/admin/alerts', { headers: adminHeaders });
    if (adminAlertsRes.status === 200) {
      console.log('  PASSED: Admin allowed access to admin route');
    } else {
      throw new Error(`RBAC failure: Admin blocked on admin route: ${adminAlertsRes.status}`);
    }

    // TEST 3: Settings validation checks
    console.log('\n--> Testing Settings Validation');
    const badMlmRes = await request('/api/admin/settings', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        key: 'MLM_CONFIG',
        category: 'MLM',
        value: { maxLevels: 3, levels: [{ level: 1, percentage: 150 }] } // 150% is invalid
      })
    });

    if (badMlmRes.status === 400) {
      console.log('  PASSED: Blocked invalid MLM setting (>100% commission)');
    } else {
      throw new Error(`Settings validation failure: Accepted invalid MLM value: ${badMlmRes.status}`);
    }

    const credSettingsRes = await request('/api/admin/settings', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        key: 'DB_PASSWORD_SECRET',
        category: 'GENERAL',
        value: 'hacked_pw'
      })
    });

    if (credSettingsRes.status === 400) {
      console.log('  PASSED: Blocked sensitive credentials from ordinary Settings');
    } else {
      throw new Error(`Settings validation failure: Accepted sensitive secret credentials`);
    }

    // TEST 4: Analytics query execution
    console.log('\n--> Testing UTC Date Filtering and Analytics API');
    const revAnalyticsRes = await request('/api/admin/analytics/revenue?range=7days', { headers: adminHeaders });
    if (revAnalyticsRes.status === 200 && revAnalyticsRes.data.success) {
      console.log('  PASSED: Revenue analytics returned successfully with date range query');
    } else {
      throw new Error(`Analytics failure: ${JSON.stringify(revAnalyticsRes.data)}`);
    }

    // TEST 5: CSV Export Headers
    console.log('\n--> Testing CSV Export Stream headers');
    const csvRes = await request('/api/admin/exports/users', { headers: adminHeaders });
    if (csvRes.status === 200 && csvRes.headers.get('content-type').includes('text/csv')) {
      console.log('  PASSED: Streaming CSV endpoint returned text/csv content-type');
    } else {
      throw new Error(`CSV export failure: Status:${csvRes.status}, Content-Type:${csvRes.headers.get('content-type')}`);
    }

    // TEST 6: Background jobs trigger
    console.log('\n--> Testing Scheduled Jobs execution');
    await triggerJobsManually();
    console.log('  PASSED: Manual triggering of subscription expiry and failed settlements jobs succeeded');

    console.log('\n✨ ALL PHASE 10 INTEGRATION AND SECURITY TESTS COMPLETED SUCCESSFULLY! ✨');

    // Tear down
    server.close();
    await mongoose.disconnect();
    process.exit(0);

  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err);
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
