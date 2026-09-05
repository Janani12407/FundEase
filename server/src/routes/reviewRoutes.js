import express from 'express';
import {
  institutionReview,
  authorityReview,
  getApprovalLogs,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// Level 1: Institution Desk Review
router.post('/institution/:id', protect, authorize('institution_admin'), institutionReview);

// Level 2: Scholarship Authority Review
router.post('/authority/:id', protect, authorize('scholarship_authority'), authorityReview);

// Approval timeline logs
router.get('/logs/:applicationId', protect, getApprovalLogs);

export default router;
