export const delhiveryProvider = {
  async getServiceability(originPincode, destinationPincode, weight) {
    // Mock check
    if (!originPincode || !destinationPincode) throw new Error('Missing pincodes');
    return { serviceable: true, availableCouriers: [{ id: 2, name: 'Delhivery Surface', rate: 45 }] };
  },

  async createShipment(shipmentPayload) {
    // Mock response
    return {
      success: true,
      courierOrderId: `DEL-ORD-${Date.now()}`,
      awbNumber: `D-${Math.floor(Math.random() * 1000000000)}`,
      status: 'CREATED'
    };
  },

  async requestPickup(awbNumber, pickupDate) {
    // Mock response
    return {
      success: true,
      pickupToken: `DEL-PT-${Date.now()}`,
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
      'Manifested': 'CREATED',
      'Pending': 'PICKUP_SCHEDULED',
      'Dispatched': 'PICKED_UP',
      'In Transit': 'IN_TRANSIT',
      'Out for Delivery': 'OUT_FOR_DELIVERY',
      'Delivered': 'DELIVERED',
      'RTO': 'RETURN_INITIATED'
    };
    return mapping[providerStatus] || 'IN_TRANSIT';
  }
};
