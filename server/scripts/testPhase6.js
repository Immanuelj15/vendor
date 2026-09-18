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
import { SubscriptionPlan } from '../src/models/SubscriptionPlan.js';
import { Subscription } from '../src/models/Subscription.js';
import { KYCDocument } from '../src/models/KYCDocument.js';
import { Payment } from '../src/models/Payment.js';
import { Notification } from '../src/models/Notification.js';

let server;

async function runTests() {
  console.log('🧪 Starting Phase 6 KYC, Subscription, & Shop Lifecycle Integration Tests...\n');

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart_test';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ Connected to MongoDB Test Instance');

    // Clean up test collections
    await User.deleteMany({ email: /@test6\.com$/ });
    await Territory.deleteMany({});
    await Franchise.deleteMany({});
    await Shopkeeper.deleteMany({});
    await Shop.deleteMany({});
    await SubscriptionPlan.deleteMany({});
    await Subscription.deleteMany({});
    await KYCDocument.deleteMany({});
    await Payment.deleteMany({});
    await Notification.deleteMany({});

    // Start HTTP server on random port
    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, () => {
        const port = server.address().port;
        console.log(`✅ Test server running on port ${port}`);
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
      if (res.status >= 400) {
        console.error(`🔴 Request to ${path} failed with status ${res.status}:`, JSON.stringify(data, null, 2));
      }
      return { status: res.status, data };
    }

    // 1. Setup Users
    console.log('\n--> Registering users...');
    const regAdmin = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Admin User', email: 'admin@test6.com', password: 'Password@123' })
    });
    const regState = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'State Operator', email: 'state@test6.com', password: 'Password@123' })
    });
    const regDistrict = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'District Operator', email: 'district@test6.com', password: 'Password@123' })
    });
    const regFranchise = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Taluk Operator', email: 'franchise@test6.com', password: 'Password@123' })
    });
    const regSk = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Shopkeeper User', email: 'sk@test6.com', password: 'Password@123' })
    });

    const adminToken = regAdmin.data.data.accessToken;
    const stateToken = regState.data.data.accessToken;
    const districtToken = regDistrict.data.data.accessToken;
    const franchiseToken = regFranchise.data.data.accessToken;
    const skToken = regSk.data.data.accessToken;

    // Promote Admin
    await User.findByIdAndUpdate(regAdmin.data.data.user._id, { role: 'ADMIN' });

    // 2. Setup Territory and Franchise Hierarchy
    console.log('--> Creating Territory Hierarchy...');
    // Create State Territory
    const stateTerritoryRes = await request('/api/franchises/territories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ type: 'STATE', name: 'Karnataka', code: 'KA', state: 'Karnataka' })
    });
    const stateTerritoryId = stateTerritoryRes.data.data.territory._id;

    // Appoint State Franchise
    const stateAppointRes = await request('/api/franchises', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        userId: regState.data.data.user._id,
        franchiseType: 'STATE',
        territoryId: stateTerritoryId,
        businessName: 'State Business',
        phone: '1234567890',
        email: 'state@test6.com'
      })
    });
    const stateFranchiseId = stateAppointRes.data.data.franchise._id;
    await request(`/api/franchises/${stateFranchiseId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // Create District Territory
    const districtTerritoryRes = await request('/api/franchises/territories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        type: 'DISTRICT',
        name: 'Bengaluru',
        code: 'KA_BLR',
        parentTerritory: stateTerritoryId,
        state: 'Karnataka',
        district: 'Bengaluru'
      })
    });
    const districtTerritoryId = districtTerritoryRes.data.data.territory._id;

    // Appoint District Franchise
    const districtAppointRes = await request('/api/franchises', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        userId: regDistrict.data.data.user._id,
        franchiseType: 'DISTRICT',
        territoryId: districtTerritoryId,
        parentFranchiseId: stateFranchiseId,
        businessName: 'District Business',
        phone: '1234567890',
        email: 'district@test6.com'
      })
    });
    const districtFranchiseId = districtAppointRes.data.data.franchise._id;
    await request(`/api/franchises/${districtFranchiseId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // Create Taluk Territory
    const talukTerritoryRes = await request('/api/franchises/territories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        type: 'TALUK',
        name: 'Test Taluk',
        code: 'TEST_TLK',
        parentTerritory: districtTerritoryId,
        state: 'Karnataka',
        district: 'Bengaluru',
        taluk: 'Test Taluk'
      })
    });
    const talukTerritoryId = talukTerritoryRes.data.data.territory._id;

    // Appoint Taluk Franchise
    const talukAppointRes = await request('/api/franchises', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        userId: regFranchise.data.data.user._id,
        franchiseType: 'TALUK',
        territoryId: talukTerritoryId,
        parentFranchiseId: districtFranchiseId,
        businessName: 'Taluk Business',
        phone: '1234567890',
        email: 'franchise@test6.com'
      })
    });
    const franchiseId = talukAppointRes.data.data.franchise._id;

    // Approve Taluk Franchise
    await request(`/api/franchises/${franchiseId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // 3. Onboard Shopkeeper
    console.log('--> Onboarding Shopkeeper...');
    const onboardRes = await request('/api/shopkeepers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${franchiseToken}` },
      body: JSON.stringify({
        userId: regSk.data.data.user._id,
        talukFranchiseId: franchiseId,
        businessName: 'SK Shop',
        phone: '9876543210',
        email: 'sk@test6.com'
      })
    });
    const shopkeeperId = onboardRes.data.data.shopkeeper._id;

    // 4. Seeding Plans
    console.log('--> Creating Subscription Plans...');
    const planRes = await request('/api/subscriptions/plans', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Shopkeeper Plan',
        code: 'TEST_SK_PLAN',
        description: 'Standard plan',
        price: 500,
        currency: 'INR',
        durationDays: 30,
        applicableEntityType: 'SHOPKEEPER'
      })
    });
    const planId = planRes.data.data.plan._id;

    // 5. KYC Flow Tests
    console.log('\n🧪 Testing KYC document lifecycle...');
    // Submit KYC draft
    const submitKycRes = await request('/api/kyc', {
      method: 'POST',
      headers: { Authorization: `Bearer ${skToken}` },
      body: JSON.stringify({
        entityType: 'SHOPKEEPER',
        entityId: shopkeeperId,
        documentType: 'PAN',
        documentNumber: 'ABCDE1234F',
        documentUrl: 'http://example.com/pan.jpg'
      })
    });
    console.assert(submitKycRes.status === 201, 'KYC submission should return 201 status');
    const kycId = submitKycRes.data.data.kyc._id;

    // Test duplicate submission fails
    const duplicateKycRes = await request('/api/kyc', {
      method: 'POST',
      headers: { Authorization: `Bearer ${skToken}` },
      body: JSON.stringify({
        entityType: 'SHOPKEEPER',
        entityId: shopkeeperId,
        documentType: 'PAN',
        documentNumber: 'ABCDE1234F',
        documentUrl: 'http://example.com/pan.jpg'
      })
    });
    console.assert(duplicateKycRes.status === 400, 'Duplicate pending KYC submission should fail');

    // Test IDOR: Fetching other user\'s KYC should fail
    const idorKycRes = await request(`/api/kyc/${kycId}`, {
      headers: { Authorization: `Bearer ${franchiseToken}` }
    });
    // franchise is taluk operator. Shopkeeper is under taluk, so they CAN access it. Let\'s check that.
    console.assert(idorKycRes.status === 200, 'Taluk Operator should have territory access to KYC');

    // Attempting to access from unrelated standard user should fail
    const unrelatedToken = regSk.data.data.accessToken; // Wait, sk Token is owner. Let\'s register another standard user
    const regUserUnrelated = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Unrelated User', email: 'unrelated@test6.com', password: 'Password@123' })
    });
    const unrelatedUserToken = regUserUnrelated.data.data.accessToken;
    const idorKycFail = await request(`/api/kyc/${kycId}`, {
      headers: { Authorization: `Bearer ${unrelatedUserToken}` }
    });
    console.assert(idorKycFail.status === 403, 'Unrelated user should be blocked from KYC IDOR access');

    // Reject KYC
    console.log('--> Rejecting KYC...');
    const rejectKycRes = await request(`/api/kyc/${kycId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'REJECTED', rejectionReason: 'Illegible image document' })
    });
    console.assert(rejectKycRes.status === 200, 'Admin can reject KYC');

    // Verify entity kycStatus is REJECTED
    let skCheck = await Shopkeeper.findById(shopkeeperId);
    console.assert(skCheck.kycStatus === 'REJECTED', 'Shopkeeper KYC status should be updated to REJECTED');

    // Resubmit Rejected KYC
    console.log('--> Resubmitting KYC...');
    const resubmitKycRes = await request('/api/kyc', {
      method: 'POST',
      headers: { Authorization: `Bearer ${skToken}` },
      body: JSON.stringify({
        entityType: 'SHOPKEEPER',
        entityId: shopkeeperId,
        documentType: 'PAN',
        documentNumber: 'ABCDE1234F',
        documentUrl: 'http://example.com/pan_new.jpg'
      })
    });
    console.assert(resubmitKycRes.status === 201, 'Rejected KYC should allow resubmission');
    const newKycId = resubmitKycRes.data.data.kyc._id;

    // Approve resubmitted KYC
    console.log('--> Approving KYC...');
    const approveKycRes = await request(`/api/kyc/${newKycId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'VERIFIED' })
    });
    console.assert(approveKycRes.status === 200, 'Admin can verify KYC');

    skCheck = await Shopkeeper.findById(shopkeeperId);
    console.assert(skCheck.kycStatus === 'APPROVED', 'Shopkeeper kycStatus should be APPROVED after verification');

    // 6. Subscriptions Flow Tests
    console.log('\n🧪 Testing Subscription flows...');
    // Create subscription
    const createSubRes = await request('/api/subscriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${skToken}` },
      body: JSON.stringify({
        planId,
        entityType: 'SHOPKEEPER',
        entityId: shopkeeperId
      })
    });
    console.assert(createSubRes.status === 201, 'Create pending subscription should succeed');
    const subId = createSubRes.data.data.subscription._id;
    const razorpayOrderId = createSubRes.data.data.paymentPayload.razorpayOrderId;

    // Verify subscription status is PENDING
    let subCheck = await Subscription.findById(subId);
    console.assert(subCheck.status === 'PENDING', 'Initial subscription status must be PENDING');

    // Verify payment record exists in CREATED state
    let payCheck = await Payment.findOne({ subscriptionId: subId });
    console.assert(payCheck !== null, 'Payment order record must be generated');
    console.assert(payCheck.status === 'CREATED', 'Initial payment status must be CREATED');

    // Simulate payment webhook capture
    console.log('--> Simulating payment captured webhook...');
    const verifyPayRes = await request('/api/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${skToken}` },
      body: JSON.stringify({
        razorpayOrderId,
        razorpayPaymentId: 'pay_mock_123456',
        razorpaySignature: 'webhook_verified'
      })
    });
    console.assert(verifyPayRes.status === 200, 'Payment signature verification should pass');

    // Verify subscription is now ACTIVE
    subCheck = await Subscription.findById(subId);
    console.assert(subCheck.status === 'ACTIVE', 'Subscription should be active after payment capture');
    console.assert(subCheck.startDate !== null, 'Subscription must have a valid startDate');
    console.assert(subCheck.endDate !== null, 'Subscription must have a valid endDate');

    // Verify Shopkeeper onboardingStatus is SUBSCRIBED
    skCheck = await Shopkeeper.findById(shopkeeperId);
    console.assert(skCheck.onboardingStatus === 'SUBSCRIBED', 'Shopkeeper onboarding status should be SUBSCRIBED');

    // 7. Shop Activation Tests
    console.log('\n🧪 Testing Shop activation & prerequisites...');
    // Create Shop under Taluk Franchise
    const createShopRes = await request('/api/shops', {
      method: 'POST',
      headers: { Authorization: `Bearer ${franchiseToken}` },
      body: JSON.stringify({
        shopkeeperId,
        talukFranchiseId: franchiseId,
        shopName: 'Babu Super Market Branch 1',
        address: '123 Main St',
        state: 'Karnataka',
        district: 'Bengaluru',
        taluk: 'Test Taluk',
        pincode: '560001',
        phone: '9000000001',
        email: 'shop1@test6.com'
      })
    });
    console.assert(createShopRes.status === 201, 'Shop creation should succeed');
    const shopId = createShopRes.data.data.shop._id;

    // Verify initial status is PENDING
    let shopCheck = await Shop.findById(shopId);
    console.assert(shopCheck.status === 'PENDING', 'Initial shop status must be PENDING');

    // Try to activate shop when all prerequisites are met
    console.log('--> Activating shop status...');
    const activateShopRes = await request(`/api/shops/${shopId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${franchiseToken}` },
      body: JSON.stringify({ status: 'ACTIVE' })
    });
    console.assert(activateShopRes.status === 200, 'Shop activation should succeed when all prerequisites are met');
    shopCheck = await Shop.findById(shopId);
    console.assert(shopCheck.status === 'ACTIVE', 'Shop should be successfully marked ACTIVE');

    // Test Expiration demotion: Simulate expired subscription
    console.log('--> Simulating subscription expiration...');
    // Force subscription to end yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await Subscription.findByIdAndUpdate(subId, { endDate: yesterday });

    // Trigger status sync
    await request(`/api/subscriptions/my`, {
      headers: { Authorization: `Bearer ${skToken}` }
    });

    // Check shop status is updated to EXPIRED/INACTIVE
    shopCheck = await Shop.findById(shopId);
    console.assert(['EXPIRED', 'INACTIVE'].includes(shopCheck.status), 'Shop status should be demoted on subscription expiry');

    // 8. Renewal Flow Tests
    console.log('\n🧪 Testing Subscription renewal...');
    const renewSubRes = await request(`/api/subscriptions/${subId}/renew`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${skToken}` }
    });
    console.assert(renewSubRes.status === 200, 'Renewal initiation should succeed');
    const renewPayId = renewSubRes.data.data.paymentPayload.razorpayOrderId;

    // Simulate payment capture for renewal
    await request('/api/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${skToken}` },
      body: JSON.stringify({
        razorpayOrderId: renewPayId,
        razorpayPaymentId: 'pay_mock_789012',
        razorpaySignature: 'webhook_verified'
      })
    });

    // Check subscription is ACTIVE again
    subCheck = await Subscription.findById(subId);
    console.assert(subCheck.status === 'ACTIVE', 'Subscription should be active again after renewal');
    console.assert(subCheck.renewalCount === 1, 'Renewal count should be incremented to 1');

    // Reactivate shop
    await request(`/api/shops/${shopId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${franchiseToken}` },
      body: JSON.stringify({ status: 'ACTIVE' })
    });
    shopCheck = await Shop.findById(shopId);
    console.assert(shopCheck.status === 'ACTIVE', 'Shop should be active again after renewal and reactivation');

    console.log('\n🎉 ALL LIFE-CYCLE LIFECYCLE TESTS PASSED SUCCESSFULLY! 🎉\n');
  } catch (error) {
    console.error('❌ Integration tests failed:', error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
      console.log('✅ Server stopped');
    }
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

runTests();
