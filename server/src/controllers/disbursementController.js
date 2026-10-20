import Application from '../models/Application.js';
import Transaction from '../models/Transaction.js';
import ApprovalLog from '../models/ApprovalLog.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { generateDisbursementReceipt } from '../services/pdfReceiptService.js';
import { notifyStatusChange } from '../services/emailService.js';
import path from 'path';
import fs from 'fs';

// @route   POST /api/disbursement/:id
// @desc    Trigger simulated Direct Benefit Transfer (DBT) and generate PDF voucher
export const triggerDisbursement = async (req, res, next) => {
  try {
    const applicationId = req.params.id;

    // C2: Atomic claim — only one disbursement proceeds even under concurrent requests.
    // We attempt to atomically transition the application from Approved to Disbursed.
    // If another request already changed the status this findOneAndUpdate will return null.
    // For Forwarded applications we first auto-advance through the full state machine (M6).
    let application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.status === 'Disbursed') {
      return res.status(400).json({ success: false, message: 'Funds have already been disbursed for this application.' });
    }

    // C1: Only Approved (or Forwarded — see M6 auto-advance below) may be disbursed.
    if (application.status !== 'Approved' && application.status !== 'Forwarded') {
      return res.status(400).json({
        success: false,
        message: `Cannot disburse funds for application in status '${application.status}'. Application must be 'Approved'.`,
      });
    }

    // M6: Auto-advance Forwarded → Under Authority Review → Approved to satisfy the
    //     full spec state machine while keeping the UI "Approve & Disburse" UX.
    if (application.status === 'Forwarded') {
      application.status = 'Under Authority Review';
      application.statusHistory.push({
        status: 'Under Authority Review',
        changedBy: req.user._id,
        changedByName: req.user.name,
        role: req.user.role,
        remarks: 'Authority review commenced. Auto-advancing to sanction.',
        timestamp: new Date(),
      });
      await ApprovalLog.create({
        applicationId: application._id,
        reviewerId: req.user._id,
        reviewerName: req.user.name,
        reviewerRole: 'scholarship_authority',
        action: 'REVIEW_STARTED',
        previousStatus: 'Forwarded',
        newStatus: 'Under Authority Review',
        remarks: 'Authority review auto-started during disbursement.',
      });

      application.status = 'Approved';
      application.statusHistory.push({
        status: 'Approved',
        changedBy: req.user._id,
        changedByName: req.user.name,
        role: req.user.role,
        remarks: 'Final scholarship sanction approved by State Authority.',
        timestamp: new Date(),
      });
      await ApprovalLog.create({
        applicationId: application._id,
        reviewerId: req.user._id,
        reviewerName: req.user.name,
        reviewerRole: 'scholarship_authority',
        action: 'APPROVED',
        previousStatus: 'Under Authority Review',
        newStatus: 'Approved',
        remarks: 'Application approved by Scholarship Authority.',
      });
      await application.save();
    }

    // C2: Atomic status-claim — prevents race-condition double-disburse.
    const claimed = await Application.findOneAndUpdate(
      { _id: applicationId, status: 'Approved', isLocked: { $ne: true } },
      { $set: { status: 'Disbursed', isLocked: true } },
      { new: false }
    );
    if (!claimed) {
      return res.status(400).json({ success: false, message: 'Disbursement already in progress or completed by another request.' });
    }

    const awardAmount = application.scholarshipScheme?.awardAmount || 50000;
    const rawAccount = application.bankDetails?.accountNumber || '000000000000';
    const recipientAccountMasked = rawAccount.length > 4
      ? `XXXX-XXXX-${rawAccount.slice(-4)}`
      : 'XXXX-XXXX-9999';

    const timestamp = Date.now();
    const transactionNumber = `TXN-DBT-${timestamp.toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const utrNumber = `UTR-SBIN-${timestamp}-${Math.floor(100 + Math.random() * 900)}`;

    // Create Transaction Record
    const transaction = await Transaction.create({
      transactionNumber,
      applicationId: application._id,
      studentId: application.student,
      studentName: application.personalDetails?.fullName || 'Student',
      amount: awardAmount,
      paymentGateway: 'DBT-Direct Benefit Transfer (PFMS Simulator)',
      utrNumber,
      recipientAccountMasked,
      recipientIfsc: application.bankDetails?.ifscCode || 'SBIN0001234',
      recipientBankName: application.bankDetails?.bankName || 'State Bank of India',
      status: 'SUCCESS',
      disbursedBy: req.user._id,
      disbursedByName: req.user.name,
      disbursedAt: new Date(),
    });

    // M3: Generate Tamper-evident PDF Voucher with graceful fallback
    let receiptDownloadUrl = null;
    try {
      const receiptResult = await generateDisbursementReceipt(application, transaction);
      receiptDownloadUrl = receiptResult.downloadUrl;
      transaction.receiptPdfPath = receiptDownloadUrl;
      await transaction.save();
    } catch (pdfErr) {
      console.error('PDF voucher generation warning (transaction preserved):', pdfErr.message);
    }

    // Lock application & update status to 'Disbursed'
    const previousStatus = application.status;
    application.status = 'Disbursed';
    application.isLocked = true;
    application.disbursementDetails = {
      transactionId: transaction._id.toString(),
      amount: awardAmount,
      disbursedAt: new Date(),
      receiptNumber: transactionNumber,
      receiptPdfUrl: receiptDownloadUrl,
      utrNumber,
    };

    application.statusHistory.push({
      status: 'Disbursed',
      changedBy: req.user._id,
      changedByName: req.user.name,
      role: req.user.role,
      remarks: `Direct Benefit Transfer of ₹${awardAmount.toLocaleString('en-IN')} completed. UTR: ${utrNumber}. Receipt generated.`,
      timestamp: new Date(),
    });

    await application.save();

    // Log Approval & Audit
    await ApprovalLog.create({
      applicationId: application._id,
      reviewerId: req.user._id,
      reviewerName: req.user.name,
      reviewerRole: 'scholarship_authority',
      action: 'DISBURSED',
      previousStatus,
      newStatus: 'Disbursed',
      remarks: `Fund disbursement settled via DBT. Voucher: ${transactionNumber}`,
    });

    await AuditLog.create({
      action: 'FUNDS_DISBURSED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByEmail: req.user.email,
      role: req.user.role,
      targetEntity: 'Transaction',
      entityId: transaction._id.toString(),
      description: `Electronic disbursement of ₹${awardAmount.toLocaleString('en-IN')} executed for application ${application.applicationNumber} to account ${recipientAccountMasked}. Record locked.`,
      newValues: { transactionNumber, amount: awardAmount, utrNumber },
      ipAddress: req.ip || '127.0.0.1',
      severity: 'INFO',
    });

    // Notify Student
    const studentUser = await User.findById(application.student);
    if (studentUser) {
      await notifyStatusChange({
        recipientUser: studentUser,
        application,
        action: 'DISBURSED',
        newStatus: 'Disbursed',
        remarks: `Disbursed ₹${awardAmount.toLocaleString('en-IN')} (UTR: ${utrNumber})`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Direct Benefit Transfer completed successfully. Voucher issued.',
      transaction,
      receiptUrl: receiptDownloadUrl,
      application,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/disbursement/receipt/:applicationId
// @desc    Download generated PDF disbursement voucher
export const downloadReceipt = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Check authorization: student owner or staff
    if (req.user.role === 'student' && application.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to download this receipt.' });
    }

    const transaction = await Transaction.findOne({ applicationId: application._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'No disbursement transaction found for this application.' });
    }

    // H6: Sanitize filename to prevent path-traversal via malformed transactionNumber.
    const safeFileName = path.basename(`Voucher_${transaction.transactionNumber}.pdf`);
    const filePath = path.join(process.cwd(), 'uploads', 'receipts', safeFileName);

    if (!fs.existsSync(filePath)) {
      // Regenerate if missing on disk
      await generateDisbursementReceipt(application, transaction);
    }

    res.download(filePath, safeFileName, (err) => {
      if (err) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/disbursement/transactions
// @desc    Get all transactions (Authority / Auditor)
export const getAllTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find()
      .populate('applicationId', 'applicationNumber personalDetails academicDetails scholarshipScheme')
      .populate('studentId', 'name email')
      .sort({ disbursedAt: -1 });

    const totalDisbursed = transactions.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    res.status(200).json({
      success: true,
      count: transactions.length,
      totalDisbursed,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};
