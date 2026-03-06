/**
 * ===========================================
 * Audit Log Model
 * ===========================================
 *
 * Records every write action performed through
 * admin endpoints for accountability and forensics.
 *
 * Fields:
 *  - admin        : ObjectId ref → User (who)
 *  - action       : string enum   (what)
 *  - targetModel  : string        (which collection)
 *  - targetId     : ObjectId      (which document)
 *  - details      : Mixed         (before/after, extra info)
 *  - ip           : string        (request IP)
 */

import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'create_film',
        'update_film',
        'delete_film',
        'update_user_role',
        'delete_user',
        'update_investment_status',
        'admin_login',
        'admin_reauth',
      ],
      index: true,
    },
    targetModel: {
      type: String,
      enum: ['Film', 'User', 'Investment', 'Session'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    ip: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-expire after 90 days to limit storage growth
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
