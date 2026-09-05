import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scholarshipScheme: {
      name: {
        type: String,
        default: 'Merit-cum-Means Post-Matric National Scholarship 2026',
      },
      code: {
        type: String,
        default: 'MCM-2026-GOV',
      },
      awardAmount: {
        type: Number,
        default: 50000,
      },
      academicYear: {
        type: String,
        default: '2025-2026',
      },
    },
    personalDetails: {
      fullName: { type: String, required: true },
      dob: { type: Date, required: true },
      gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'], required: true },
      category: { type: String, enum: ['General', 'OBC', 'SC', 'ST', 'EWS'], default: 'General' },
      aadhaarNumber: { type: String, required: true, index: true },
      mobileNumber: { type: String, required: true },
      email: { type: String, required: true },
      permanentAddress: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    academicDetails: {
      institutionName: { type: String, required: true, index: true },
      course: { type: String, required: true },
      degree: { type: String, required: true },
      currentYear: { type: Number, required: true },
      rollNumber: { type: String, required: true },
      previousPercentage: { type: Number, required: true },
      cgpa: { type: Number, required: true },
      admissionYear: { type: Number, required: true },
    },
    incomeDetails: {
      annualFamilyIncome: { type: Number, required: true, index: true },
      fatherName: { type: String, required: true },
      fatherOccupation: { type: String, required: true },
      motherName: { type: String, required: true },
      incomeCertificateNumber: { type: String, required: true },
      issuingAuthority: { type: String, default: 'Tahsildar / Revenue Department' },
      isBpl: { type: Boolean, default: false },
    },
    bankDetails: {
      accountHolderName: { type: String, required: true },
      bankName: { type: String, required: true },
      accountNumber: { type: String, required: true, index: true },
      ifscCode: { type: String, required: true },
      branchName: { type: String, required: true },
      accountType: { type: String, default: 'Savings' },
    },
    documents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],
    status: {
      type: String,
      enum: [
        'Draft',
        'Submitted',
        'Under Institution Review',
        'Forwarded',
        'Under Authority Review',
        'Approved',
        'Disbursed',
        'Rejected',
        'Resubmission Requested',
      ],
      default: 'Submitted',
      index: true,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedByName: { type: String },
        role: { type: String },
        remarks: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    eligibilityCheck: {
      isEligible: { type: Boolean, default: true },
      incomeEligible: { type: Boolean, default: true },
      academicEligible: { type: Boolean, default: true },
      documentsComplete: { type: Boolean, default: true },
      score: { type: Number, default: 100 },
      reasons: [{ type: String }],
      evaluatedAt: { type: Date, default: Date.now },
    },
    fraudCheck: {
      riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
      hasDuplicateAadhaar: { type: Boolean, default: false },
      hasDuplicateBank: { type: Boolean, default: false },
      hasDuplicateDocumentHash: { type: Boolean, default: false },
      duplicateDetails: [{ type: String }],
      checkedAt: { type: Date, default: Date.now },
    },
    disbursementDetails: {
      transactionId: { type: String },
      amount: { type: Number },
      disbursedAt: { type: Date },
      receiptNumber: { type: String },
      receiptPdfUrl: { type: String },
      utrNumber: { type: String },
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Application', applicationSchema);
