import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    transactionNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentGateway: {
      type: String,
      default: 'DBT-Direct Benefit Transfer (PFMS Simulator)',
    },
    utrNumber: {
      type: String,
      required: true,
      unique: true,
    },
    recipientAccountMasked: {
      type: String,
      required: true,
    },
    recipientIfsc: {
      type: String,
      required: true,
    },
    recipientBankName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'PROCESSING', 'FAILED'],
      default: 'SUCCESS',
    },
    disbursedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    disbursedByName: {
      type: String,
      required: true,
    },
    disbursedAt: {
      type: Date,
      default: Date.now,
    },
    receiptPdfPath: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Transaction', transactionSchema);
