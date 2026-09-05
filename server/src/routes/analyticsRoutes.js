import express from 'express';
import { getAnalyticsDashboard } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.get('/dashboard', protect, authorize('institution_admin', 'scholarship_authority', 'auditor'), getAnalyticsDashboard);

export default router;
