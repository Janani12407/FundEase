import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      index: true,
    },
    documentType: {
      type: String,
      required: true,
      enum: [
        'income_certificate',
        'marksheet',
        'bank_passbook',
        'id_proof',
        'caste_certificate',
        'other',
      ],
    },
    originalFilename: {
      type: String,
      required: true,
    },
    storedFilename: {
      type: String,
      required: true,
    },
    filepath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    fileHash: {
      type: String,
      required: true,
      index: true, // Used for duplicate document hash detection
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'flagged', 'rejected'],
      default: 'pending',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Document', documentSchema);
