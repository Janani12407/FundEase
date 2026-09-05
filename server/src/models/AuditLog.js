import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    performedByName: {
      type: String,
      required: true,
    },
    performedByEmail: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      index: true,
    },
    targetEntity: {
      type: String,
      enum: ['Application', 'User', 'Document', 'Transaction', 'Review'],
      default: 'Application',
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    previousValues: {
      type: mongoose.Schema.Types.Mixed,
    },
    newValues: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'CRITICAL'],
      default: 'INFO',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable: no updates allowed
  }
);

export default mongoose.model('AuditLog', auditLogSchema);
