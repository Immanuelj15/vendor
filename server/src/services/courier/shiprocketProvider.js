export const shiprocketProvider = {
  async getServiceability(originPincode, destinationPincode, weight) {
    // Mock check
    if (!originPincode || !destinationPincode) throw new Error('Missing pincodes');
    return { serviceable: true, availableCouriers: [{ id: 1, name: 'Shiprocket Standard', rate: 50 }] };
  },

  async createShipment(shipmentPayload) {
    // Mock response
    return {
      success: true,
      courierOrderId: `SR-ORD-${Date.now()}`,
      awbNumber: `AWB-${Math.floor(Math.random() * 1000000000)}`,
      status: 'CREATED'
    };
  },

  async requestPickup(awbNumber, pickupDate) {
    // Mock response
    return {
      success: true,
      pickupToken: `PT-${Date.now()}`,
      status: 'PICKUP_SCHEDULED'
    };
  },

  async trackShipment(awbNumber) {
    // Mock response
    return {
      currentStatus: 'IN_TRANSIT',
      events: [
        { status: 'PICKED_UP', location: 'Origin Hub', time: new Date(Date.now() - 86400000) },
        { status: 'IN_TRANSIT', location: 'Transit Hub', time: new Date() }
      ]
    };
  },

  mapStatus(providerStatus) {
    const mapping = {
      'NEW': 'CREATED',
      'PICKUP_SCHEDULED': 'PICKUP_SCHEDULED',
      'PICKED_UP': 'PICKED_UP',
      'IN_TRANSIT': 'IN_TRANSIT',
      'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
      'DELIVERED': 'DELIVERED',
      'RTO_INITIATED': 'RETURN_INITIATED',
      'RTO_DELIVERED': 'RETURNED'
    };
    return mapping[providerStatus] || 'IN_TRANSIT';
  }
};
