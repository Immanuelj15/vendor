import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const invoiceService = {
  /**
   * Generate clean printable HTML invoice for an order.
   */
  async generateInvoiceHtml(orderId, user) {
    const order = await Order.findById(orderId).populate('userId', 'name email phone');
    if (!order) {
      throw new ApiError(404, 'Order not found', ERROR_CODES.NOT_FOUND);
    }

    if (user) {
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
      if (!isAdmin && order.userId._id.toString() !== user._id.toString()) {
        throw new ApiError(403, 'Access denied: You do not own this order', ERROR_CODES.FORBIDDEN);
      }
    }

    const payment = await Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 });

    const invoiceNumber = `INV-${order.orderNumber}`;
    const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const customerName = order.deliveryAddressSnapshot?.name || order.userId?.name || 'Valued Customer';
    const customerPhone = order.deliveryAddressSnapshot?.phone || order.userId?.phone || 'N/A';
    const customerEmail = order.userId?.email || 'N/A';
    const streetAddress = order.deliveryAddressSnapshot?.streetAddress || order.deliveryAddressSnapshot?.street || '';
    const city = order.deliveryAddressSnapshot?.city || '';
    const state = order.deliveryAddressSnapshot?.state || '';
    const postalCode = order.deliveryAddressSnapshot?.postalCode || order.deliveryAddressSnapshot?.zip || '';

    const itemsRows = order.items
      .map(
        (item, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 8px; font-size: 13px; color: #1e293b;">${idx + 1}</td>
          <td style="padding: 12px 8px; font-size: 13px; color: #1e293b; font-weight: 600;">
            ${item.productNameSnapshot || item.name}
            ${item.skuSnapshot ? `<br><span style="font-size: 10px; color: #64748b; font-family: monospace;">SKU: ${item.skuSnapshot}</span>` : ''}
          </td>
          <td style="padding: 12px 8px; font-size: 13px; color: #1e293b; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px 8px; font-size: 13px; color: #1e293b; text-align: right;">₹${item.price || item.unitPrice}</td>
          <td style="padding: 12px 8px; font-size: 13px; color: #1e293b; text-align: right; font-weight: 600;">₹${(item.price || item.unitPrice) * item.quantity}</td>
        </tr>
      `
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${invoiceNumber}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 30px;
      background-color: #f8fafc;
      color: #0f172a;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-paid { background: #dcfce7; color: #166534; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-failed { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>

  <div class="invoice-card">
    <!-- Print Button Header -->
    <div class="no-print" style="margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 13px; color: #64748b;">FairKart Official Electronic Tax Invoice</span>
      <button onclick="window.print()" style="padding: 8px 18px; background: #4f46e5; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer;">
        🖨️ Print / Download PDF
      </button>
    </div>

    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 25px; margin-bottom: 25px;">
      <div>
        <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #4f46e5; letter-spacing: -0.5px;">FairKart</h1>
        <p style="margin: 4px 0 0; font-size: 12px; color: #64748b; font-weight: 500;">Babu Super Market & Multi-Vendor Marketplace</p>
        <p style="margin: 2px 0 0; font-size: 11px; color: #94a3b8;">GSTIN: 29AAAAA0000A1Z5 | Support: care@fairkart.dev</p>
      </div>
      <div style="text-align: right;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a;">TAX INVOICE</h2>
        <p style="margin: 4px 0 0; font-size: 12px; color: #475569; font-weight: 600;">${invoiceNumber}</p>
        <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">Date: ${invoiceDate}</p>
        <div style="margin-top: 6px;">
          <span class="badge ${order.paymentStatus === 'PAID' ? 'badge-paid' : order.paymentStatus === 'FAILED' ? 'badge-failed' : 'badge-pending'}">
            Payment: ${order.paymentStatus}
          </span>
        </div>
      </div>
    </div>

    <!-- Bill To & Order Info -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13px;">
      <div style="width: 48%;">
        <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Billed / Delivered To:</p>
        <p style="margin: 0; font-weight: 700; color: #0f172a; font-size: 14px;">${customerName}</p>
        <p style="margin: 2px 0; color: #475569;">${streetAddress ? `${streetAddress}, ` : ''}${city} ${state} ${postalCode}</p>
        <p style="margin: 2px 0; color: #475569;">Phone: ${customerPhone}</p>
        <p style="margin: 2px 0; color: #475569;">Email: ${customerEmail}</p>
      </div>
      <div style="width: 48%; text-align: right;">
        <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Order Information:</p>
        <p style="margin: 2px 0; color: #475569;"><strong style="color: #0f172a;">Order Number:</strong> #${order.orderNumber}</p>
        <p style="margin: 2px 0; color: #475569;"><strong style="color: #0f172a;">Order Status:</strong> ${order.orderStatus}</p>
        <p style="margin: 2px 0; color: #475569;"><strong style="color: #0f172a;">Payment Method:</strong> ${order.paymentMethod}</p>
        ${payment?.razorpayPaymentId ? `<p style="margin: 2px 0; color: #475569; font-family: monospace; font-size: 11px;"><strong style="font-family: inherit; color: #0f172a;">Payment Ref:</strong> ${payment.razorpayPaymentId}</p>` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
      <thead>
        <tr style="background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 2px solid #cbd5e1;">
          <th style="padding: 10px 8px; font-size: 11px; font-weight: 700; color: #64748b; text-align: left; text-transform: uppercase; width: 40px;">#</th>
          <th style="padding: 10px 8px; font-size: 11px; font-weight: 700; color: #64748b; text-align: left; text-transform: uppercase;">Product Description</th>
          <th style="padding: 10px 8px; font-size: 11px; font-weight: 700; color: #64748b; text-align: center; text-transform: uppercase; width: 60px;">Qty</th>
          <th style="padding: 10px 8px; font-size: 11px; font-weight: 700; color: #64748b; text-align: right; text-transform: uppercase; width: 100px;">Unit Price</th>
          <th style="padding: 10px 8px; font-size: 11px; font-weight: 700; color: #64748b; text-align: right; text-transform: uppercase; width: 100px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- Totals & Summary -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 20px;">
      <div style="width: 50%; font-size: 11px; color: #64748b; line-height: 1.6;">
        <p style="margin: 0; font-weight: 700; color: #334155;">Terms & Conditions:</p>
        <p style="margin: 2px 0;">1. Goods sold are subject to FairKart returns and refund policies.</p>
        <p style="margin: 2px 0;">2. This is a computer generated invoice and does not require a physical signature.</p>
      </div>
      <div style="width: 40%;">
        <table style="width: 100%; font-size: 13px; line-height: 1.8;">
          <tr>
            <td style="color: #64748b;">Subtotal:</td>
            <td style="text-align: right; font-weight: 600; color: #0f172a;">₹${order.subtotal || order.itemsSubtotal}</td>
          </tr>
          ${
            order.discount > 0
              ? `<tr>
                  <td style="color: #10b981;">Coupon Discount (${order.couponCode || 'PROMO'}):</td>
                  <td style="text-align: right; font-weight: 600; color: #10b981;">-₹${order.discount}</td>
                </tr>`
              : ''
          }
          ${
            order.coinDiscount > 0
              ? `<tr>
                  <td style="color: #f59e0b;">Fair Coins (${order.fairCoinsUsed} coins):</td>
                  <td style="text-align: right; font-weight: 600; color: #f59e0b;">-₹${order.coinDiscount}</td>
                </tr>`
              : ''
          }
          <tr>
            <td style="color: #64748b;">Shipping Fee:</td>
            <td style="text-align: right; font-weight: 600; color: #0f172a;">${order.shippingFee > 0 ? `₹${order.shippingFee}` : 'FREE'}</td>
          </tr>
          ${
            order.tax > 0
              ? `<tr>
                  <td style="color: #64748b;">Tax:</td>
                  <td style="text-align: right; font-weight: 600; color: #0f172a;">₹${order.tax}</td>
                </tr>`
              : ''
          }
          <tr style="border-top: 2px solid #0f172a;">
            <td style="padding-top: 8px; font-size: 16px; font-weight: 800; color: #0f172a;">Grand Total:</td>
            <td style="padding-top: 8px; text-align: right; font-size: 18px; font-weight: 900; color: #4f46e5;">₹${order.total || order.grandTotal}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
      Thank you for shopping with FairKart / Babu Super Market! For queries, visit https://fairkart.dev or contact support.
    </div>
  </div>

</body>
</html>`;

    return { html, invoiceNumber };
  },
};
