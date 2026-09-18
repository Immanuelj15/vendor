import http from 'http';
import app from '../src/app.js';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Order } from '../src/models/Order.js';
import { VendorOrder } from '../src/models/VendorOrder.js';
import { Product } from '../src/models/Product.js';
import { Vendor } from '../src/models/Vendor.js';
import { Fulfillment } from '../src/models/Fulfillment.js';
import { DeliveryPartner } from '../src/models/DeliveryPartner.js';
import { DeliveryAssignment } from '../src/models/DeliveryAssignment.js';
import { ReturnRequest } from '../src/models/ReturnRequest.js';
import { env } from '../src/config/env.js';

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

let server;

async function runTests() {
  console.log('🧪 Starting Phase 7 Fulfillment & Delivery Integration Tests...\n');

  try {
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB');

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
      const res = await fetch(`${baseUrl}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
      });
      const data = await res.json();
      return { status: res.status, data };
    }

    // 1. Fetch default seeded users
    const admin = await User.findOne({ role: 'SUPER_ADMIN' });
    const vendorUser = await User.findOne({ email: 'vendor@fairkart.dev' });
    const customer = await User.findOne({ email: 'user@fairkart.dev' });

    if (!admin || !vendorUser || !customer) {
      throw new Error('Required seed users are missing. Run seed script first.');
    }

    // Ensure vendorUser has the VENDOR role for tests
    vendorUser.role = 'VENDOR';
    await vendorUser.save();

    // Login to get tokens
    async function login(email) {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'Password@123' }),
      });
      if (res.status !== 200) {
        throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
      }
      return res.data.data.accessToken;
    }

    const adminToken = await login(admin.email);
    const vendorToken = await login(vendorUser.email);
    const customerToken = await login(customer.email);

    // 2. Create a mock order to test fulfillment
    const vendor = await Vendor.findOne({ userId: vendorUser._id });
    const product = await Product.findOne({ vendorId: vendor._id });

    if (!vendor || !product) {
      throw new Error('Seed vendor or product is missing.');
    }

    console.log('\n--> Creating test Order...');
    const orderNumber = `FK-T-${Date.now()}`;
    const order = await Order.create({
      orderNumber,
      userId: customer._id,
      items: [
        {
          productId: product._id,
          vendorId: vendor._id,
          name: product.name,
          price: product.price,
          quantity: 2,
        },
      ],
      shippingAddress: {
        name: 'Test Customer',
        phone: '1234567890',
        street: '123 Test Lane',
        city: 'Bengaluru',
        state: 'Karnataka',
        zip: '560001',
      },
      subtotal: product.price * 2,
      total: product.price * 2,
      paymentMethod: 'COD',
      orderStatus: 'CONFIRMED',
      paymentStatus: 'PENDING',
    });

    const vendorOrder = await VendorOrder.create({
      subOrderNumber: `${orderNumber}-V001`,
      parentOrderId: order._id,
      vendorId: vendor._id,
      userId: customer._id,
      items: [
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: 2,
        },
      ],
      subtotal: product.price * 2,
      platformCommission: 10,
      vendorEarning: product.price * 2 - 10,
      status: 'CONFIRMED',
    });

    console.log(`  PASSED: Test order ${order.orderNumber} created`);

    // 3. Test Fulfillment Creation
    console.log('\n--> Testing Fulfillment Creation Service...');
    const { fulfillmentService } = await import('../src/services/fulfillmentService.js');
    await fulfillmentService.createFulfillmentForOrder(order._id);

    const fulfillment = await Fulfillment.findOne({ orderId: order._id });
    if (fulfillment) {
      console.log(`  PASSED: Fulfillment created with status: [${fulfillment.status}]`);
    } else {
      throw new Error('Fulfillment was not created.');
    }

    // 4. Test Duplicate Fulfillment Prevention
    console.log('\n--> Testing duplicate fulfillment prevention...');
    const initialCount = await Fulfillment.countDocuments({ orderId: order._id });
    await fulfillmentService.createFulfillmentForOrder(order._id);
    const finalCount = await Fulfillment.countDocuments({ orderId: order._id });

    if (initialCount === finalCount) {
      console.log('  PASSED: Duplicate creation prevented (idempotent)');
    } else {
      throw new Error('Duplicate fulfillment was created.');
    }

    // 5. Test Picking Workflow
    console.log('\n--> Testing Picking Workflow (Vendor Role)...');
    const pickRes = await request(`/api/fulfillments/vendors/fulfillments/${fulfillment._id}/pick`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${vendorToken}` },
      body: JSON.stringify({
        items: [{ productId: product._id.toString(), pickedQuantity: 2 }],
      }),
    });

    if (pickRes.status === 200 && pickRes.data.data.status === 'PICKED') {
      console.log('  PASSED: Picking completed, status moved to PICKED');
    } else {
      throw new Error(`Picking failed: ${JSON.stringify(pickRes.data)}`);
    }

    // 6. Test Picking Exceeding Quantity (Should Fail)
    console.log('\n--> Testing picking quantity exceeding ordered (Should Fail)...');
    const invalidFulfillment = await Fulfillment.create({
      orderId: order._id,
      vendorOrderId: new mongoose.Types.ObjectId(),
      sourceType: 'VENDOR',
      sourceId: vendor._id,
      status: 'PROCESSING',
      items: [{ productId: product._id, name: product.name, quantity: 1 }],
    });

    const invalidPickRes = await request(`/api/fulfillments/vendors/fulfillments/${invalidFulfillment._id}/pick`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${vendorToken}` },
      body: JSON.stringify({
        items: [{ productId: product._id.toString(), pickedQuantity: 5 }],
      }),
    });

    if (invalidPickRes.status === 400) {
      console.log('  PASSED: Exceeding quantity request rejected (400)');
    } else {
      throw new Error('Exceeding quantity check failed.');
    }

    // Clean up temporary fulfillment
    await Fulfillment.deleteOne({ _id: invalidFulfillment._id });

    // 7. Test Packing Workflow
    console.log('\n--> Testing Packing Workflow (Vendor Role)...');
    const packRes = await request(`/api/fulfillments/vendors/fulfillments/${fulfillment._id}/pack`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${vendorToken}` },
      body: JSON.stringify({
        weight: 1.5,
        dimensions: { length: 10, width: 8, height: 5 },
      }),
    });

    if (packRes.status === 200 && packRes.data.data.fulfillment.status === 'PACKED') {
      console.log(`  PASSED: Fulfillment status PACKED, Tracking Code generated: [${packRes.data.data.package.trackingNumber}]`);
    } else {
      throw new Error(`Packing failed: ${JSON.stringify(packRes.data)}`);
    }

    // 8. Test Hub Receiving
    console.log('\n--> Testing Hub Receiving (Admin/Staff)...');
    // Fetch or create a test hub
    const { FulfillmentHub } = await import('../src/models/FulfillmentHub.js');
    let hub = await FulfillmentHub.findOne({ code: 'TESTHUB' });
    if (!hub) {
      hub = await FulfillmentHub.create({
        name: 'Test Logistics Hub',
        code: 'TESTHUB',
        type: 'DISTRIBUTION_HUB',
        territoryId: '660a12345678901234567890',
        address: '1 Logistics Way',
        contact: { name: 'Manager', phone: '1234567890', email: 'hub@test.com' },
        createdBy: admin._id,
      });
    }

    const receiveRes = await request(`/api/fulfillments/hubs/fulfillments/${fulfillment._id}/receive`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ hubId: hub._id }),
    });

    if (receiveRes.status === 200 && receiveRes.data.data.status === 'READY_FOR_DISPATCH') {
      console.log('  PASSED: Received at hub and sorted to READY_FOR_DISPATCH');
    } else {
      throw new Error(`Hub receive failed: ${JSON.stringify(receiveRes.data)}`);
    }

    // 9. Test Security / IDOR Checks (Customer cannot update fulfillment status)
    console.log('\n--> Testing IDOR Protection (Customer cannot update fulfillment)...');
    const customerUpdateRes = await request(`/api/fulfillments/vendors/fulfillments/${fulfillment._id}/pick`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        items: [{ productId: product._id.toString(), pickedQuantity: 2 }],
      }),
    });

    if (customerUpdateRes.status === 403) {
      console.log('  PASSED: Customer update blocked (403 Forbidden)');
    } else {
      throw new Error('IDOR security boundary check failed.');
    }

    // 10. Test Parent Order Status Derivation (Cancellation Workflow)
    console.log('\n--> Testing Order Cancellation Workflow & Stock Restitution...');
    const stockBefore = product.stock;
    const cancelRes = await request(`/api/returns/orders/${order._id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    if (cancelRes.status === 200 && cancelRes.data.data.orderStatus === 'CANCELLED') {
      const updatedProduct = await Product.findById(product._id);
      if (updatedProduct.stock === stockBefore + 2) {
        console.log('  PASSED: Order successfully cancelled, stock returned/restored correctly');
      } else {
        throw new Error(`Stock not restored correctly. Expected ${stockBefore + 2}, got ${updatedProduct.stock}`);
      }
    } else {
      throw new Error(`Cancellation failed: ${JSON.stringify(cancelRes.data)}`);
    }

    console.log('\n✨ ALL PHASE 7 LOGISTICS INTEGRATION TESTS COMPLETED SUCCESSFULLY! ✨\n');
  } catch (err) {
    console.error(`\n❌ TEST FAILED: ${err.message}`);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
}

runTests();
