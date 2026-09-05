import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import FraudRiskWidget from '../../components/FraudRiskWidget';
import DocumentViewerModal from '../../components/DocumentViewerModal';
import {
  Building,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileText,
  X,
  Send,
  RotateCcw,
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Review Modal State
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewAction, setReviewAction] = useState('FORWARD'); // FORWARD, REJECT, REQUEST_RESUBMISSION
  const [remarks, setRemarks] = useState('');
  const [processingReview, setProcessingReview] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  const fetchApplications = async () => {
    try {
      let url = `http://localhost:5000/api/applications?`;
      if (statusFilter !== 'ALL') url += `&status=${encodeURIComponent(statusFilter)}`;
      if (riskFilter !== 'ALL') url += `&riskLevel=${riskFilter}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [token, statusFilter, riskFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleOpenReview = (app) => {
    setSelectedApp(app);
    setReviewAction('FORWARD');
    setRemarks('');
  };

  const handleReviewDecision = async (e) => {
    e.preventDefault();
    if (['REJECT', 'REQUEST_RESUBMISSION'].includes(reviewAction) && (!remarks || remarks.trim().length < 5)) {
      alert('A mandatory and clear reason (minimum 5 characters) is required for rejections or resubmissions.');
      return;
    }

    setProcessingReview(true);
    try {
      const res = await fetch(`http://localhost:5000/api/reviews/institution/${selectedApp._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: reviewAction,
          remarks: remarks || (reviewAction === 'FORWARD' ? 'Institution level verification passed. Documents endorsed.' : ''),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Review action failed.');
      }

      alert(`Application ${selectedApp.applicationNumber} updated to '${data.application.status}'.`);
      setSelectedApp(null);
      fetchApplications();
    } catch (err) {
      alert(err.message || 'Error processing review decision.');
    } finally {
      setProcessingReview(false);
    }
  };

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container">
        {/* Page Title & Desk Info */}
        <div className="page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber-600)', marginBottom: '4px' }}>
              <Building size={20} />
              <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>
                Institution Verification Desk
              </span>
            </div>
            <h1 className="page-title">{user?.institution || 'College Admin Portal'}</h1>
            <p className="page-subtitle">
              Review student applications, verify academic & income eligibility, inspect duplicate flags, and forward to State Authority.
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div
          className="card"
          style={{
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '280px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by student name, roll no, application no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
              <Search
                size={16}
                color="#64748b"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">
              Search
            </button>
          </form>

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Status:</span>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12.5px', width: 'auto' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="Submitted">Submitted (New)</option>
                <option value="Under Institution Review">Under Review</option>
                <option value="Forwarded">Forwarded to State</option>
                <option value="Approved">Approved</option>
                <option value="Disbursed">Disbursed</option>
                <option value="Rejected">Rejected</option>
                <option value="Resubmission Requested">Resubmission</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Integrity Risk:</span>
              <select
                className="form-select"
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12.5px', width: 'auto' }}
              >
                <option value="ALL">All Risks</option>
                <option value="LOW">Clear (Low Risk)</option>
                <option value="MEDIUM">Review Advised</option>
                <option value="HIGH">High Risk / Duplicate</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications Data Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>App Number</th>
                <th>Student & Roll No</th>
                <th>Course & CGPA</th>
                <th>Annual Income</th>
                <th>Fraud / Duplicate Check</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Loading institutional application queue...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No scholarship claims found matching current filters.
                  </td>
                </tr>
              ) : (
                applications.map((app) => {
                  const risk = app.fraudCheck?.riskLevel || 'LOW';
                  return (
                    <tr key={app._id}>
                      <td>
                        <strong style={{ color: '#0f294a' }}>{app.applicationNumber}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {new Date(app.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          {app.personalDetails?.fullName}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                          Roll: {app.academicDetails?.rollNumber}
                        </div>
                      </td>

                      <td>
                        <div style={{ color: '#334155' }}>{app.academicDetails?.course}</div>
                        <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: '700' }}>
                          CGPA: {app.academicDetails?.cgpa} / 10.0
                        </div>
                      </td>

                      <td>
                        <strong style={{ color: '#0f294a' }}>
                          ₹{Number(app.incomeDetails?.annualFamilyIncome || 0).toLocaleString('en-IN')}
                        </strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Cat: {app.personalDetails?.category}
                        </div>
                      </td>

                      <td>
                        <span className={`risk-badge risk-${risk.toLowerCase()}`}>
                          {risk === 'HIGH' ? 'Duplicate Flagged' : risk === 'MEDIUM' ? 'Review Advised' : 'Clear'}
                        </span>
                      </td>

                      <td>
                        <StatusBadge status={app.status} />
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenReview(app)}
                          className="btn btn-sm btn-primary"
                        >
                          <Eye size={13} /> Review & Verify
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '900px' }}
          >
            {/* Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building size={22} color="#0f294a" />
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0f294a' }}>
                    Institutional Verification — {selectedApp.applicationNumber}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Applicant: {selectedApp.personalDetails?.fullName} • {selectedApp.academicDetails?.institutionName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {/* Automated Eligibility & Fraud Risk Summary */}
              <FraudRiskWidget
                eligibilityCheck={selectedApp.eligibilityCheck}
                fraudCheck={selectedApp.fraudCheck}
              />

              {/* Student Summary Info */}
              <div className="grid-cols-2" style={{ gap: '16px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f294a', marginBottom: '8px' }}>
                    Academic Credentials
                  </h4>
                  <div><strong>Course:</strong> {selectedApp.academicDetails?.degree} - {selectedApp.academicDetails?.course}</div>
                  <div><strong>Roll No:</strong> {selectedApp.academicDetails?.rollNumber}</div>
                  <div><strong>CGPA:</strong> <span style={{ color: '#059669', fontWeight: '700' }}>{selectedApp.academicDetails?.cgpa} / 10.0</span> (Benchmark &ge; 6.0)</div>
                  <div><strong>Previous Marks:</strong> {selectedApp.academicDetails?.previousPercentage}%</div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f294a', marginBottom: '8px' }}>
                    Financial & Bank Details
                  </h4>
                  <div><strong>Annual Income:</strong> ₹{Number(selectedApp.incomeDetails?.annualFamilyIncome || 0).toLocaleString('en-IN')}</div>
                  <div><strong>Income Cert No:</strong> {selectedApp.incomeDetails?.incomeCertificateNumber}</div>
                  <div><strong>Bank Name:</strong> {selectedApp.bankDetails?.bankName}</div>
                  <div><strong>A/C:</strong> •••• •••• {selectedApp.bankDetails?.accountNumber?.slice(-4)} (IFSC: {selectedApp.bankDetails?.ifscCode})</div>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f294a', marginBottom: '10px' }}>
                  Uploaded Documents & Certificates ({selectedApp.documents?.length || 0})
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                  {selectedApp.documents && selectedApp.documents.length > 0 ? (
                    selectedApp.documents.map((doc) => (
                      <div
                        key={doc._id}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: 'var(--radius-md)',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                        }}
                      >
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {doc.originalFilename}
                          </div>
                          <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'capitalize' }}>
                            {doc.documentType?.replace('_', ' ')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewingDoc(doc)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                          View File
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#64748b', fontSize: '12px' }}>No documents uploaded.</div>
                  )}
                </div>
              </div>

              {/* Decision Form */}
              <form onSubmit={handleReviewDecision} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f294a', marginBottom: '12px' }}>
                  Take Verification Decision
                </h4>

                {/* Action Selector */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <label
                    style={{
                      border: `2px solid ${reviewAction === 'FORWARD' ? '#2563eb' : '#e2e8f0'}`,
                      backgroundColor: reviewAction === 'FORWARD' ? '#eff6ff' : '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="radio"
                        name="reviewAction"
                        value="FORWARD"
                        checked={reviewAction === 'FORWARD'}
                        onChange={(e) => setReviewAction(e.target.value)}
                      />
                      <strong style={{ fontSize: '13px', color: '#1d4ed8' }}>Verify & Forward</strong>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Forward to State Authority for final sanction & DBT
                    </span>
                  </label>

                  <label
                    style={{
                      border: `2px solid ${reviewAction === 'REQUEST_RESUBMISSION' ? '#d97706' : '#e2e8f0'}`,
                      backgroundColor: reviewAction === 'REQUEST_RESUBMISSION' ? '#fffbeb' : '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="radio"
                        name="reviewAction"
                        value="REQUEST_RESUBMISSION"
                        checked={reviewAction === 'REQUEST_RESUBMISSION'}
                        onChange={(e) => setReviewAction(e.target.value)}
                      />
                      <strong style={{ fontSize: '13px', color: '#b45309' }}>Request Resubmission</strong>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Ask student to replace illegible/missing certificates
                    </span>
                  </label>

                  <label
                    style={{
                      border: `2px solid ${reviewAction === 'REJECT' ? '#e11d48' : '#e2e8f0'}`,
                      backgroundColor: reviewAction === 'REJECT' ? '#fff1f2' : '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="radio"
                        name="reviewAction"
                        value="REJECT"
                        checked={reviewAction === 'REJECT'}
                        onChange={(e) => setReviewAction(e.target.value)}
                      />
                      <strong style={{ fontSize: '13px', color: '#be123c' }}>Reject Application</strong>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Ineligible criteria or fraudulent claim (reason required)
                    </span>
                  </label>
                </div>

                {/* Remarks Field */}
                <div className="form-group">
                  <label className="form-label">
                    Reviewer Remarks / Verification Note{' '}
                    {reviewAction !== 'FORWARD' && <span style={{ color: '#e11d48' }}>*</span>}
                  </label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder={
                      reviewAction === 'FORWARD'
                        ? 'e.g. Student credentials verified against college enrollment ledger. Recommended.'
                        : reviewAction === 'REQUEST_RESUBMISSION'
                        ? 'e.g. Uploaded Income Certificate is blurred. Please upload clear scanned copy.'
                        : 'e.g. Annual family income exceeds scheme threshold of 3,00,000 INR.'
                    }
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    required={reviewAction !== 'FORWARD'}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedApp(null)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className={`btn ${
                      reviewAction === 'FORWARD'
                        ? 'btn-primary'
                        : reviewAction === 'REQUEST_RESUBMISSION'
                        ? 'btn-secondary'
                        : 'btn-danger'
                    }`}
                    disabled={processingReview}
                  >
                    {processingReview
                      ? 'Submitting Decision...'
                      : reviewAction === 'FORWARD'
                      ? 'Confirm & Forward to State'
                      : reviewAction === 'REQUEST_RESUBMISSION'
                      ? 'Send Resubmission Request'
                      : 'Reject Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {viewingDoc && (
        <DocumentViewerModal
          document={viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
