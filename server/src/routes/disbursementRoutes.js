import express from 'express';
import {
  triggerDisbursement,
  downloadReceipt,
  getAllTransactions,
} from '../controllers/disbursementController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// View transaction ledger (Authority and Auditor) — MUST be declared BEFORE /:id wildcard routes (H3)
router.get('/transactions', protect, authorize('scholarship_authority', 'auditor'), getAllTransactions);

// Download PDF disbursement receipt (also before /:id to avoid wildcard match)
router.get('/receipt/:applicationId', protect, downloadReceipt);

// Final approval & disbursement trigger (Scholarship Authority only)
router.post('/:id', protect, authorize('scholarship_authority'), triggerDisbursement);

export default router;
