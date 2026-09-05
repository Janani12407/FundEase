import Application from '../models/Application.js';
import Document from '../models/Document.js';
import AuditLog from '../models/AuditLog.js';
import { evaluateEligibility } from '../services/eligibilityService.js';
import { runFraudChecks } from '../services/fraudDetectionService.js';
import { calculateFileHash } from '../middleware/upload.js';
import { notifyStatusChange } from '../services/emailService.js';

// Helper to generate sequential application number
const generateApplicationNumber = async () => {
  const count = await Application.countDocuments();
  const year = new Date().getFullYear();
  const pad = String(count + 1001).padStart(5, '0');
  return `SCH-${year}-${pad}`;
};

// @route   POST /api/applications/upload
// @desc    Upload documents before or during application submission
export const uploadDocuments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    const { documentType, applicationId } = req.body;
    const uploadedDocs = [];

    for (const file of req.files) {
      const fileHash = await calculateFileHash(file.path);

      const doc = await Document.create({
        applicationId: applicationId || null,
        documentType: documentType || 'other',
        originalFilename: file.originalname,
        storedFilename: file.filename,
        filepath: `/uploads/${file.filename}`,
        mimeType: file.mimetype,
        size: file.size,
        fileHash,
        verificationStatus: 'pending',
      });

      uploadedDocs.push(doc);
    }

    res.status(201).json({
      success: true,
      message: `${uploadedDocs.length} document(s) uploaded and hash verified.`,
      documents: uploadedDocs,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/applications
// @desc    Submit new scholarship application
export const submitApplication = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const {
      personalDetails,
      academicDetails,
      incomeDetails,
      bankDetails,
      scholarshipScheme,
      documentIds = [],
    } = req.body;

    if (!personalDetails || !academicDetails || !incomeDetails || !bankDetails) {
      return res.status(400).json({
        success: false,
        message: 'Personal, academic, income, and bank details are all mandatory.',
      });
    }

    // Generate Application Number
    const applicationNumber = await generateApplicationNumber();

    // 1. Run Automated Eligibility Rule Engine
    const eligibilityCheck = evaluateEligibility(req.body, documentIds.length);

    // 2. Run Duplicate & Fraud Risk Detection Engine
    const fraudCheck = await runFraudChecks(null, studentId, req.body, documentIds);

    // 3. Create Application
    const application = await Application.create({
      applicationNumber,
      student: studentId,
      scholarshipScheme: scholarshipScheme || {
        name: 'Merit-cum-Means Post-Matric National Scholarship 2026',
        code: 'MCM-2026-GOV',
        awardAmount: 50000,
        academicYear: '2025-2026',
      },
      personalDetails,
      academicDetails,
      incomeDetails,
      bankDetails,
      documents: documentIds,
      status: 'Submitted',
      statusHistory: [
        {
          status: 'Submitted',
          changedBy: studentId,
          changedByName: req.user.name,
          role: 'student',
          remarks: 'Application submitted with verified electronic declaration.',
          timestamp: new Date(),
        },
      ],
      eligibilityCheck,
      fraudCheck,
    });

    // Link uploaded documents to this application
    if (documentIds.length > 0) {
      await Document.updateMany({ _id: { $in: documentIds } }, { applicationId: application._id });
    }

    // 4. Record Immutable Audit Log
    await AuditLog.create({
      action: 'APPLICATION_SUBMITTED',
      performedBy: studentId,
      performedByName: req.user.name,
      performedByEmail: req.user.email,
      role: 'student',
      targetEntity: 'Application',
      entityId: application._id.toString(),
      description: `Scholarship claim ${application.applicationNumber} submitted by ${req.user.name}. Automated Eligibility Score: ${eligibilityCheck.score}/100, Fraud Risk: ${fraudCheck.riskLevel}.`,
      ipAddress: req.ip || '127.0.0.1',
      severity: fraudCheck.riskLevel === 'HIGH' ? 'WARNING' : 'INFO',
    });

    // 5. Trigger notification
    await notifyStatusChange({
      recipientUser: req.user,
      application,
      action: 'SUBMIT',
      newStatus: 'Submitted',
    });

    res.status(201).json({
      success: true,
      message: 'Scholarship application submitted successfully.',
      application,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/applications/my
// @desc    Get all applications submitted by the logged-in student
export const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ student: req.user._id })
      .populate('documents')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/applications
// @desc    Get applications with search, status filters, risk filters (Admin / Authority / Auditor)
export const getAllApplications = async (req, res, next) => {
  try {
    const { status, riskLevel, search, institution } = req.query;
    const query = {};

    // Role-based scoping
    if (req.user.role === 'institution_admin') {
      // Reviewers can see applications from their institution
      if (req.user.institution) {
        query['academicDetails.institutionName'] = new RegExp(req.user.institution, 'i');
      }
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (riskLevel && riskLevel !== 'ALL') {
      query['fraudCheck.riskLevel'] = riskLevel;
    }

    if (institution && institution !== 'ALL') {
      query['academicDetails.institutionName'] = new RegExp(institution, 'i');
    }

    if (search) {
      query.$or = [
        { applicationNumber: new RegExp(search, 'i') },
        { 'personalDetails.fullName': new RegExp(search, 'i') },
        { 'personalDetails.aadhaarNumber': new RegExp(search, 'i') },
        { 'academicDetails.rollNumber': new RegExp(search, 'i') },
      ];
    }

    const applications = await Application.find(query)
      .populate('student', 'name email phone avatar')
      .populate('documents')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/applications/:id
// @desc    Get detailed application by ID
export const getApplicationById = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('student', 'name email phone institution studentRollNumber')
      .populate('documents');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Authorization check: students can only see their own application
    if (req.user.role === 'student' && application.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this application.' });
    }

    res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/applications/:id/resubmit
// @desc    Resubmit updated documents for an application
export const resubmitDocuments = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this application.' });
    }

    const { documentIds = [], note = '' } = req.body;

    if (documentIds.length > 0) {
      application.documents = [...new Set([...application.documents.map((d) => d.toString()), ...documentIds])];
      await Document.updateMany({ _id: { $in: documentIds } }, { applicationId: application._id });
    }

    // Re-evaluate eligibility and fraud checks
    application.status = 'Submitted';
    application.statusHistory.push({
      status: 'Submitted',
      changedBy: req.user._id,
      changedByName: req.user.name,
      role: 'student',
      remarks: `Revised documents resubmitted by student. Note: ${note || 'Updated certificates provided.'}`,
      timestamp: new Date(),
    });

    application.eligibilityCheck = evaluateEligibility(application, application.documents.length);
    application.fraudCheck = await runFraudChecks(application._id, req.user._id, application, application.documents);

    await application.save();

    await AuditLog.create({
      action: 'DOCUMENTS_RESUBMITTED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByEmail: req.user.email,
      role: 'student',
      targetEntity: 'Application',
      entityId: application._id.toString(),
      description: `Student resubmitted updated documents for ${application.applicationNumber}. Application moved back to 'Submitted'.`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(200).json({
      success: true,
      message: 'Documents resubmitted successfully. Application queued for review.',
      application,
    });
  } catch (error) {
    next(error);
  }
};
