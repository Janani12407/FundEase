import Application from '../models/Application.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

// @route   GET /api/analytics/dashboard
// @desc    Get aggregated metrics and charts data for admin, authority & auditor
export const getAnalyticsDashboard = async (req, res, next) => {
  try {
    const totalApplications = await Application.countDocuments();
    const disbursedCount = await Application.countDocuments({ status: 'Disbursed' });
    const approvedCount = await Application.countDocuments({ status: 'Approved' });
    const forwardedCount = await Application.countDocuments({ status: 'Forwarded' });
    const underReviewCount = await Application.countDocuments({
      status: { $in: ['Submitted', 'Under Institution Review', 'Under Authority Review'] },
    });
    const rejectedCount = await Application.countDocuments({ status: 'Rejected' });
    const resubmissionCount = await Application.countDocuments({ status: 'Resubmission Requested' });

    // Total Disbursed Funds
    const transactionAggregate = await Transaction.aggregate([
      { $match: { status: 'SUCCESS' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
    ]);
    const totalDisbursedAmount = transactionAggregate[0]?.totalAmount || 0;

    // Fraud Risk Breakdown
    const lowRiskCount = await Application.countDocuments({ 'fraudCheck.riskLevel': 'LOW' });
    const mediumRiskCount = await Application.countDocuments({ 'fraudCheck.riskLevel': 'MEDIUM' });
    const highRiskCount = await Application.countDocuments({ 'fraudCheck.riskLevel': 'HIGH' });

    // Status Distribution for Charts
    const statusDistribution = [
      { name: 'Under Review', value: underReviewCount, color: '#f59e0b' },
      { name: 'Forwarded', value: forwardedCount, color: '#3b82f6' },
      { name: 'Approved', value: approvedCount, color: '#10b981' },
      { name: 'Disbursed', value: disbursedCount, color: '#059669' },
      { name: 'Rejected', value: rejectedCount, color: '#ef4444' },
      { name: 'Resubmission', value: resubmissionCount, color: '#8b5cf6' },
    ];

    // Risk Breakdown for Charts
    const riskDistribution = [
      { name: 'Verified Clear (Low)', count: lowRiskCount, fill: '#10b981' },
      { name: 'Review Advised (Med)', count: mediumRiskCount, fill: '#f59e0b' },
      { name: 'Duplicate / Flagged (High)', count: highRiskCount, fill: '#ef4444' },
    ];

    // Institution Breakdown
    const institutionStats = await Application.aggregate([
      {
        $group: {
          _id: '$academicDetails.institutionName',
          total: { $sum: 1 },
          disbursed: {
            $sum: { $cond: [{ $eq: ['$status', 'Disbursed'] }, 1, 0] },
          },
          highRisk: {
            $sum: { $cond: [{ $eq: ['$fraudCheck.riskLevel', 'HIGH'] }, 1, 0] },
          },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 6 },
    ]);

    // Format institution data for Recharts
    const institutionBreakdown = institutionStats.map((item) => ({
      name: item._id ? (item._id.length > 20 ? item._id.substring(0, 18) + '...' : item._id) : 'Unknown',
      fullName: item._id,
      Total: item.total,
      Disbursed: item.disbursed,
      Flagged: item.highRisk,
    }));

    // Category Distribution (SC, ST, OBC, EWS, General)
    const categoryStats = await Application.aggregate([
      {
        $group: {
          _id: '$personalDetails.category',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const categoryBreakdown = categoryStats.map((item) => ({
      category: item._id || 'General',
      count: item.count,
    }));

    res.status(200).json({
      success: true,
      metrics: {
        totalApplications,
        disbursedCount,
        approvedCount,
        forwardedCount,
        underReviewCount,
        rejectedCount,
        resubmissionCount,
        totalDisbursedAmount,
        approvalRate: totalApplications > 0 ? Math.round(((disbursedCount + approvedCount) / totalApplications) * 100) : 0,
        highRiskRate: totalApplications > 0 ? Math.round((highRiskCount / totalApplications) * 100) : 0,
      },
      statusDistribution,
      riskDistribution,
      institutionBreakdown,
      categoryBreakdown,
    });
  } catch (error) {
    next(error);
  }
};
