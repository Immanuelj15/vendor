const baseLayout = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f6f9fc;
      color: #333333;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #e6ebf1;
    }
    .header {
      background: linear-gradient(135deg, #FF6F00 0%, #FF8F00 100%);
      padding: 30px 20px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
      line-height: 1.6;
    }
    .footer {
      background-color: #f6f9fc;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #8898aa;
      border-top: 1px solid #e6ebf1;
    }
    .button {
      display: inline-block;
      background-color: #FF6F00;
      color: #ffffff !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin-top: 20px;
    }
    .order-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .order-table th, .order-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e6ebf1;
    }
    .order-table th {
      background-color: #f6f9fc;
      font-weight: bold;
    }
    .highlight {
      font-weight: bold;
      color: #FF6F00;
    }
    .alert {
      padding: 15px;
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      margin-bottom: 20px;
      border-radius: 4px;
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      &copy; 2026 FairKart / Babu Super Market. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

export const templates = {
  orderConfirmation: (order) => baseLayout(
    'Order Confirmed',
    `
      <p>Hello,</p>
      <p>Thank you for shopping with us! Your order <strong>#${order.orderNumber}</strong> has been confirmed and is being processed.</p>
      <h3>Order Details:</h3>
      <table class="order-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>₹${(item.price / 100).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p><strong>Total:</strong> <span class="highlight">₹${(order.total / 100).toFixed(2)}</span></p>
      <p>We will update you as soon as your items are packed and ready to ship.</p>
    `
  ),

  paymentSuccess: (payment, orderNumber) => baseLayout(
    'Payment Successful',
    `
      <p>Hello,</p>
      <p>We have successfully received your payment of <span class="highlight">₹${(payment.amount / 100).toFixed(2)}</span> for ${orderNumber ? `Order #${orderNumber}` : 'your subscription'}.</p>
      <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
      <p><strong>Date:</strong> ${new Date(payment.verifiedAt || Date.now()).toLocaleString()}</p>
      <p>Thank you for choosing FairKart!</p>
    `
  ),

  kycApproved: (kyc) => baseLayout(
    'KYC Approved',
    `
      <p>Hello,</p>
      <p>Congratulations! Your KYC document of type <strong>${kyc.documentType}</strong> has been verified successfully.</p>
      <p>Your shopkeeper account status is now updated. You can proceed to activate your shop and purchase subscriptions.</p>
      <a href="http://localhost:5173/shopkeeper/dashboard" class="button">Go to Dashboard</a>
    `
  ),

  kycRejected: (kyc, reason) => baseLayout(
    'KYC Document Rejected',
    `
      <p>Hello,</p>
      <div class="alert">
        <strong>Rejection Notice:</strong> Your KYC document (${kyc.documentType}) was rejected.
      </div>
      <p><strong>Reason for rejection:</strong> ${reason || 'Invalid or unclear documents'}</p>
      <p>Please log in to your account and re-submit a valid document to resume onboarding.</p>
      <a href="http://localhost:5173/shopkeeper/onboarding" class="button">Re-submit KYC</a>
    `
  ),

  subscriptionActivated: (subscription, isRenewal) => baseLayout(
    isRenewal ? 'Subscription Renewed' : 'Subscription Activated',
    `
      <p>Hello,</p>
      <p>Your subscription is now active!</p>
      <p><strong>Expiry Date:</strong> ${new Date(subscription.endDate).toLocaleDateString()}</p>
      <p>Your shop operations remain fully active and customer orders are attribution-ready.</p>
      <a href="http://localhost:5173/shopkeeper/dashboard" class="button">Manage Shop</a>
    `
  ),

  subscriptionExpiring: (subscription, daysRemaining) => baseLayout(
    'Subscription Expiring Soon',
    `
      <p>Hello,</p>
      <div class="alert">
        Your subscription will expire in <strong>${daysRemaining} days</strong> on ${new Date(subscription.endDate).toLocaleDateString()}.
      </div>
      <p>Please renew your subscription to prevent disruption of your shop's operations and sales attributions.</p>
      <a href="http://localhost:5173/shopkeeper/dashboard" class="button">Renew Now</a>
    `
  ),

  orderShipped: (order) => baseLayout(
    'Order Dispatched',
    `
      <p>Hello,</p>
      <p>Great news! Your order <strong>#${order.orderNumber}</strong> has been dispatched.</p>
      <p>Our delivery partner is on the way to collect/deliver your package.</p>
      <p>You can track the order status directly from your dashboard.</p>
    `
  ),

  outForDelivery: (order) => baseLayout(
    'Out for Delivery',
    `
      <p>Hello,</p>
      <p>Your order <strong>#${order.orderNumber}</strong> is out for delivery today!</p>
      <p>Please keep your phone active for our delivery partner's call.</p>
    `
  ),

  delivered: (order) => baseLayout(
    'Order Delivered',
    `
      <p>Hello,</p>
      <p>Your order <strong>#${order.orderNumber}</strong> has been successfully delivered.</p>
      <p>We hope you enjoy your purchase! Thank you for shopping with FairKart.</p>
    `
  )
};
