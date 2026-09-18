process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart_test';
import mongoose from 'mongoose';

// Monkeypatch mongoose to disable transactions on standalone local MongoDB
const originalStartSession = mongoose.startSession;
mongoose.startSession = async function(...args) {
  const session = await originalStartSession.apply(this, args);
  if (session) {
    session.startTransaction = function() {};
    session.commitTransaction = async function() {};
    session.abortTransaction = async function() {};
  }
  return session;
};

import http from 'http';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Territory } from '../src/models/Territory.js';
import { Franchise } from '../src/models/Franchise.js';
import { Shopkeeper } from '../src/models/Shopkeeper.js';
import { Shop } from '../src/models/Shop.js';
import { ShopQRCode } from '../src/models/ShopQRCode.js';
import { CustomerShopAttribution } from '../src/models/CustomerShopAttribution.js';
import { Referral } from '../src/models/Referral.js';
import { Order } from '../src/models/Order.js';

let server;

async function runTests() {
  console.log('🧪 Starting Phase 4 Integration & Security Tests...\n');

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart_test';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ Connected to MongoDB Test Instance');

    // Clean up
    await User.deleteMany({ email: /@test4\.com$/ });
    await Territory.deleteMany({});
    await Franchise.deleteMany({});
    await Shopkeeper.deleteMany({});
    await Shop.deleteMany({});
    await ShopQRCode.deleteMany({});
    await CustomerShopAttribution.deleteMany({});
    await Referral.deleteMany({});
    await Order.deleteMany({});

    // Start HTTP server
    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, () => {
        const port = server.address().port;
        console.log(`✅ Test server running on random port ${port}`);
        resolve(port);
      });
    });

    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    async function request(path, options = {}) {
      const { headers, ...rest } = options;
      const res = await fetch(`${baseUrl}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(headers || {}) },
        ...rest,
      });
      const data = await res.json();
      return { status: res.status, data, headers: res.headers };
    }

    // 1. Create Users
    console.log('\n--> Registering Users...');
    const regAdmin = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Admin User', email: 'admin@test4.com', password: 'password123' })
    });
    const regSkA = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Shopkeeper A', email: 'ska@test4.com', password: 'password123' })
    });
    const regSkB = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Shopkeeper B', email: 'skb@test4.com', password: 'password123' })
    });
    const regCust1 = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Customer One', email: 'cust1@test4.com', password: 'password123' })
    });
    const regCust2 = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Customer Two', email: 'cust2@test4.com', password: 'password123' })
    });
    const regFranchise = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Taluk Franchise', email: 'taluk@test4.com', password: 'password123' })
    });

    // Make admin user real admin
    await User.findByIdAndUpdate(regAdmin.data.data.user._id, { role: 'ADMIN' });
    const adminToken = regAdmin.data.data.accessToken;

    const userSkA = regSkA.data.data.user;
    const userSkB = regSkB.data.data.user;
    const cust1Token = regCust1.data.data.accessToken;
    const cust2Token = regCust2.data.data.accessToken;
    const skAToken = regSkA.data.data.accessToken;
    const skBToken = regSkB.data.data.accessToken;
    const franchiseToken = regFranchise.data.data.accessToken;

    // 2. Setup Territories, Franchise, Shopkeeper, and Shop for A & B
    console.log('\n--> Setting up Shops...');
    const territory = await Territory.create({ type: 'TALUK', name: 'Test Taluk', code: 'TT1', state: 'Test State', district: 'Test District' });
    const franchise = await Franchise.create({ userId: regFranchise.data.data.user._id, franchiseType: 'TALUK', territoryId: territory._id, status: 'ACTIVE', businessName: 'Test Franchise Corp', phone: '1234567890', email: 'fran@test4.com', createdBy: regAdmin.data.data.user._id });
    
    // Promote franchise user
    await User.findByIdAndUpdate(regFranchise.data.data.user._id, { role: 'TALUK_FRANCHISE' });

    const skProfileA = await Shopkeeper.create({ userId: userSkA._id, talukFranchiseId: franchise._id, status: 'ACTIVE', onboardingStatus: 'APPROVED', kycStatus: 'APPROVED', businessName: 'Store A', phone: '1234567891', email: 'ska@test4.com' });
    const skProfileB = await Shopkeeper.create({ userId: userSkB._id, talukFranchiseId: franchise._id, status: 'ACTIVE', onboardingStatus: 'APPROVED', kycStatus: 'APPROVED', businessName: 'Store B', phone: '1234567892', email: 'skb@test4.com' });

    // Promote shopkeepers
    await User.findByIdAndUpdate(userSkA._id, { role: 'SHOPKEEPER' });
    await User.findByIdAndUpdate(userSkB._id, { role: 'SHOPKEEPER' });

    const shopA = await Shop.create({ shopkeeperId: skProfileA._id, talukFranchiseId: franchise._id, shopName: 'Shop A', shopCode: 'SHOPA', slug: 'shop-a-1234', address: '12 Main Rd', state: 'Test State', district: 'Test District', taluk: 'Test Taluk', pincode: '600001', phone: '1234567891', email: 'ska@test4.com', status: 'ACTIVE', kycStatus: 'APPROVED' });
    const shopB = await Shop.create({ shopkeeperId: skProfileB._id, talukFranchiseId: franchise._id, shopName: 'Shop B', shopCode: 'SHOPB', slug: 'shop-b-1234', address: '14 Main Rd', state: 'Test State', district: 'Test District', taluk: 'Test Taluk', pincode: '600001', phone: '1234567892', email: 'skb@test4.com', status: 'ACTIVE', kycStatus: 'APPROVED' });

    console.log('  PASSED: Shops created.');

    // ==========================================
    // QR TESTS
    // ==========================================
    console.log('\n🧪 Running QR Tests...');
    
    // 1. Generate QR code (authenticated, by Shopkeeper A)
    const genQR = await request(`/api/shops/${shopA._id}/qr`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${skAToken}` }
    });

    if (genQR.status === 200 && genQR.data.data.qr.status === 'ACTIVE') {
      console.log('  PASSED: 1. Generate QR Code works');
    } else {
      throw new Error(`QR generation failed: ${JSON.stringify(genQR.data)}`);
    }

    const tokenA = genQR.data.data.qr.publicToken;

    // 2. Duplicate generation (returns existing active QR code)
    const dupQR = await request(`/api/shops/${shopA._id}/qr`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${skAToken}` }
    });

    if (dupQR.status === 200 && dupQR.data.data.qr.publicToken === tokenA) {
      console.log('  PASSED: 2. Duplicate QR generation returns existing token');
    } else {
      throw new Error('Duplicate QR generation failed.');
    }

    // 3. Resolve QR code publicly
    const resolveQR = await request(`/api/shops/qr/${tokenA}`);
    if (resolveQR.status === 200 && resolveQR.data.data.shopName === 'Shop A') {
      console.log('  PASSED: 3. Resolve active QR code works');
    } else {
      throw new Error(`Resolve QR failed: ${JSON.stringify(resolveQR.data)}`);
    }

    // 4. Invalid QR token lookup (should fail with 404)
    const badResolve = await request(`/api/shops/qr/invalid-token`);
    if (badResolve.status === 404) {
      console.log('  PASSED: 4. Invalid QR token rejected with 404');
    } else {
      throw new Error('Invalid QR token did not fail.');
    }

    // 5. Revoke QR Code (by Shopkeeper A)
    const revokeQR = await request(`/api/shops/${shopA._id}/qr/revoke`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${skAToken}` }
    });

    if (revokeQR.status === 200 && revokeQR.data.data.qr.status === 'REVOKED') {
      console.log('  PASSED: 5. Revoke active QR code works');
    } else {
      throw new Error('Revoke QR failed.');
    }

    // 6. Try resolving revoked QR code (should fail with 400)
    const resolveRevoked = await request(`/api/shops/qr/${tokenA}`);
    if (resolveRevoked.status === 400) {
      console.log('  PASSED: 6. Revoked QR code resolution rejected with 400');
    } else {
      throw new Error('Revoked QR was resolved.');
    }

    // Regenerate QR for Shop A to use in attribution tests
    const newQR = await request(`/api/shops/${shopA._id}/qr`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${skAToken}` },
      body: JSON.stringify({ regenerate: true })
    });
    const activeTokenA = newQR.data.data.qr.publicToken;

    // Generate QR for Shop B
    const qrB = await request(`/api/shops/${shopB._id}/qr`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${skBToken}` }
    });
    const activeTokenB = qrB.data.data.qr.publicToken;

    // ==========================================
    // ATTRIBUTION TESTS
    // ==========================================
    console.log('\n🧪 Running Attribution Tests...');

    // 8. New customer attribution
    const attrCust1 = await request(`/api/shops/qr/${activeTokenA}/attribute`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cust1Token}` }
    });

    if (attrCust1.status === 200 && attrCust1.data.data.attributed === true) {
      console.log('  PASSED: 8. New customer attribution works');
    } else {
      throw new Error(`Attribution failed: ${JSON.stringify(attrCust1.data)}`);
    }

    // 9. Same customer scans same QR twice (idempotent success)
    const attrCust1Dup = await request(`/api/shops/qr/${activeTokenA}/attribute`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cust1Token}` }
    });

    if (attrCust1Dup.status === 200 && attrCust1Dup.data.data.alreadyAttributed === true) {
      console.log('  PASSED: 9. Idempotent customer scan matches correctly');
    } else {
      throw new Error(`Idempotent check failed: ${JSON.stringify(attrCust1Dup.data)}`);
    }

    // 10. Customer scans Shop A then Shop B (should NOT overwrite attribution)
    const attrCust1B = await request(`/api/shops/qr/${activeTokenB}/attribute`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cust1Token}` }
    });

    if (attrCust1B.status === 200 && attrCust1B.data.data.attributed === false && attrCust1B.data.data.reason === 'CUSTOMER_ALREADY_ATTRIBUTED') {
      console.log('  PASSED: 10. First-touch attribution is permanent and cannot be overwritten');
    } else {
      throw new Error(`First-touch constraint bypassed: ${JSON.stringify(attrCust1B.data)}`);
    }

    // ==========================================
    // REGISTRATION TESTS
    // ==========================================
    console.log('\n🧪 Running Registration Tests...');

    // Register with shopQrToken
    const regWithQR = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'QR Register', email: 'qrreg@test4.com', password: 'password123', shopQrToken: activeTokenA })
    });

    if (regWithQR.status === 201 && regWithQR.data.data.user.attributedShopId === shopA._id.toString()) {
      console.log('  PASSED: 11. Registration with shopQrToken sets attribution');
    } else {
      throw new Error(`QR signup failed: ${JSON.stringify(regWithQR.data)}`);
    }

    // ==========================================
    // NETWORK ANCESTRY TESTS (9 LEVELS)
    // ==========================================
    console.log('\n🧪 Running 9-Level Network Ancestry Tests...');

    // Create a sponsorship tree of 10 users: User1 -> User2 -> User3 -> ... -> User10
    const netTokens = [];
    const netUsers = [];

    // Register root
    const rootReg = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Net User 1', email: 'net1@test4.com', password: 'password123' })
    });
    netTokens.push(rootReg.data.data.accessToken);
    netUsers.push(rootReg.data.data.user);

    for (let i = 2; i <= 10; i++) {
      const parentUser = netUsers[i - 2];
      const childReg = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: `Net User ${i}`, email: `net${i}@test4.com`, password: `password123`, referralCode: parentUser.referralCode })
      });
      netTokens.push(childReg.data.data.accessToken);
      netUsers.push(childReg.data.data.user);
    }

    // Verify User 10 ancestors
    const user10Db = await User.findById(netUsers[9]._id);
    if (user10Db.referralPath.length === 9) {
      console.log('  PASSED: 12. 9-level nested ancestry paths populated correctly');
    } else {
      throw new Error(`User 10 ancestry path length is ${user10Db.referralPath.length}, expected 9`);
    }

    // Verify O(1) query tree lookup works for User 1
    const treeRes = await request(`/api/referrals/tree?maxLevel=9`, {
      headers: { Authorization: `Bearer ${netTokens[0]}` }
    });

    if (treeRes.status === 200 && treeRes.data.data.stats.totalReferrals === 9) {
      console.log('  PASSED: 13. buildReferralTree fetches up to 9 levels correctly in 1 query');
    } else {
      throw new Error(`Referral tree lookup failed: ${JSON.stringify(treeRes.data)}`);
    }

    // Verify network summary grouping
    const summaryRes = await request(`/api/referrals/network-summary`, {
      headers: { Authorization: `Bearer ${netTokens[0]}` }
    });

    if (summaryRes.status === 200 && summaryRes.data.data.totalNetworkCount === 9) {
      console.log('  PASSED: 14. Network summary counts group correctly');
    } else {
      throw new Error(`Network summary lookup failed: ${JSON.stringify(summaryRes.data)}`);
    }

    // ==========================================
    // SECURITY TESTS (IDOR)
    // ==========================================
    console.log('\n🧪 Running Security & Scoped Access Tests...');

    // Shopkeeper A tries to generate QR for Shop B (should fail with 403)
    const hackerGen = await request(`/api/shops/${shopB._id}/qr`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${skAToken}` }
    });

    if (hackerGen.status === 403) {
      console.log('  PASSED: 15. Shopkeeper A prevented from generating QR for Shop B');
    } else {
      throw new Error('Shopkeeper A bypassed QR generation block.');
    }

    // Customer tries to access admin attributions log (should fail with 403)
    const hackAdminLog = await request('/api/admin/shop-attributions', {
      headers: { Authorization: `Bearer ${cust1Token}` }
    });

    if (hackAdminLog.status === 403) {
      console.log('  PASSED: 16. Customer prevented from accessing admin attribution log');
    } else {
      throw new Error('Customer bypassed admin route checks.');
    }

    // User 2 tries to fetch User 1's tree (should fail with 403)
    const hackTree = await request(`/api/referrals/tree?userId=${netUsers[0]._id}`, {
      headers: { Authorization: `Bearer ${netTokens[1]}` }
    });

    if (hackTree.status === 403) {
      console.log('  PASSED: 17. Upline tree retrieval protected against IDOR');
    } else {
      throw new Error('Upline tree IDOR validation bypassed.');
    }

    console.log('\n✨ ALL PHASE 4 INTEGRATION & SECURITY TESTS PASSED! ✨\n');

  } catch (err) {
    console.error(`\n❌ TEST FAILED: ${err.message}`);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
}

runTests();
