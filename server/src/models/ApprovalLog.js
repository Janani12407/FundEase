import mongoose from 'mongoose';

const approvalLogSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewerName: {
      type: String,
      required: true,
    },
    reviewerRole: {
      type: String,
      required: true,
      enum: ['institution_admin', 'scholarship_authority', 'auditor'],
    },
    action: {
      type: String,
      required: true,
      enum: ['REVIEW_STARTED', 'FORWARDED', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUESTED', 'DISBURSED'],
    },
    previousStatus: {
      type: String,
      required: true,
    },
    newStatus: {
      type: String,
      required: true,
    },
    remarks: {
      type: String,
      default: '',
    },
    metadata: {
      ipAddress: { type: String, default: '127.0.0.1' },
      userAgent: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('ApprovalLog', approvalLogSchema);
