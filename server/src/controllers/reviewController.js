import Application from '../models/Application.js';
import ApprovalLog from '../models/ApprovalLog.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { notifyStatusChange } from '../services/emailService.js';

// @route   POST /api/reviews/institution/:id
// @desc    Institution Admin review action (FORWARD, REJECT, REQUEST_RESUBMISSION, REVIEW_STARTED)
export const institutionReview = async (req, res, next) => {
  try {
    const { action, remarks } = req.body;
    const applicationId = req.params.id;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.isLocked) {
      return res.status(400).json({ success: false, message: 'This application is locked and cannot be modified.' });
    }

    let newStatus = application.status;
    let logAction = '';

    if (action === 'START_REVIEW') {
      newStatus = 'Under Institution Review';
      logAction = 'REVIEW_STARTED';
    } else if (action === 'FORWARD') {
      newStatus = 'Forwarded';
      logAction = 'FORWARDED';
    } else if (action === 'REJECT') {
      if (!remarks || remarks.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: 'A mandatory and clear reason (min 5 chars) is required to reject an application.',
        });
      }
      newStatus = 'Rejected';
      logAction = 'REJECTED';
    } else if (action === 'REQUEST_RESUBMISSION') {
      if (!remarks || remarks.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Please specify which documents or fields need resubmission.',
        });
      }
      newStatus = 'Resubmission Requested';
      logAction = 'RESUBMISSION_REQUESTED';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid review action specified.' });
    }

    const previousStatus = application.status;
    application.status = newStatus;
    application.statusHistory.push({
      status: newStatus,
      changedBy: req.user._id,
      changedByName: req.user.name,
      role: req.user.role,
      remarks: remarks || `Action ${action} executed by Institution Desk.`,
      timestamp: new Date(),
    });

    await application.save();

    // Create ApprovalLog
    await ApprovalLog.create({
      applicationId: application._id,
      reviewerId: req.user._id,
      reviewerName: req.user.name,
      reviewerRole: 'institution_admin',
      action: logAction,
      previousStatus,
      newStatus,
      remarks: remarks || '',
      metadata: {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || '',
      },
    });

    // Record Immutable Audit Log
    await AuditLog.create({
      action: `INSTITUTION_${logAction}`,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByEmail: req.user.email,
      role: req.user.role,
      targetEntity: 'Application',
      entityId: application._id.toString(),
      description: `Institution admin ${req.user.name} changed status of ${application.applicationNumber} from '${previousStatus}' to '${newStatus}'. Remarks: ${remarks || 'None'}`,
      previousValues: { status: previousStatus },
      newValues: { status: newStatus },
      ipAddress: req.ip || '127.0.0.1',
      severity: action === 'REJECT' ? 'WARNING' : 'INFO',
    });

    // Notify Student
    const studentUser = await User.findById(application.student);
    if (studentUser) {
      await notifyStatusChange({
        recipientUser: studentUser,
        application,
        action: logAction,
        newStatus,
        remarks,
      });
    }

    res.status(200).json({
      success: true,
      message: `Application status updated to '${newStatus}'.`,
      application,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/reviews/authority/:id
// @desc    Scholarship Authority review action (APPROVE, REJECT, START_REVIEW)
export const authorityReview = async (req, res, next) => {
  try {
    const { action, remarks } = req.body;
    const applicationId = req.params.id;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.isLocked) {
      return res.status(400).json({ success: false, message: 'This application is locked and cannot be modified.' });
    }

    let newStatus = application.status;
    let logAction = '';

    if (action === 'START_REVIEW') {
      newStatus = 'Under Authority Review';
      logAction = 'REVIEW_STARTED';
    } else if (action === 'APPROVE') {
      newStatus = 'Approved';
      logAction = 'APPROVED';
    } else if (action === 'REJECT') {
      if (!remarks || remarks.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: 'A mandatory and clear reason (min 5 chars) is required to reject an application.',
        });
      }
      newStatus = 'Rejected';
      logAction = 'REJECTED';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid authority review action specified.' });
    }

    const previousStatus = application.status;
    application.status = newStatus;
    application.statusHistory.push({
      status: newStatus,
      changedBy: req.user._id,
      changedByName: req.user.name,
      role: req.user.role,
      remarks: remarks || `Final sanction action ${action} executed by Scholarship Authority.`,
      timestamp: new Date(),
    });

    await application.save();

    // Create ApprovalLog
    await ApprovalLog.create({
      applicationId: application._id,
      reviewerId: req.user._id,
      reviewerName: req.user.name,
      reviewerRole: 'scholarship_authority',
      action: logAction,
      previousStatus,
      newStatus,
      remarks: remarks || '',
      metadata: {
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || '',
      },
    });

    // Record Immutable Audit Log
    await AuditLog.create({
      action: `AUTHORITY_${logAction}`,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByEmail: req.user.email,
      role: req.user.role,
      targetEntity: 'Application',
      entityId: application._id.toString(),
      description: `Scholarship Authority ${req.user.name} updated ${application.applicationNumber} to '${newStatus}'. Remarks: ${remarks || 'None'}`,
      previousValues: { status: previousStatus },
      newValues: { status: newStatus },
      ipAddress: req.ip || '127.0.0.1',
      severity: action === 'REJECT' ? 'WARNING' : 'INFO',
    });

    // Notify Student
    const studentUser = await User.findById(application.student);
    if (studentUser) {
      await notifyStatusChange({
        recipientUser: studentUser,
        application,
        action: logAction,
        newStatus,
        remarks,
      });
    }

    res.status(200).json({
      success: true,
      message: `Application sanction status updated to '${newStatus}'.`,
      application,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/reviews/logs/:applicationId
// @desc    Get complete multi-level approval history for an application
export const getApprovalLogs = async (req, res, next) => {
  try {
    const logs = await ApprovalLog.find({ applicationId: req.params.applicationId })
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    next(error);
  }
};
