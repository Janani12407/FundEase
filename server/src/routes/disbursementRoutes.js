import express from 'express';
import {
  triggerDisbursement,
  downloadReceipt,
  getAllTransactions,
} from '../controllers/disbursementController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// Final approval & disbursement trigger (Scholarship Authority only)
router.post('/:id', protect, authorize('scholarship_authority'), triggerDisbursement);

// Download PDF disbursement receipt
router.get('/receipt/:applicationId', protect, downloadReceipt);

// View transaction ledger (Authority and Auditor)
router.get('/transactions', protect, authorize('scholarship_authority', 'auditor'), getAllTransactions);

export default router;
