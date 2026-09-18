import crypto from 'crypto';
import { Vendor } from '../models/Vendor.js';
import { VendorQRCode } from '../models/VendorQRCode.js';
import { CustomerVendorAttribution } from '../models/CustomerVendorAttribution.js';
import { QRScanLog } from '../models/QRScanLog.js';
import { Settings } from '../models/Settings.js';
import { vendorService } from './vendorService.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const qrAttributionService = {
  
  async getOrGenerateVendorQR(userId) {
    // 1. Ensure vendor is eligible
    const vendor = await vendorService.checkVendorEligibility(userId);

    // 2. Check if active QR already exists
    let qr = await VendorQRCode.findOne({ vendorId: vendor._id, status: 'ACTIVE' });
    
    if (!qr) {
      // 3. Generate secure random token
      const publicToken = crypto.randomBytes(16).toString('hex');
      qr = await VendorQRCode.create({
        vendorId: vendor._id,
        publicToken,
        status: 'ACTIVE',
      });
    }

    return qr;
  },

  async getVendorQRDashboardStats(vendorId) {
    const qr = await VendorQRCode.findOne({ vendorId, status: 'ACTIVE' });
    if (!qr) return null;

    const totalScans = await QRScanLog.countDocuments({ qrCodeId: qr._id });
    
    // Unique Visitors based on IP or CustomerId
    const uniqueVisitorsResult = await QRScanLog.aggregate([
      { $match: { qrCodeId: qr._id } },
      { $group: { _id: { $cond: [ { $eq: ["$customerUserId", null] }, "$ipAddress", "$customerUserId" ] } } }
    ]);
    const uniqueVisitors = uniqueVisitorsResult.length;

    const attributedCustomers = await CustomerVendorAttribution.countDocuments({ 
      vendorId, 
      qrCodeId: qr._id, 
      isPrimary: true 
    });

    return {
      qr,
      stats: {
        totalScans,
        uniqueVisitors,
        attributedCustomers,
      }
    };
  },

  async recordScan(publicToken, customerUserId = null, ipAddress = '', userAgent = '') {
    const qr = await VendorQRCode.findOne({ publicToken }).populate('vendorId');
    if (!qr) {
      throw new ApiError(404, 'Invalid QR code', ERROR_CODES.NOT_FOUND);
    }

    // Always record the scan, even if revoked, for audit purposes, but we handle logic below
    await QRScanLog.create({
      qrCodeId: qr._id,
      vendorId: qr.vendorId._id,
      customerUserId: customerUserId || null,
      ipAddress,
      userAgent
    });

    return qr;
  },

  async processAttribution(publicToken, customerUserId) {
    if (!customerUserId) {
      throw new ApiError(401, 'Customer must be logged in for attribution', ERROR_CODES.UNAUTHORIZED);
    }

    const qr = await VendorQRCode.findOne({ publicToken }).populate('vendorId');
    if (!qr) throw new ApiError(404, 'Invalid QR code', ERROR_CODES.NOT_FOUND);

    // 1. Check if QR is active
    if (qr.status !== 'ACTIVE') {
      throw new ApiError(400, 'This QR code is no longer active', ERROR_CODES.BAD_REQUEST);
    }

    // 2. Ensure Vendor is still eligible (e.g., not blocked/suspended after QR generation)
    const vendor = await Vendor.findById(qr.vendorId._id);
    if (!vendor || vendor.status !== 'APPROVED') {
      throw new ApiError(400, 'Vendor is currently not eligible for new attributions', ERROR_CODES.BAD_REQUEST);
    }

    // 3. Determine business rule (e.g. FIRST_SCAN, LATEST_SCAN)
    const setting = await Settings.findOne({ key: 'CUSTOMER_ATTRIBUTION_MODE' });
    const mode = setting ? setting.value : 'FIRST_SCAN';

    // 4. Check if customer already has an existing primary attribution
    const existingPrimary = await CustomerVendorAttribution.findOne({ 
      customerUserId, 
      isPrimary: true 
    });

    // 5. Check if they are already attributed to THIS specific vendor
    const alreadyAttributedToThisVendor = await CustomerVendorAttribution.findOne({
      customerUserId,
      vendorId: vendor._id
    });

    if (alreadyAttributedToThisVendor) {
      // If already attributed, don't create duplicate, just return it
      return alreadyAttributedToThisVendor;
    }

    // Logic based on mode
    let isPrimary = false;

    if (mode === 'FIRST_SCAN') {
      // If they have an existing primary, this one is secondary
      isPrimary = !existingPrimary;
    } else if (mode === 'LATEST_SCAN') {
      // LATEST_SCAN: If they have an existing primary, downgrade it
      if (existingPrimary) {
        existingPrimary.isPrimary = false;
        await existingPrimary.save();
      }
      isPrimary = true;
    }

    // Create the attribution
    const attribution = await CustomerVendorAttribution.create({
      customerUserId,
      vendorId: vendor._id,
      qrCodeId: qr._id,
      source: 'QR_SCAN',
      status: 'ACTIVE',
      isPrimary
    });

    return attribution;
  },

  async getVendorCustomers(userId, { page = 1, limit = 10 } = {}) {
    // Only approved vendors can see this
    const vendor = await vendorService.checkVendorEligibility(userId);

    const skip = (page - 1) * limit;
    
    // Find attributions for this vendor
    const attributions = await CustomerVendorAttribution.find({ vendorId: vendor._id })
      .populate('customerUserId', 'name email phone createdAt') // Be careful not to expose too much
      .sort({ attributedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CustomerVendorAttribution.countDocuments({ vendorId: vendor._id });

    return {
      customers: attributions.map(attr => ({
        id: attr.customerUserId._id,
        name: attr.customerUserId.name,
        // email: attr.customerUserId.email, // Depends on privacy rules, leaving out for now to be safe
        attributedAt: attr.attributedAt,
        source: attr.source,
        isPrimary: attr.isPrimary
      })),
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    };
  },

  async getCustomerAttributionHistory(customerUserId) {
    const history = await CustomerVendorAttribution.find({ customerUserId })
      .populate('vendorId', 'storeName slug address city state phone')
      .sort({ attributedAt: -1 });

    const primary = history.find(h => h.isPrimary && h.status === 'ACTIVE');

    return {
      primaryVendor: primary ? primary.vendorId : null,
      primarySince: primary ? primary.attributedAt : null,
      history: history.map(h => ({
        vendorName: h.vendorId.storeName,
        location: `${h.vendorId.city || ''}, ${h.vendorId.state || ''}`.replace(/^, /, ''),
        date: h.attributedAt,
        source: h.source,
        isPrimary: h.isPrimary
      }))
    };
  }
};
