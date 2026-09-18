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
import { UserAddress } from '../src/models/UserAddress.js';
import { Notification } from '../src/models/Notification.js';
import { EmailLog } from '../src/models/EmailLog.js';
import { Wishlist } from '../src/models/Wishlist.js';
import { Commission } from '../src/models/Commission.js';
import { Product } from '../src/models/Product.js';
import { Category } from '../src/models/Category.js';
import { Vendor } from '../src/models/Vendor.js';
import { Shopkeeper } from '../src/models/Shopkeeper.js';
import { emailService } from '../src/services/emailService.js';
import { notificationService } from '../src/services/notificationService.js';

let server;

async function runTests() {
  console.log('🧪 Starting Phase 8 Integration & Customer Account Tests...\n');

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart_test';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ Connected to MongoDB Test Instance');

    // Clean up
    await User.deleteMany({ email: /@test8\.com$/ });
    await UserAddress.deleteMany({});
    await Notification.deleteMany({});
    await EmailLog.deleteMany({});
    await Wishlist.deleteMany({});
    await Commission.deleteMany({});
    await Shopkeeper.deleteMany({});
    await Category.deleteMany({ slug: 'test-cat-8' });
    await Vendor.deleteMany({ slug: 'test-vendor-8' });
    await Product.deleteMany({ slug: 'test-product-8' });

    // Seed mock category & vendor
    const testCategory = await Category.create({ name: 'Test Category 8', slug: 'test-cat-8' });
    const testVendor = await Vendor.create({ userId: new mongoose.Types.ObjectId(), storeName: 'Test Vendor Store 8', slug: 'test-vendor-8' });

    // Create a mock product
    const mockProduct = await Product.create({
      name: 'Test Product 8',
      description: 'Test Description',
      price: 1500,
      coinReward: 20,
      stock: 100,
      sku: 'TEST-SKU-8',
      categoryId: testCategory._id,
      vendorId: testVendor._id,
      status: 'APPROVED',
      slug: 'test-product-8',
    });

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

    // 1. Create User
    console.log('\n--> Registering Test User...');
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'User Eight', email: 'user8@test8.com', password: 'password123' })
    });
    
    if (regRes.status !== 201) {
      throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
    }

    const token = regRes.data.data.accessToken;
    const userId = regRes.data.data.user._id;
    console.log('  PASSED: User registered.');

    // 2. Profile tests
    console.log('\n--> Profile & Edit Restrictions Tests...');
    
    // GET Profile
    const profileRes = await request('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (profileRes.status !== 200 || profileRes.data.data.name !== 'User Eight') {
      throw new Error(`Profile GET failed: ${JSON.stringify(profileRes.data)}`);
    }
    console.log('  PASSED: GET /api/users/me works.');

    // PUT Profile (Update Name)
    const updateRes = await request('/api/users/me', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'User Eight Updated', notificationPreferences: { promotional: true } })
    });
    if (updateRes.status !== 200 || updateRes.data.data.name !== 'User Eight Updated' || updateRes.data.data.notificationPreferences.promotional !== true) {
      throw new Error(`Profile PUT failed: ${JSON.stringify(updateRes.data)}`);
    }
    console.log('  PASSED: PUT /api/users/me works and updates preferences.');

    // Lock restrictions when KYC approved
    await Shopkeeper.create({
      userId,
      talukFranchiseId: new mongoose.Types.ObjectId(),
      kycStatus: 'APPROVED',
      status: 'ACTIVE',
      businessName: 'Store 8',
      phone: '1234567890',
      email: 'user8@test8.com'
    });
    await User.findByIdAndUpdate(userId, { phone: '1234567890' });

    // Attempting to change email should fail
    const lockEmailRes = await request('/api/users/me', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: 'newemail@test8.com' })
    });
    if (lockEmailRes.status === 400) {
      console.log('  PASSED: Email lock restricts changes when KYC approved.');
    } else {
      throw new Error('Email changes were not locked.');
    }

    // 3. Password Update tests
    console.log('\n--> Password Change Tests...');
    const pwdRes = await request('/api/users/me/password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ oldPassword: 'password123', newPassword: 'newpassword123' })
    });
    if (pwdRes.status !== 200) {
      throw new Error(`Password update failed: ${JSON.stringify(pwdRes.data)}`);
    }
    console.log('  PASSED: Password updated successfully.');

    // Verify login with new password works
    const relogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user8@test8.com', password: 'newpassword123' })
    });
    if (relogin.status !== 200) {
      throw new Error('Login with new password failed.');
    }
    console.log('  PASSED: Relogin with new password verified.');

    // 4. Address Book CRUD
    console.log('\n--> Address Book CRUD Tests...');
    
    // Create Address 1 (should automatically be default)
    const addr1 = await request('/api/users/me/addresses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: 'Jane Delivery',
        phone: '9876543210',
        streetAddress: '123 Test Lane',
        city: 'Mumbai',
        state: 'MH',
        postalCode: '400001',
      })
    });
    if (addr1.status !== 201 || addr1.data.data.isDefault !== true) {
      throw new Error('Address 1 creation failed or not set as default');
    }
    console.log('  PASSED: First address is automatically set as default.');

    // Create Address 2
    const addr2 = await request('/api/users/me/addresses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: 'Second Location',
        phone: '9876543211',
        streetAddress: '456 Secondary Rd',
        city: 'Mumbai',
        state: 'MH',
        postalCode: '400002',
        isDefault: true
      })
    });
    if (addr2.status !== 201 || addr2.data.data.isDefault !== true) {
      throw new Error('Address 2 creation failed');
    }
    
    // Verify address 1 becomes false for default
    const getAddr = await request('/api/users/me/addresses', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const firstAddr = getAddr.data.data.find(a => a._id === addr1.data.data._id);
    if (firstAddr.isDefault === false) {
      console.log('  PASSED: Adding a new default address resets old defaults.');
    } else {
      throw new Error('Old default address was not updated.');
    }

    // 5. In-App Notifications
    console.log('\n--> Notifications API & Filtering Tests...');
    const notif = await Notification.create({
      userId,
      title: 'Test Notification',
      message: 'Hello World',
      type: 'COIN_EARNED'
    });

    const notifRes = await request('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (notifRes.status !== 200 || notifRes.data.data.notifications.length === 0) {
      throw new Error('Failed to retrieve notification');
    }
    console.log('  PASSED: Retrieve notifications works.');

    // Read toggle
    const readRes = await request(`/api/notifications/${notif._id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (readRes.status !== 200 || readRes.data.data.notification.isRead !== true) {
      throw new Error('Read toggle failed');
    }
    console.log('  PASSED: Mark notification as read works.');

    // 6. Email Idempotency
    console.log('\n--> Email Idempotency Verification...');
    const key = `test_dedupe_${Date.now()}`;
    
    // Call generic sender with dedupeKey twice
    await emailService.sendEmail({ to: 'test@test8.com', subject: 'Test', html: '<p>Hi</p>' }, key);
    await emailService.sendEmail({ to: 'test@test8.com', subject: 'Test', html: '<p>Hi</p>' }, key);

    // Wait 100ms for async SetImmediate queues to resolve
    await new Promise((resolve) => setTimeout(resolve, 100));

    const emailLogsCount = await EmailLog.countDocuments({ dedupeKey: key });
    if (emailLogsCount === 1) {
      console.log('  PASSED: Email idempotency successfully prevented duplicate sending.');
    } else {
      throw new Error(`Email log count was ${emailLogsCount}, expected 1`);
    }

    // 7. Wishlist Toggling
    console.log('\n--> Wishlist Toggle Tests...');
    const toggle1 = await request('/api/wishlist', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId: mockProduct._id })
    });
    if (toggle1.status !== 200 || toggle1.data.data.wishlist.products.length !== 1) {
      throw new Error('Failed to add product to wishlist');
    }
    console.log('  PASSED: Product added to wishlist.');

    const toggle2 = await request('/api/wishlist', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId: mockProduct._id })
    });
    if (toggle2.status !== 200 || toggle2.data.data.wishlist.products.length !== 0) {
      throw new Error('Failed to toggle product out of wishlist');
    }
    console.log('  PASSED: Product removed from wishlist.');

    // 8. Commissions paginated listing
    console.log('\n--> Commissions Paginated List Tests...');
    await Commission.create({
      orderId: new mongoose.Types.ObjectId(),
      recipientUserId: userId,
      commissionAmount: 500,
      commissionPercentage: 5,
      orderAmount: 10000,
      status: 'PAID',
      type: 'MLM_UPLINE_COMMISSION',
    });

    const commRes = await request('/api/users/me/commissions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (commRes.status === 200 && commRes.data.data.list.length === 1) {
      console.log('  PASSED: Commissions paginated listing works.');
    } else {
      throw new Error('Commissions lookup failed.');
    }

    console.log('\n✨ ALL PHASE 8 INTEGRATION TESTS PASSED SUCCESSFULLY! ✨\n');

  } catch (err) {
    console.error(`\n❌ TEST FAILED: ${err.message}`);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
}

runTests();
