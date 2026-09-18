import { shiprocketProvider } from './shiprocketProvider.js';
import { delhiveryProvider } from './delhiveryProvider.js';

export const providerFactory = {
  getProvider(providerName) {
    switch (providerName?.toUpperCase()) {
      case 'SHIPROCKET':
        return shiprocketProvider;
      case 'DELHIVERY':
        return delhiveryProvider;
      default:
        // Default to Shiprocket for now
        return shiprocketProvider;
    }
  }
};
