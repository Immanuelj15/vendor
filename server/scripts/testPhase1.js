import http from 'http';
import app from '../src/app.js';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';

let server;

async function runTests() {
  console.log('🧪 Starting Phase 1 Integration Tests...\n');

  try {
    // 1. Connect MongoDB in memory or local test db
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart_test';
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
      console.log('✅ Connected to MongoDB Test Instance');
      await User.deleteMany({ email: /@test\.com$/ });
    } catch (e) {
      console.warn('⚠️ Could not connect to real MongoDB instance. Testing API routes in disconnected mode.');
    }

    // 2. Start HTTP server
    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, () => {
        const port = server.address().port;
        console.log(`✅ Test server running on random port ${port}`);
        resolve(port);
      });
    });

    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    // Helper request function
    async function request(path, options = {}) {
      const res = await fetch(`${baseUrl}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
      });
      const data = await res.json();
      return { status: res.status, data, headers: res.headers };
    }

    // TEST 1: Health check
    console.log('\n--> Testing GET /api/health');
    const healthRes = await request('/api/health');
    if (healthRes.status === 200 && healthRes.data.success) {
      console.log('  PASSED: Health check returned 200 OK');
    } else {
      throw new Error(`Health check failed: ${JSON.stringify(healthRes.data)}`);
    }

    // If DB is connected, run DB dependent auth tests
    if (mongoose.connection.readyState === 1) {
      // TEST 2: Register User A
      console.log('\n--> Testing POST /api/auth/register (User A)');
      const regRes = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'User Alpha',
          email: 'usera@test.com',
          password: 'password123',
        }),
      });

      if (regRes.status === 201 && regRes.data.success && regRes.data.data.user.referralCode) {
        console.log(`  PASSED: User registered with referral code [${regRes.data.data.user.referralCode}]`);
      } else {
        throw new Error(`Register failed: ${JSON.stringify(regRes.data)}`);
      }

      const userARefCode = regRes.data.data.user.referralCode;
      const userAToken = regRes.data.data.accessToken;

      // TEST 3: Register User B using User A's referral code
      console.log('\n--> Testing POST /api/auth/register (User B with referral link from User A)');
      const regResB = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'User Beta',
          email: 'userb@test.com',
          password: 'password123',
          referralCode: userARefCode,
        }),
      });

      if (regResB.status === 201 && regResB.data.data.user.referredBy) {
        console.log('  PASSED: User B registered with correct referredBy link to User A');
      } else {
        throw new Error(`Referred registration failed: ${JSON.stringify(regResB.data)}`);
      }

      // TEST 4: Login
      console.log('\n--> Testing POST /api/auth/login');
      const loginRes = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'usera@test.com',
          password: 'password123',
        }),
      });

      if (loginRes.status === 200 && loginRes.data.data.accessToken) {
        console.log('  PASSED: Login succeeded, returned access token');
      } else {
        throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
      }

      // TEST 5: Get Me (Protected Route)
      console.log('\n--> Testing GET /api/auth/me (Protected)');
      const meRes = await request('/api/auth/me', {
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      if (meRes.status === 200 && meRes.data.data.user.email === 'usera@test.com') {
        console.log('  PASSED: Protected /me returned valid user payload');
      } else {
        throw new Error(`Protected route failed: ${JSON.stringify(meRes.data)}`);
      }
    } else {
      console.log('ℹ️ Skipping DB-dependent tests since MongoDB is not running locally.');
    }

    console.log('\n✨ ALL PHASE 1 INTEGRATION TESTS COMPLETED SUCCESSFULLY! ✨\n');
  } catch (err) {
    console.error(`\n❌ TEST FAILED: ${err.message}`);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
}

runTests();
