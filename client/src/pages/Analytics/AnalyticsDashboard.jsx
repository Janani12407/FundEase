import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Building,
  CheckCircle,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

export const AnalyticsDashboard = () => {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/analytics/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (result.success) {
          setData(result);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token]);

  if (loading || !data) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading comprehensive platform analytics...
      </div>
    );
  }

  const { metrics, statusDistribution, riskDistribution, institutionBreakdown, categoryBreakdown } = data;

  const STATUS_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#059669', '#ef4444', '#8b5cf6'];

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', marginBottom: '4px' }}>
              <BarChart3 size={20} />
              <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>
                System Performance & Fraud Intelligence
              </span>
            </div>
            <h1 className="page-title">Executive Analytics Dashboard</h1>
            <p className="page-subtitle">
              Real-time visualization of multi-institution application pipeline velocity, funds disbursement volume, and automated fraud prevention.
            </p>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <FileCheck size={24} />
            </div>
            <div>
              <div className="kpi-value">{metrics.totalApplications}</div>
              <div className="kpi-label">Total Claims Registered</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <div className="kpi-value">₹{metrics.totalDisbursedAmount.toLocaleString('en-IN')}</div>
              <div className="kpi-label">Total DBT Funds Settled</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="kpi-value">{metrics.approvalRate}%</div>
              <div className="kpi-label">Sanction & Settlement Rate</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: '#fff1f2', color: '#e11d48' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="kpi-value">{metrics.highRiskRate}%</div>
              <div className="kpi-label">Fraud Interception Rate</div>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid-cols-2" style={{ gap: '24px', marginBottom: '24px' }}>
          {/* Chart 1: Pipeline Status */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px', color: '#0f294a' }}>
              Scholarship Application Lifecycle Distribution
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
              Real-time status volume across all verification tiers
            </p>

            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`${val} Applications`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Fraud & Integrity Risk Breakdown */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px', color: '#0f294a' }}>
              Automated Integrity & Fraud Risk Classification
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
              Rule-based evaluation: Verified Clear vs Review Advised vs Duplicate Flagged
            </p>

            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-risk-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid-cols-2" style={{ gap: '24px' }}>
          {/* Chart 3: College/Institution Comparison */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px', color: '#0f294a' }}>
              Institution-Wise Application & Disbursement Throughput
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
              Comparison of total claims vs disbursed funds vs duplicate flags
            </p>

            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={institutionBreakdown} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Disbursed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Flagged" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Beneficiary Social Category Distribution */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px', color: '#0f294a' }}>
              Beneficiary Social Category Distribution
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
              Demographic representation (SC, ST, OBC, EWS, General)
            </p>

            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBreakdown} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
