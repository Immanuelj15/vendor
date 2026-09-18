import { reconciliationService } from '../services/reconciliationService.js';
import { parseDateRange } from './adminController.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

export const runPaymentReconciliation = asyncWrapper(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);

  const report = await reconciliationService.reconcilePayments(startDate, endDate);

  return res.status(200).json(new ApiResponse(200, { report }, 'Payment reconciliation completed'));
});
