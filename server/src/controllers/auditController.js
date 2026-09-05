import AuditLog from '../models/AuditLog.js';

// @route   GET /api/audit
// @desc    Get audit trail with search and role/action filtering
export const getAuditLogs = async (req, res, next) => {
  try {
    const { role, action, entityId, search, limit = 50, page = 1 } = req.query;
    const query = {};

    if (role && role !== 'ALL') {
      query.role = role;
    }

    if (action && action !== 'ALL') {
      query.action = action;
    }

    if (entityId) {
      query.entityId = entityId;
    }

    if (search) {
      query.$or = [
        { performedByName: new RegExp(search, 'i') },
        { performedByEmail: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { entityId: new RegExp(search, 'i') },
      ];
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      logs,
    });
  } catch (error) {
    next(error);
  }
};
