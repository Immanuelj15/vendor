import { qrAttributionService } from '../services/qrAttributionService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

// --- Vendor Routes ---

export const getVendorQR = asyncWrapper(async (req, res) => {
  const qr = await qrAttributionService.getOrGenerateVendorQR(req.user._id);
  return res.status(200).json(new ApiResponse(200, { qr }, 'Vendor QR fetched/generated successfully'));
});

export const getVendorQRDashboardStats = asyncWrapper(async (req, res) => {
  // To get the vendor ID, we can fetch the QR which contains it, or fetch vendor directly
  const qr = await qrAttributionService.getOrGenerateVendorQR(req.user._id);
  const data = await qrAttributionService.getVendorQRDashboardStats(qr.vendorId);
  return res.status(200).json(new ApiResponse(200, data, 'QR Dashboard stats fetched'));
});

export const getVendorCustomers = asyncWrapper(async (req, res) => {
  const data = await qrAttributionService.getVendorCustomers(req.user._id, req.query);
  return res.status(200).json(new ApiResponse(200, data, 'Customers fetched'));
});

// --- Public/Customer Routes ---

export const handleQRScan = asyncWrapper(async (req, res) => {
  const { token } = req.params;
  
  // Try to determine customerId if logged in (this route could be called from a public client, 
  // with or without auth token). It's best if the middleware sets req.user if present, but doesn't throw if not.
  const customerUserId = req.user ? req.user._id : null;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  // Record the raw scan
  const qr = await qrAttributionService.recordScan(token, customerUserId, ipAddress, userAgent);

  // If customer is logged in, attempt to process attribution immediately
  let attribution = null;
  let requireLogin = false;

  if (customerUserId) {
    attribution = await qrAttributionService.processAttribution(token, customerUserId);
  } else {
    requireLogin = true;
  }

  // Return vendor profile data so the frontend can display the shop regardless of login status
  const vendorData = {
    storeName: qr.vendorId.storeName,
    slug: qr.vendorId.slug,
    logo: qr.vendorId.logo,
    description: qr.vendorId.description
  };

  return res.status(200).json(new ApiResponse(200, {
    vendor: vendorData,
    requireLogin,
    attribution,
  }, 'Scan recorded'));
});

// Assuming a route where a user logs in and then we POST to process the pending scan
export const processPendingQRScan = asyncWrapper(async (req, res) => {
  const { token } = req.body;
  const customerUserId = req.user._id;

  const attribution = await qrAttributionService.processAttribution(token, customerUserId);
  return res.status(200).json(new ApiResponse(200, { attribution }, 'Attribution processed successfully'));
});

// Customer portal
export const getCustomerAttribution = asyncWrapper(async (req, res) => {
  const data = await qrAttributionService.getCustomerAttributionHistory(req.user._id);
  return res.status(200).json(new ApiResponse(200, data, 'Customer attribution history fetched'));
});
