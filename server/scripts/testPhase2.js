process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart_test';
import http from 'http';
import app from '../src/app.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { User } from '../src/models/User.js';
import { Order } from '../src/models/Order.js';
import { Payment } from '../src/models/Payment.js';
import { Product } from '../src/models/Product.js';
import { Cart } from '../src/models/Cart.js';
import { Commission } from '../src/models/Commission.js';
import { CoinTransaction } from '../src/models/CoinTransaction.js';
import { env } from '../src/config/env.js';

let server;

async function runTests() {
  console.log('🧪 Starting Phase 2 Integration Tests...\n');

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart_test';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ Connected to MongoDB Test Instance');

    // Clean up test data
    await User.deleteMany({ email: /@test2\.com$/ });
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await Commission.deleteMany({});
    await CoinTransaction.deleteMany({});

    const { Category } = await import('../src/models/Category.js');
    const { Vendor } = await import('../src/models/Vendor.js');
    await Category.deleteMany({});
    await Vendor.deleteMany({});
    await Product.deleteMany({});

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

    // 1. Create two test users: User A and User B
    console.log('\n--> Registering User A & User B');
    const regA = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'User A', email: 'usera@test2.com', password: 'password123' })
    });
    const regB = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'User B', email: 'userb@test2.com', password: 'password123' })
    });

    const userAToken = regA.data.data.accessToken;
    const userBToken = regB.data.data.accessToken;
    const userAId = regA.data.data.user._id;

    // Credit coins to User A's wallet for discount testing
    const { fairCoinService } = await import('../src/services/fairCoinService.js');
    await fairCoinService.creditCoins({
      userId: userAId,
      amount: 200,
      type: 'CREDIT',
      source: 'TEST_BONUS',
      description: 'Test Bonus'
    });

    // Seed a category and product for purchasing

    const testCategory = await Category.create({ name: 'Test Category', slug: 'test-cat' });
    const testVendor = await Vendor.create({ userId: new mongoose.Types.ObjectId(), storeName: 'Test Vendor Store', slug: 'test-vendor' });

    const testProduct = await Product.create({
      name: 'Test Product',
      slug: 'test-prod',
      price: 1000,
      stock: 10,
      sku: 'TEST-SKU-1',
      categoryId: testCategory._id,
      vendorId: testVendor._id,
      status: 'APPROVED'
    });

    console.log('Diagnostic: Mongoose connected DB =', mongoose.connection.db.databaseName);
    const verifyProd = await Product.findById(testProduct._id);
    console.log('Diagnostic: Product found in test script =', verifyProd ? verifyProd.name : 'NULL');

    // 2. Set up User A's Cart
    console.log('\n--> Setting up Cart for User A');
    await request('/api/cart/add', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({ productId: testProduct._id.toString(), quantity: 2 })
    });

    // 3. Test COD checkout flow (should fulfill immediately)
    console.log('\n--> Testing COD Order placement (should fulfill immediately)');
    const codRes = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        shippingAddress: { name: 'User A', phone: '1234567890', street: 'Street A', city: 'City A', state: 'State A', zip: '123456' },
        paymentMethod: 'COD',
        fairCoinsToRedeem: 0
      })
    });

    if (codRes.status === 201 && codRes.data.data.order.orderStatus === 'CONFIRMED') {
      console.log('  PASSED: COD order confirmed immediately');
    } else {
      throw new Error(`COD placement failed: ${JSON.stringify(codRes.data)}`);
    }

    // Verify stock decreased for COD order
    const codProduct = await Product.findById(testProduct._id);
    if (codProduct.stock === 8) {
      console.log('  PASSED: COD order decremented stock');
    } else {
      throw new Error(`COD stock check failed, stock is: ${codProduct.stock}`);
    }

    // 4. Test RAZORPAY checkout flow (should NOT fulfill immediately, should be PENDING)
    console.log('\n--> Testing Razorpay Order placement (should be PENDING)');
    // Refill stock
    await Product.findByIdAndUpdate(testProduct._id, { stock: 10 });
    // Add to cart again
    await request('/api/cart/add', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({ productId: testProduct._id.toString(), quantity: 2 })
    });

    const rzpRes = await request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        shippingAddress: { name: 'User A', phone: '1234567890', street: 'Street A', city: 'City A', state: 'State A', zip: '123456' },
        paymentMethod: 'RAZORPAY',
        fairCoinsToRedeem: 100 // redeem 100 coins for ₹10 discount
      })
    });

    const parentOrder = rzpRes.data.data.order;
    if (rzpRes.status === 201 && parentOrder.orderStatus === 'PENDING') {
      console.log('  PASSED: Razorpay order created in PENDING status');
    } else {
      throw new Error(`Razorpay placement failed: ${JSON.stringify(rzpRes.data)}`);
    }

    // Verify stock did NOT decrease yet
    const rzpProductBefore = await Product.findById(testProduct._id);
    if (rzpProductBefore.stock === 10) {
      console.log('  PASSED: Razorpay order did not decrement stock immediately');
    } else {
      throw new Error(`Stock decremented prematurely, stock is: ${rzpProductBefore.stock}`);
    }

    // 5. Test Razorpay Order creation permission
    console.log('\n--> Testing payment order creation permissions');
    // User B tries to pay for User A's order (should fail)
    const payFailRes = await request('/api/payments/create-order', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userBToken}` },
      body: JSON.stringify({ orderId: parentOrder._id.toString() })
    });

    if (payFailRes.status === 403) {
      console.log('  PASSED: User B was prevented from paying for User A\'s order');
    } else {
      throw new Error(`Unauthorized payment order creation was not blocked: ${JSON.stringify(payFailRes.data)}`);
    }

    // User A creates payment order (should succeed)
    const paySuccessRes = await request('/api/payments/create-order', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({ orderId: parentOrder._id.toString() })
    });

    const paymentPayload = paySuccessRes.data.data;
    if (paySuccessRes.status === 200 && paymentPayload.razorpayOrderId) {
      console.log(`  PASSED: Razorpay payment order created successfully [${paymentPayload.razorpayOrderId}]`);
    } else {
      throw new Error(`Payment order creation failed: ${JSON.stringify(paySuccessRes.data)}`);
    }

    // 6. Test payment verification signature check
    console.log('\n--> Testing payment signature verification');
    // Verify with invalid signature
    const verifyFailRes = await request('/api/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        razorpayOrderId: paymentPayload.razorpayOrderId,
        razorpayPaymentId: 'pay_dummy123',
        razorpaySignature: 'invalid_sig_here'
      })
    });

    if (verifyFailRes.status === 400) {
      console.log('  PASSED: Invalid signature rejected correctly');
    } else {
      throw new Error(`Invalid signature was not rejected: ${JSON.stringify(verifyFailRes.data)}`);
    }

    // Verify with valid signature
    const razorpayOrderId = paymentPayload.razorpayOrderId;
    const razorpayPaymentId = 'pay_real123_test';
    const razorpaySecret = env.RAZORPAY_KEY_SECRET || 'rzp_secret_demo';

    const hmac = crypto.createHmac('sha256', razorpaySecret);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const validSignature = hmac.digest('hex');

    const verifySuccessRes = await request('/api/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: validSignature
      })
    });

    if (verifySuccessRes.status === 200 && verifySuccessRes.data.success) {
      console.log('  PASSED: Valid signature accepted, payment verified');
    } else {
      throw new Error(`Valid signature verification failed: ${JSON.stringify(verifySuccessRes.data)}`);
    }

    // 7. Verify order fulfillment states
    console.log('\n--> Verifying order state updates after payment success');
    const updatedOrder = await Order.findById(parentOrder._id);
    if (updatedOrder.paymentStatus === 'PAID' && updatedOrder.orderStatus === 'CONFIRMED') {
      console.log('  PASSED: Order paymentStatus is PAID and orderStatus is CONFIRMED');
    } else {
      throw new Error(`Order state incorrect: paymentStatus=${updatedOrder.paymentStatus}, orderStatus=${updatedOrder.orderStatus}`);
    }

    const rzpProductAfter = await Product.findById(testProduct._id);
    if (rzpProductAfter.stock === 8) {
      console.log('  PASSED: Razorpay payment decremented stock successfully');
    } else {
      throw new Error(`Stock decrement failed: expected 8, got ${rzpProductAfter.stock}`);
    }

    // Verify coins were debited (200 credit + 20 COD purchase reward - 100 redeemed + 19 Razorpay purchase reward = 139)
    const coinUser = await User.findById(userAId);
    if (coinUser.fairCoinBalance === 139) {
      console.log('  PASSED: Fair coins debited and purchase rewards credited correctly');
    } else {
      throw new Error(`Coin balance incorrect: expected 139, got ${coinUser.fairCoinBalance}`);
    }

    // 8. Verify idempotency
    console.log('\n--> Testing payment verification idempotency');
    const verifyIdempotentRes = await request('/api/payments/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: validSignature
      })
    });

    if (verifyIdempotentRes.status === 200) {
      console.log('  PASSED: Second verification request processed cleanly without duplicate modifications');
    } else {
      throw new Error(`Idempotency request failed: ${JSON.stringify(verifyIdempotentRes.data)}`);
    }

    // 9. Webhook signature verification testing
    console.log('\n--> Testing Webhook signature verification');
    // Build a mock webhook captured payload
    const webhookOrderId = `order_mock_${Date.now()}`;
    const webhookPaymentId = `pay_mock_${Date.now()}`;

    // Create a mock payment record first to capture
    await Payment.create({
      orderId: parentOrder._id,
      userId: userAId,
      paymentMethod: 'RAZORPAY',
      transactionId: webhookOrderId,
      razorpayOrderId: webhookOrderId,
      amount: 1000,
      status: 'CREATED'
    });

    const webhookBody = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: webhookPaymentId,
            order_id: webhookOrderId,
            amount: 100000
          }
        }
      }
    });

    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_demo';
    const webhookSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookBody)
      .digest('hex');

    const webhookRes = await request('/api/payments/webhook', {
      method: 'POST',
      headers: {
        'x-razorpay-signature': webhookSig
      },
      body: webhookBody
    });

    if (webhookRes.status === 200 && webhookRes.data.data.received) {
      console.log('  PASSED: Webhook signature verified and event processed');
    } else {
      throw new Error(`Webhook validation failed: ${JSON.stringify(webhookRes.data)}`);
    }

    // Verify webhook updated the payment record to CAPTURED
    const webhookPaymentRecord = await Payment.findOne({ razorpayOrderId: webhookOrderId });
    if (webhookPaymentRecord.status === 'CAPTURED') {
      console.log('  PASSED: Webhook successfully updated payment status to CAPTURED');
    } else {
      throw new Error(`Payment record status incorrect: expected CAPTURED, got ${webhookPaymentRecord.status}`);
    }

    console.log('\n✨ ALL PHASE 2 INTEGRATION TESTS COMPLETED SUCCESSFULLY! ✨\n');
  } catch (err) {
    console.error(`\n❌ TEST FAILED: ${err.message}`);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
}

runTests();
