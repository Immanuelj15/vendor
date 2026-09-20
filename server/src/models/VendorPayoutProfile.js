import { VendorBankAccount } from './VendorBankAccount.js';

/**
 * VendorPayoutProfile is the canonical model reference for Vendor bank and payout information.
 * Encrypts account numbers at rest and masks sensitive numbers in all normal API responses.
 */
export const VendorPayoutProfile = VendorBankAccount;
export default VendorPayoutProfile;
