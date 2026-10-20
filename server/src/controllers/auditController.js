import AuditLog from '../models/AuditLog.js';

// @route   GET /api/audit
// @desc    Get audit trail with search and role/action filtering
export const getAuditLogs = async (req, res, next) => {
  try {
    const { role, action, entityId, search, limit = 50, page = 1 } = req.query;
    // M10: Cast to numbers immediately so .skip() and .limit() receive integers, not strings.
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(200, Math.max(1, Number(limit) || 50));
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
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      logs,
    });
  } catch (error) {
    next(error);
  }
};
