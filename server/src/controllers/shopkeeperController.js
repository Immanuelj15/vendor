import { shopkeeperService } from '../services/shopkeeperService.js';
import { kycService } from '../services/kycService.js';
import { subscriptionService } from '../services/subscriptionService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

export const onboardShopkeeper = asyncWrapper(async (req, res) => {
  const shopkeeper = await shopkeeperService.onboardShopkeeper(req.user, req.body);
  return res.status(201).json(new ApiResponse(201, { shopkeeper }, 'Shopkeeper onboarding initiated'));
});

export const getShopkeeperById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const shopkeeper = await shopkeeperService.getShopkeeperById(req.user, id);
  return res.status(200).json(new ApiResponse(200, { shopkeeper }, 'Shopkeeper profile retrieved'));
});

export const listShopkeepers = asyncWrapper(async (req, res) => {
  const shopkeepers = await shopkeeperService.listShopkeepers(req.user, req.query);
  return res.status(200).json(new ApiResponse(200, { shopkeepers }, 'Shopkeepers retrieved'));
});

export const submitKyc = asyncWrapper(async (req, res) => {
  const kyc = await shopkeeperService.submitKyc(req.user, req.body);
  return res.status(201).json(new ApiResponse(201, { kyc }, 'KYC document submitted successfully'));
});

export const reviewKyc = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;
  const kyc = await shopkeeperService.reviewKyc(req.user, id, status, rejectionReason);
  return res.status(200).json(new ApiResponse(200, { kyc }, 'KYC document review complete'));
});

export const createSubscriptionPlan = asyncWrapper(async (req, res) => {
  const plan = await shopkeeperService.createSubscriptionPlan(req.user, req.body);
  return res.status(201).json(new ApiResponse(201, { plan }, 'Subscription plan created'));
});

export const listSubscriptionPlans = asyncWrapper(async (req, res) => {
  const plans = await shopkeeperService.listSubscriptionPlans();
  return res.status(200).json(new ApiResponse(200, { plans }, 'Subscription plans retrieved'));
});

export const activateSubscription = asyncWrapper(async (req, res) => {
  const subscription = await shopkeeperService.activateSubscription(req.user, req.body);
  return res.status(201).json(new ApiResponse(201, { subscription }, 'Subscription activated successfully'));
});

export const renewSubscription = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { paymentId } = req.body;
  const result = await shopkeeperService.renewSubscription(req.user, id, paymentId);
  if (result && result.paymentPayload) {
    return res.status(200).json(new ApiResponse(200, result, 'Subscription renewal initiated'));
  }
  return res.status(200).json(new ApiResponse(200, { subscription: result }, 'Subscription renewed successfully'));
});

export const createShop = asyncWrapper(async (req, res) => {
  const shop = await shopkeeperService.createShop(req.user, req.body);
  return res.status(201).json(new ApiResponse(201, { shop }, 'Shop approved and registered successfully'));
});

export const getShopById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const shop = await shopkeeperService.getShopById(req.user, id);
  return res.status(200).json(new ApiResponse(200, { shop }, 'Shop record retrieved'));
});

export const listShops = asyncWrapper(async (req, res) => {
  const shops = await shopkeeperService.listShops(req.user, req.query);
  return res.status(200).json(new ApiResponse(200, { shops }, 'Shops list retrieved'));
});

export const updateShopStatus = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const shop = await shopkeeperService.updateShopStatus(req.user, id, status);
  return res.status(200).json(new ApiResponse(200, { shop }, 'Shop status updated successfully'));
});

export const generateShopQR = asyncWrapper(async (req, res) => {
  const { shopId } = req.params;
  const { regenerate } = req.body;
  const qr = await shopkeeperService.generateShopQR(req.user, shopId, regenerate === true);
  return res.status(200).json(new ApiResponse(200, { qr }, 'Shop QR code generated/retrieved successfully'));
});

export const revokeShopQR = asyncWrapper(async (req, res) => {
  const { shopId } = req.params;
  const qr = await shopkeeperService.revokeShopQR(req.user, shopId);
  return res.status(200).json(new ApiResponse(200, { qr }, 'Shop QR code revoked successfully'));
});

export const resolveShopQR = asyncWrapper(async (req, res) => {
  const { publicToken } = req.params;
  const shopInfo = await shopkeeperService.resolveShopQR(publicToken);
  return res.status(200).json(new ApiResponse(200, shopInfo, 'Shop QR code resolved successfully'));
});

export const attributeCustomerQR = asyncWrapper(async (req, res) => {
  const { publicToken } = req.params;
  const attributionResult = await shopkeeperService.attributeCustomerQR(req.user._id, publicToken);
  return res.status(200).json(new ApiResponse(200, attributionResult, 'Customer shop attribution processed'));
});

export const getMyKyc = asyncWrapper(async (req, res) => {
  const kyc = await kycService.getMyKyc(req.user);
  return res.status(200).json(new ApiResponse(200, { kyc }, 'My KYC documents retrieved'));
});

export const getKycById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const kyc = await kycService.getKycById(req.user, id);
  return res.status(200).json(new ApiResponse(200, { kyc }, 'KYC document retrieved'));
});

export const listKycDocuments = asyncWrapper(async (req, res) => {
  const kycDocs = await kycService.listKycDocuments(req.user, req.query);
  return res.status(200).json(new ApiResponse(200, { kycDocuments: kycDocs }, 'KYC documents retrieved'));
});

export const createSubscription = asyncWrapper(async (req, res) => {
  const result = await subscriptionService.createSubscription(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, result, 'Subscription created in PENDING state'));
});

export const getMySubscriptions = asyncWrapper(async (req, res) => {
  const subscriptions = await subscriptionService.getMySubscriptions(req.user._id);
  return res.status(200).json(new ApiResponse(200, { subscriptions }, 'User subscriptions retrieved'));
});

export const getShopkeeperEarnings = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { Shopkeeper } = await import('../models/Shopkeeper.js');
  const shopkeeper = await Shopkeeper.findById(id);
  if (!shopkeeper) {
    return res.status(404).json(new ApiResponse(404, null, 'Shopkeeper not found'));
  }

  if (shopkeeper.userId.toString() !== req.user._id.toString() && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json(new ApiResponse(403, null, 'Unauthorized access to shopkeeper earnings'));
  }

  const { Shop } = await import('../models/Shop.js');
  const { CustomerShopAttribution } = await import('../models/CustomerShopAttribution.js');
  const { Commission } = await import('../models/Commission.js');

  const shops = await Shop.find({ shopkeeperId: id });
  const shopIds = shops.map(s => s._id);

  const attributedCustomerCount = await CustomerShopAttribution.countDocuments({
    shopId: { $in: shopIds },
    status: 'ACTIVE'
  });

  const commissions = await Commission.find({ recipientUserId: shopkeeper.userId }).sort({ createdAt: -1 });

  const totalEarnings = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
  const paidCommission = commissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.commissionAmount, 0);
  const pendingCommission = commissions.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + c.commissionAmount, 0);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        shopkeeperId: id,
        attributedCustomerCount,
        totalEarnings,
        paidCommission,
        pendingCommission,
        settlementHistory: commissions
      },
      'Shopkeeper earnings retrieved successfully'
    )
  );
});
