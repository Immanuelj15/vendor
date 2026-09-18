import { vendorOnboardingService } from '../services/vendorOnboardingService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

export const registerVendor = asyncWrapper(async (req, res) => {
  const result = await vendorOnboardingService.register(req.body);
  return res.status(201).json(new ApiResponse(201, result, 'Vendor application submitted successfully. Please wait for Admin approval.'));
});

export const getOnboardingStatus = asyncWrapper(async (req, res) => {
  const result = await vendorOnboardingService.getStatus(req.user._id);
  return res.status(200).json(new ApiResponse(200, result, 'Vendor status retrieved'));
});

export const submitBusinessInfo = asyncWrapper(async (req, res) => {
  const result = await vendorOnboardingService.submitBusiness(req.user._id, req.body);
  return res.status(200).json(new ApiResponse(200, result, 'Business info saved'));
});

export const submitLocationInfo = asyncWrapper(async (req, res) => {
  const result = await vendorOnboardingService.submitLocation(req.user._id, req.body);
  return res.status(200).json(new ApiResponse(200, result, 'Location info saved'));
});

export const submitKycInfo = asyncWrapper(async (req, res) => {
  const result = await vendorOnboardingService.submitKyc(req.user._id, req.body);
  return res.status(200).json(new ApiResponse(200, result, 'KYC info saved'));
});

export const submitBankInfo = asyncWrapper(async (req, res) => {
  const result = await vendorOnboardingService.submitBank(req.user._id, req.body);
  return res.status(200).json(new ApiResponse(200, result, 'Bank info saved'));
});

export const submitFinalOnboarding = asyncWrapper(async (req, res) => {
  const result = await vendorOnboardingService.submitFinal(req.user._id, req.body);
  return res.status(200).json(new ApiResponse(200, result, 'Vendor onboarding submitted'));
});

export const resubmitVendor = asyncWrapper(async (req, res) => {
  const result = await vendorOnboardingService.resubmit(req.user._id, req.body);
  return res.status(200).json(new ApiResponse(200, result, 'Vendor resubmitted for review'));
});
