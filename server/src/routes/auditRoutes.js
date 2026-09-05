import express from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// Audit log view (Auditor, Authority, and Institution Admin)
router.get('/', protect, authorize('auditor', 'scholarship_authority', 'institution_admin'), getAuditLogs);

export default router;
