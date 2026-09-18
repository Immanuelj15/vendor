import mongoose from 'dotenv';
import http from 'http';

async function testEndpoint() {
  console.log('🔒 Running Super Admin Security Verification Suite...\n');

  // Helper for requests
  const makeRequest = (path, method = 'GET', token = null, body = null) => {
    return new Promise((resolve, reject) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const postData = body ? JSON.stringify(body) : null;
      if (postData) headers['Content-Length'] = Buffer.byteLength(postData);

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: 5000,
          path,
          method,
          headers,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch (e) {
              resolve({ status: res.statusCode, raw: data });
            }
          });
        }
      );
      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
    });
  };

  const login = async (email, password) => {
    const res = await makeRequest('/api/auth/login', 'POST', null, { email, password });
    return res.body?.data?.accessToken;
  };

  try {
    // 1. Unauthenticated request
    const unauth = await makeRequest('/api/super-admin/dashboard');
    console.log(`[Test 1] Unauthenticated request -> HTTP ${unauth.status} (Expected: 401)`);
    if (unauth.status !== 401) throw new Error('Unauthenticated check failed');

    // 2. Regular user request
    const userToken = await login('user@fairkart.dev', 'Password@123');
    const userRes = await makeRequest('/api/super-admin/dashboard', 'GET', userToken);
    console.log(`[Test 2] Regular USER request -> HTTP ${userRes.status} (Expected: 403)`);
    if (userRes.status !== 403) throw new Error('Normal user was not blocked');

    // 3. Normal admin request
    const adminToken = await login('manager@fairkart.dev', 'Password@123');
    const adminRes = await makeRequest('/api/super-admin/dashboard', 'GET', adminToken);
    console.log(`[Test 3] Normal ADMIN request -> HTTP ${adminRes.status} (Expected: 403)`);
    if (adminRes.status !== 403) throw new Error('Normal admin was not blocked from Super Admin API');

    // 4. Super admin request
    const superToken = await login('admin@fairkart.dev', 'Password@123');
    const superRes = await makeRequest('/api/super-admin/dashboard', 'GET', superToken);
    console.log(`[Test 4] SUPER_ADMIN request -> HTTP ${superRes.status} (Expected: 200)`);
    if (superRes.status !== 200) throw new Error('Super Admin access failed');
    console.log('         Total users returned:', superRes.body?.data?.metrics?.totalUsers);
    console.log('         Total admins returned:', superRes.body?.data?.metrics?.totalAdmins);

    // 5. Test Safeguard: Super admin cannot demote self if only 1 exists
    const superUserObj = await makeRequest('/api/auth/me', 'GET', superToken);
    const superAdminId = superUserObj.body?.data?.user?._id;

    const demoteRes = await makeRequest(
      `/api/super-admin/users/${superAdminId}`,
      'PUT',
      superToken,
      { role: 'USER' }
    );
    console.log(`[Test 5] Safeguard: Demote last Super Admin -> HTTP ${demoteRes.status} (Expected: 400)`);
    console.log('         Message:', demoteRes.body?.message);
    if (demoteRes.status !== 400) throw new Error('Demotion safeguard failed');

    console.log('\n✅ ALL BACKEND SECURITY TESTS PASSED PERFECTLY!\n');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testEndpoint();
