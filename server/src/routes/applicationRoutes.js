import express from 'express';
import {
  submitApplication,
  getMyApplications,
  getAllApplications,
  getApplicationById,
  uploadDocuments,
  resubmitDocuments,
} from '../controllers/applicationController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Document upload endpoint (students and users can upload files)
router.post('/upload', protect, upload.array('files', 5), uploadDocuments);

// Student routes
router.post('/', protect, authorize('student'), submitApplication);
router.get('/my', protect, authorize('student'), getMyApplications);
router.post('/:id/resubmit', protect, authorize('student'), resubmitDocuments);

// All authorized staff can view list (Institution Admin, Authority, Auditor)
router.get('/', protect, authorize('institution_admin', 'scholarship_authority', 'auditor'), getAllApplications);

// Get application by ID (student sees their own, staff sees any)
router.get('/:id', protect, getApplicationById);

export default router;
