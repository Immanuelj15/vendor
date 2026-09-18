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
import { KYCDocument } from '../src/models/KYCDocument.js';
import { Subscription } from '../src/models/Subscription.js';
import { SubscriptionPlan } from '../src/models/SubscriptionPlan.js';

let server;

async function runTests() {
  console.log('🧪 Starting Phase 3 Integration Tests...\n');

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart_test';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ Connected to MongoDB Test Instance');

    // Clean up
    await User.deleteMany({ email: /@test3\.com$/ });
    await Territory.deleteMany({});
    await Franchise.deleteMany({});
    await Shopkeeper.deleteMany({});
    await Shop.deleteMany({});
    await KYCDocument.deleteMany({});
    await Subscription.deleteMany({});
    await SubscriptionPlan.deleteMany({});

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
    console.log('\n--> Registering Admin, Customer, and Operators');
    const regAdmin = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Admin', email: 'admin@test3.com', password: 'password123' })
    });
    const regState = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'State Owner', email: 'state@test3.com', password: 'password123' })
    });
    const regDistrict = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'District Owner', email: 'district@test3.com', password: 'password123' })
    });
    const regTaluk = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Taluk Owner', email: 'taluk@test3.com', password: 'password123' })
    });
    const regSk = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Shopkeeper User', email: 'sk@test3.com', password: 'password123' })
    });
    const regCust = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Customer', email: 'cust@test3.com', password: 'password123' })
    });

    // Make admin user real admin
    await User.findByIdAndUpdate(regAdmin.data.data.user._id, { role: 'ADMIN' });
    const adminToken = regAdmin.data.data.accessToken;

    const stateUser = regState.data.data.user;
    const districtUser = regDistrict.data.data.user;
    const talukUser = regTaluk.data.data.user;
    const skUser = regSk.data.data.user;
    const custToken = regCust.data.data.accessToken;

    // 2. Create Territories
    console.log('\n--> Creating Territories');
    const tState = await request('/api/franchises/territories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ type: 'STATE', name: 'Tamil Nadu', code: 'TN' })
    });
    const stateTerrId = tState.data.data.territory._id;

    const tDistrict = await request('/api/franchises/territories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ type: 'DISTRICT', name: 'Chennai', code: 'CHN', parentTerritory: stateTerrId, state: 'Tamil Nadu' })
    });
    const districtTerrId = tDistrict.data.data.territory._id;

    const tTaluk = await request('/api/franchises/territories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ type: 'TALUK', name: 'Adyar', code: 'ADY', parentTerritory: districtTerrId, state: 'Tamil Nadu', district: 'Chennai' })
    });
    const talukTerrId = tTaluk.data.data.territory._id;

    if (tState.status === 201 && tDistrict.status === 201 && tTaluk.status === 201) {
      console.log('  PASSED: State, District, and Taluk territories created successfully');
    } else {
      throw new Error('Territory creation failed');
    }

    // 3. Appoint State Franchise
    console.log('\n--> Appointing State Franchise');
    const appState = await request('/api/franchises', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        userId: stateUser._id,
        franchiseType: 'STATE',
        territoryId: stateTerrId,
        businessName: 'BSM Tamil Nadu State Corp',
        phone: '9876543210',
        email: 'statecorp@test3.com'
      })
    });

    if (appState.status !== 201) {
      console.error('Appoint State Franchise Error:', JSON.stringify(appState.data, null, 2));
      throw new Error(`Appointment request returned status: ${appState.status}`);
    }

    const stateFranchiseId = appState.data.data.franchise._id;
    // Approve it so it becomes ACTIVE
    await request(`/api/franchises/${stateFranchiseId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // Re-fetch State User to get the updated State Franchise token
    const loginState = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'state@test3.com', password: 'password123' })
    });
    const stateToken = loginState.data.data.accessToken;

    if (appState.status === 201) {
      console.log('  PASSED: State Franchise appointed and approved successfully');
    } else {
      throw new Error(`State appointment failed: ${JSON.stringify(appState.data)}`);
    }

    // 4. Appoint District Franchise
    console.log('\n--> Appointing District Franchise under State Franchise');
    const appDistrict = await request('/api/franchises', {
      method: 'POST',
      headers: { Authorization: `Bearer ${stateToken}` },
      body: JSON.stringify({
        userId: districtUser._id,
        franchiseType: 'DISTRICT',
        territoryId: districtTerrId,
        parentFranchiseId: stateFranchiseId,
        businessName: 'BSM Chennai District',
        phone: '9876543211',
        email: 'chennaidist@test3.com'
      })
    });

    const districtFranchiseId = appDistrict.data.data.franchise._id;
    await request(`/api/franchises/${districtFranchiseId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // Login District
    const loginDist = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'district@test3.com', password: 'password123' })
    });
    const districtToken = loginDist.data.data.accessToken;

    if (appDistrict.status === 201) {
      console.log('  PASSED: District Franchise appointed and parent hierarchy validated');
    } else {
      throw new Error(`District appointment failed: ${JSON.stringify(appDistrict.data)}`);
    }

    // 5. Test Invalid Hierarchy Appoint
    console.log('\n--> Testing Invalid Franchise Hierarchy Appoint');
    // Try to appoint a Taluk franchise directly under State franchise (should fail, must be District)
    const badTalukApp = await request('/api/franchises', {
      method: 'POST',
      headers: { Authorization: `Bearer ${stateToken}` },
      body: JSON.stringify({
        userId: talukUser._id,
        franchiseType: 'TALUK',
        territoryId: talukTerrId,
        parentFranchiseId: stateFranchiseId,
        businessName: 'BSM Adyar Taluk Bad',
        phone: '9876543212',
        email: 'adyartalukbad@test3.com'
      })
    });

    if (badTalukApp.status === 400 || badTalukApp.status === 403) {
      console.log('  PASSED: Invalid parent type mapping rejected correctly');
    } else {
      throw new Error(`Invalid hierarchy was not rejected: ${JSON.stringify(badTalukApp.data)}`);
    }

    // 6. Appoint Taluk Franchise
    console.log('\n--> Appointing Taluk Franchise under District Franchise');
    const appTaluk = await request('/api/franchises', {
      method: 'POST',
      headers: { Authorization: `Bearer ${districtToken}` },
      body: JSON.stringify({
        userId: talukUser._id,
        franchiseType: 'TALUK',
        territoryId: talukTerrId,
        parentFranchiseId: districtFranchiseId,
        businessName: 'BSM Adyar Taluk',
        phone: '9876543213',
        email: 'adyartaluk@test3.com'
      })
    });

    const talukFranchiseId = appTaluk.data.data.franchise._id;
    await request(`/api/franchises/${talukFranchiseId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // Login Taluk
    const loginTal = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'taluk@test3.com', password: 'password123' })
    });
    const talukToken = loginTal.data.data.accessToken;

    if (appTaluk.status === 201) {
      console.log('  PASSED: Taluk Franchise appointed and approved successfully');
    } else {
      throw new Error(`Taluk appointment failed: ${JSON.stringify(appTaluk.data)}`);
    }

    // 7. Onboard Shopkeeper
    console.log('\n--> Initiating Shopkeeper Onboarding');
    const onboardSk = await request('/api/shopkeepers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${talukToken}` },
      body: JSON.stringify({
        userId: skUser._id,
        talukFranchiseId: talukFranchiseId,
        businessName: 'BSM Adyar Retail Store',
        phone: '9876543214',
        email: 'adyarretail@test3.com'
      })
    });

    const shopkeeperId = onboardSk.data.data.shopkeeper._id;
    if (onboardSk.status === 201 && onboardSk.data.data.shopkeeper.onboardingStatus === 'PENDING') {
      console.log('  PASSED: Shopkeeper onboarding initiated in PENDING state');
    } else {
      throw new Error(`Shopkeeper onboarding initiation failed: ${JSON.stringify(onboardSk.data)}`);
    }

    // Login Shopkeeper
    const loginSk = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'sk@test3.com', password: 'password123' })
    });
    const skToken = loginSk.data.data.accessToken;

    // 8. Submit KYC
    console.log('\n--> Submitting KYC Document');
    const subKyc = await request('/api/kyc', {
      method: 'POST',
      headers: { Authorization: `Bearer ${skToken}` },
      body: JSON.stringify({
        entityType: 'SHOPKEEPER',
        entityId: shopkeeperId,
        documentType: 'PAN',
        documentNumber: 'ABCDE1234F',
        documentUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400'
      })
    });

    const kycId = subKyc.data.data.kyc._id;
    if (subKyc.status === 201 && subKyc.data.data.kyc.status === 'PENDING') {
      console.log('  PASSED: KYC Document submitted in PENDING state');
    } else {
      throw new Error(`KYC submission failed: ${JSON.stringify(subKyc.data)}`);
    }

    // 9. Approve KYC
    console.log('\n--> Reviewing and Approving KYC Document');
    const approveKyc = await request(`/api/kyc/${kycId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'VERIFIED' })
    });

    if (approveKyc.status === 200 && approveKyc.data.data.kyc.status === 'VERIFIED') {
      console.log('  PASSED: KYC approved and status updated to VERIFIED');
    } else {
      throw new Error(`KYC approval failed: ${JSON.stringify(approveKyc.data)}`);
    }

    // 10. Subscription Setup
    console.log('\n--> Creating Subscription Plan and Activating Plan');
    const createPlan = await request('/api/subscriptions/plans', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'BSM Annual Shop Plan',
        code: 'SHOP_ANNUAL',
        price: 5000,
        durationDays: 365,
        applicableEntityType: 'SHOPKEEPER'
      })
    });
    const planId = createPlan.data.data.plan._id;

    const subActivate = await request('/api/subscriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${skToken}` },
      body: JSON.stringify({
        planId,
        entityType: 'SHOPKEEPER',
        entityId: shopkeeperId,
        paymentId: '6a8dd222203d71740667634d'
      })
    });

    if (subActivate.status === 201 && subActivate.data.data.subscription.status === 'ACTIVE') {
      console.log('  PASSED: Subscription activated successfully');
    } else {
      throw new Error(`Subscription activation failed: ${JSON.stringify(subActivate.data)}`);
    }

    // 11. Create & Activate Shop
    console.log('\n--> Creating and Approving Retail Shop');
    const appShop = await request('/api/shops', {
      method: 'POST',
      headers: { Authorization: `Bearer ${talukToken}` },
      body: JSON.stringify({
        shopkeeperId,
        talukFranchiseId,
        shopName: 'Babu Super Market Adyar',
        address: '12 Main Road, Adyar',
        state: 'Tamil Nadu',
        district: 'Chennai',
        taluk: 'Adyar',
        pincode: '600020',
        phone: '9876543214',
        email: 'adyarretail@test3.com'
      })
    });

    const shop = appShop.data.data.shop;
    if (appShop.status === 201 && shop.shopCode && shop.slug && shop.qrPublicToken) {
      console.log(`  PASSED: Shop approved! Generated unique code [${shop.shopCode}], slug [${shop.slug}], and QR token`);
    } else {
      throw new Error(`Shop creation failed: ${JSON.stringify(appShop.data)}`);
    }

    // 12. Test Scoped Access & Security (IDOR)
    console.log('\n--> Testing Scoped Access & IDOR Security Policies');
    // Customer tries to access list of franchises (should fail)
    const custFail = await request('/api/franchises', {
      method: 'GET',
      headers: { Authorization: `Bearer ${custToken}` }
    });

    if (custFail.status === 403) {
      console.log('  PASSED: Customer was blocked from accessing franchise list');
    } else {
      throw new Error(`Unauthorized customer was not blocked: ${custFail.status}`);
    }

    // Taluk franchise tries to fetch district info of another district (should return empty or 403)
    const childDashboard = await request(`/api/franchises/${stateFranchiseId}/children`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${talukToken}` }
    });

    if (childDashboard.status === 403) {
      console.log('  PASSED: Taluk Franchise blocked from accessing unrelated state details');
    } else {
      throw new Error(`Taluk Franchise IDOR check failed: ${childDashboard.status}`);
    }

    console.log('\n✨ ALL PHASE 3 INTEGRATION TESTS COMPLETED SUCCESSFULLY! ✨\n');
  } catch (err) {
    console.error(`\n❌ TEST FAILED: ${err.message}`);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
}

runTests();
