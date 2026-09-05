import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import ReceiptModal from '../../components/ReceiptModal';
import {
  FilePlus,
  ArrowRight,
  Download,
  AlertCircle,
  FileCheck2,
  Calendar,
  Building,
  CheckCircle,
  Clock,
  Landmark,
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user, token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppForReceipt, setSelectedAppForReceipt] = useState(null);

  const fetchMyApplications = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/applications/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error('Failed to load student applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyApplications();
  }, [token]);

  // Derived metrics
  const totalApplied = applications.length;
  const disbursedApp = applications.find((a) => a.status === 'Disbursed');
  const disbursedAmount = applications
    .filter((a) => a.status === 'Disbursed')
    .reduce((acc, curr) => acc + (curr.scholarshipScheme?.awardAmount || 50000), 0);
  const pendingActionApp = applications.find((a) => a.status === 'Resubmission Requested');

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container">
        {/* Welcome Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Welcome back, {user?.name}</h1>
            <p className="page-subtitle">
              {user?.institution} • Roll No: {user?.studentRollNumber || 'Enrolled Student'}
            </p>
          </div>
          <div>
            <Link to="/student/apply" className="btn btn-primary">
              <FilePlus size={16} /> Apply for New Scholarship
            </Link>
          </div>
        </div>

        {/* Action Callout if Resubmission is Pending */}
        {pendingActionApp && (
          <div
            style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertCircle size={24} color="#d97706" />
              <div>
                <strong style={{ color: '#92400e', fontSize: '14px', display: 'block' }}>
                  Action Required on Application {pendingActionApp.applicationNumber}
                </strong>
                <span style={{ fontSize: '13px', color: '#b45309' }}>
                  The reviewing desk requested an updated document. Please upload the required file to avoid delays.
                </span>
              </div>
            </div>
            <Link
              to={`/student/application/${pendingActionApp._id}`}
              className="btn btn-sm btn-primary"
              style={{ backgroundColor: '#d97706' }}
            >
              Upload Revised Document <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid-cols-3" style={{ marginBottom: '32px' }}>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <FileCheck2 size={24} />
            </div>
            <div>
              <div className="kpi-value">{totalApplied}</div>
              <div className="kpi-label">Active Applications</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
              <Landmark size={24} />
            </div>
            <div>
              <div className="kpi-value">₹{disbursedAmount.toLocaleString('en-IN')}</div>
              <div className="kpi-label">Funds Disbursed (DBT)</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
              <Clock size={24} />
            </div>
            <div>
              <div className="kpi-value">
                {applications.filter((a) => !['Disbursed', 'Rejected'].includes(a.status)).length}
              </div>
              <div className="kpi-label">In Verification Pipeline</div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f294a' }}>
            My Scholarship Claims
          </h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing {applications.length} record(s)
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            Loading your applications...
          </div>
        ) : applications.length === 0 ? (
          <div
            className="card"
            style={{ textAlign: 'center', padding: '60px 20px' }}
          >
            <FilePlus size={48} color="#94a3b8" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '18px', color: '#0f294a', marginBottom: '6px' }}>
              No applications submitted yet
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '440px', margin: '0 auto 20px auto' }}>
              You have not submitted any scholarship application for the current academic year. Submit your paperless application in 5 minutes!
            </p>
            <Link to="/student/apply" className="btn btn-primary">
              Start Scholarship Application <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {applications.map((app) => (
              <div key={app._id} className="card" style={{ padding: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary-900)' }}>
                      {app.applicationNumber}
                    </span>
                    <StatusBadge status={app.status} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {app.status === 'Disbursed' && (
                      <button
                        onClick={() => setSelectedAppForReceipt(app)}
                        className="btn btn-sm btn-success"
                      >
                        <Download size={14} /> Download Voucher
                      </button>
                    )}
                    <Link
                      to={`/student/application/${app._id}`}
                      className="btn btn-sm btn-secondary"
                    >
                      View Live Tracker <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                {/* Info Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    fontSize: '13px',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>
                      Scheme
                    </span>
                    <strong style={{ color: 'var(--slate-800)' }}>{app.scholarshipScheme?.name}</strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>
                      Sanction Amount
                    </span>
                    <strong style={{ color: '#059669', fontSize: '15px' }}>
                      ₹{(app.scholarshipScheme?.awardAmount || 50000).toLocaleString('en-IN')}/-
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>
                      College / Roll No
                    </span>
                    <span style={{ color: 'var(--slate-800)' }}>
                      {app.academicDetails?.rollNumber} • {app.academicDetails?.course}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>
                      Submitted On
                    </span>
                    <span style={{ color: 'var(--slate-800)' }}>
                      {new Date(app.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedAppForReceipt && (
        <ReceiptModal
          application={selectedAppForReceipt}
          onClose={() => setSelectedAppForReceipt(null)}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
