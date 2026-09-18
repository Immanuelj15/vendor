import { Shipment } from '../models/Shipment.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { VendorShippingAddress } from '../models/VendorShippingAddress.js';
import { Order } from '../models/Order.js';
import { ShipmentTrackingEvent } from '../models/ShipmentTrackingEvent.js';
import { ShippingException } from '../models/ShippingException.js';
import { providerFactory } from './courier/providerFactory.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const shippingService = {
  
  async createShipment(suborderId, vendorId, packageData) {
    const suborder = await VendorOrder.findOne({ _id: suborderId, vendorId });
    if (!suborder) throw new ApiError(404, 'Suborder not found', ERROR_CODES.NOT_FOUND);

    if (suborder.status !== 'READY_TO_SHIP') {
      throw new ApiError(400, 'Suborder must be in READY_TO_SHIP status to create a shipment', ERROR_CODES.BAD_REQUEST);
    }

    const existingShipment = await Shipment.findOne({ suborderId });
    if (existingShipment) {
      throw new ApiError(400, 'Shipment already exists for this suborder', ERROR_CODES.BAD_REQUEST);
    }

    const masterOrder = await Order.findById(suborder.parentOrderId);
    if (!masterOrder) throw new ApiError(404, 'Master order not found', ERROR_CODES.NOT_FOUND);

    const originAddress = await VendorShippingAddress.findOne({ vendorId, isDefault: true }).populate('state district area');
    if (!originAddress) {
      throw new ApiError(400, 'Default shipping origin address not set', ERROR_CODES.BAD_REQUEST);
    }

    const { weight, length, width, height, packageCount, providerName = 'SHIPROCKET' } = packageData;

    const provider = providerFactory.getProvider(providerName);
    
    // 1. Check serviceability
    const serviceability = await provider.getServiceability(
      originAddress.pincode, 
      masterOrder.deliveryAddressSnapshot.zip, 
      weight
    );

    if (!serviceability.serviceable) {
      throw new ApiError(400, 'Route not serviceable by selected courier', ERROR_CODES.BAD_REQUEST);
    }

    const selectedService = serviceability.availableCouriers[0];

    // 2. Draft Shipment
    const newShipment = await Shipment.create({
      suborderId,
      vendorId,
      courierProvider: providerName,
      courierService: selectedService.name,
      originAddressSnapshot: originAddress.toObject(),
      destinationAddressSnapshot: masterOrder.deliveryAddressSnapshot,
      packageWeight: weight,
      length,
      width,
      height,
      packageCount: packageCount || 1,
      shippingCharge: selectedService.rate,
      status: 'READY'
    });

    // 3. Create Shipment via Provider
    try {
      const courierRes = await provider.createShipment({
        shipmentId: newShipment._id,
        ...packageData
      });

      if (courierRes.success) {
        newShipment.status = 'CREATED';
        newShipment.awbNumber = courierRes.awbNumber;
        newShipment.courierOrderId = courierRes.courierOrderId;
        await newShipment.save();

        // Update Suborder status
        suborder.status = 'SHIPMENT_CREATED';
        await suborder.save();

        return newShipment;
      }
    } catch (error) {
      await ShippingException.create({
        shipmentId: newShipment._id,
        provider: providerName,
        errorMessage: error.message || 'Courier API failed'
      });
      throw new ApiError(500, 'Failed to create shipment with courier', ERROR_CODES.INTERNAL_ERROR);
    }
  },

  async requestPickup(shipmentId, vendorId, pickupDate) {
    const shipment = await Shipment.findOne({ _id: shipmentId, vendorId });
    if (!shipment) throw new ApiError(404, 'Shipment not found', ERROR_CODES.NOT_FOUND);

    if (shipment.status !== 'CREATED') {
      throw new ApiError(400, 'Shipment is not in CREATED state', ERROR_CODES.BAD_REQUEST);
    }

    const provider = providerFactory.getProvider(shipment.courierProvider);
    
    try {
      const res = await provider.requestPickup(shipment.awbNumber, pickupDate);
      if (res.success) {
        shipment.status = 'PICKUP_SCHEDULED';
        shipment.pickupScheduledAt = pickupDate;
        await shipment.save();

        const suborder = await VendorOrder.findById(shipment.suborderId);
        suborder.status = 'PICKUP_SCHEDULED';
        await suborder.save();

        return shipment;
      }
    } catch (error) {
       await ShippingException.create({
        shipmentId: shipment._id,
        provider: shipment.courierProvider,
        errorMessage: error.message || 'Pickup request failed'
      });
      throw new ApiError(500, 'Failed to request pickup', ERROR_CODES.INTERNAL_ERROR);
    }
  },

  async handleWebhook(providerName, payload) {
    // Basic implementation of webhook processing
    const provider = providerFactory.getProvider(providerName);
    const { awbNumber, providerStatus, providerEventId, location, description, eventTime } = payload;
    
    const shipment = await Shipment.findOne({ awbNumber });
    if (!shipment) return; // Unknown shipment

    const internalStatus = provider.mapStatus(providerStatus);

    try {
      await ShipmentTrackingEvent.create({
        shipmentId: shipment._id,
        provider: providerName,
        providerEventId: providerEventId || Date.now().toString(),
        providerStatus,
        internalStatus,
        location,
        description,
        eventTime: eventTime ? new Date(eventTime) : new Date()
      });

      // Update Shipment and Suborder status if progressed
      shipment.status = internalStatus;
      if (internalStatus === 'PICKED_UP' && !shipment.pickedUpAt) shipment.pickedUpAt = new Date();
      if (internalStatus === 'DELIVERED' && !shipment.deliveredAt) shipment.deliveredAt = new Date();
      await shipment.save();

      const suborder = await VendorOrder.findById(shipment.suborderId);
      if (suborder) {
        suborder.status = internalStatus;
        await suborder.save();
        
        // Check Master Order roll-up
        await this.syncMasterOrderStatus(suborder.parentOrderId);
      }
    } catch (e) {
      if (e.code === 11000) {
        // Idempotency: Duplicate event, ignore
        console.log('Duplicate webhook event received for AWB', awbNumber);
      } else {
        console.error('Webhook error:', e);
      }
    }
  },

  async syncMasterOrderStatus(masterOrderId) {
    const suborders = await VendorOrder.find({ parentOrderId: masterOrderId });
    
    const isAllDelivered = suborders.every(so => so.status === 'DELIVERED');
    const isAnyDelivered = suborders.some(so => so.status === 'DELIVERED');
    const isAnyFailed = suborders.some(so => ['DELIVERY_FAILED', 'RETURNED'].includes(so.status));

    let newStatus = 'PROCESSING';
    if (isAllDelivered) {
      newStatus = 'DELIVERED';
    } else if (isAnyDelivered && !isAllDelivered) {
      newStatus = 'PARTIALLY_DELIVERED';
    }

    const masterOrder = await Order.findById(masterOrderId);
    if (masterOrder && masterOrder.orderStatus !== newStatus) {
      masterOrder.orderStatus = newStatus;
      await masterOrder.save();
    }
  }
};
