import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import FraudRiskWidget from '../../components/FraudRiskWidget';
import ReceiptModal from '../../components/ReceiptModal';
import DocumentViewerModal from '../../components/DocumentViewerModal';
import {
  Landmark,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  AlertOctagon,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
  CheckCheck,
} from 'lucide-react';

export const AuthorityDashboard = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('QUEUE'); // QUEUE or LEDGER
  const [applications, setApplications] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [inspectingApp, setInspectingApp] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [receiptApp, setReceiptApp] = useState(null);
  const [disbursingId, setDisbursingId] = useState(null);

  // Authority Rejection Modal State
  const [rejectingApp, setRejectingApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingReject, setProcessingReject] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch applications
      const appRes = await fetch('http://localhost:5000/api/applications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const appData = await appRes.json();
      if (appData.success) {
        setApplications(appData.applications || []);
      }

      // 2. Fetch transactions
      const txnRes = await fetch('http://localhost:5000/api/disbursement/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const txnData = await txnRes.json();
      if (txnData.success) {
        setTransactions(txnData.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load authority data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Trigger simulated DBT Disbursement
  const handleDisburseFunds = async (app) => {
    const confirmDisburse = window.confirm(
      `Confirm electronic Direct Benefit Transfer (DBT) of ₹${(app.scholarshipScheme?.awardAmount || 50000).toLocaleString(
        'en-IN'
      )} to student ${app.personalDetails?.fullName}?`
    );
    if (!confirmDisburse) return;

    setDisbursingId(app._id);
    try {
      const res = await fetch(`http://localhost:5000/api/disbursement/${app._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Disbursement failed.');
      }

      // Confetti celebration!
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Show receipt modal
      setReceiptApp(data.application);
      fetchData();
    } catch (err) {
      alert('Disbursement failed: ' + err.message);
    } finally {
      setDisbursingId(null);
    }
  };

  // Reject Application
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      alert('Please enter a mandatory rejection reason (min 5 characters).');
      return;
    }

    setProcessingReject(true);
    try {
      const res = await fetch(`http://localhost:5000/api/reviews/authority/${rejectingApp._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'REJECT',
          remarks: rejectionReason,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Rejection failed.');
      }

      alert(`Application ${rejectingApp.applicationNumber} has been rejected.`);
      setRejectingApp(null);
      setRejectionReason('');
      fetchData();
    } catch (err) {
      alert(err.message || 'Error executing rejection.');
    } finally {
      setProcessingReject(false);
    }
  };

  // Derived counts
  const forwardedQueue = applications.filter((a) => ['Forwarded', 'Under Authority Review'].includes(a.status));
  const totalDisbursedAmount = transactions.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const highRiskCount = applications.filter((a) => a.fraudCheck?.riskLevel === 'HIGH').length;

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', marginBottom: '4px' }}>
              <Landmark size={20} />
              <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>
                State Scholarship Directorate
              </span>
            </div>
            <h1 className="page-title">Authority Sanction & Disbursement Desk</h1>
            <p className="page-subtitle">
              Sanction verified scholarship claims and release Direct Benefit Transfers (DBT) directly into beneficiary accounts.
            </p>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Clock size={24} />
            </div>
            <div>
              <div className="kpi-value">{forwardedQueue.length}</div>
              <div className="kpi-label">Awaiting Final Sanction</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
              <CheckCheck size={24} />
            </div>
            <div>
              <div className="kpi-value">{transactions.length}</div>
              <div className="kpi-label">Disbursed Beneficiaries</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <div className="kpi-value">₹{totalDisbursedAmount.toLocaleString('en-IN')}</div>
              <div className="kpi-label">Total DBT Funds Settled</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: '#fff1f2', color: '#e11d48' }}>
              <AlertOctagon size={24} />
            </div>
            <div>
              <div className="kpi-value">{highRiskCount}</div>
              <div className="kpi-label">Fraud Flags Intercepted</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '2px solid #e2e8f0',
            marginBottom: '24px',
          }}
        >
          <button
            onClick={() => setActiveTab('QUEUE')}
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '700',
              color: activeTab === 'QUEUE' ? '#0f294a' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'QUEUE' ? '3px solid #0f294a' : '3px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '-2px',
            }}
          >
            <Clock size={16} /> Sanction Queue ({forwardedQueue.length})
          </button>

          <button
            onClick={() => setActiveTab('LEDGER')}
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '700',
              color: activeTab === 'LEDGER' ? '#0f294a' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'LEDGER' ? '3px solid #0f294a' : '3px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '-2px',
            }}
          >
            <ShieldCheck size={16} /> Disbursed Settlement Ledger ({transactions.length})
          </button>
        </div>

        {/* TAB 1: SANCTION QUEUE */}
        {activeTab === 'QUEUE' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application No</th>
                  <th>Student & College</th>
                  <th>Award Amount</th>
                  <th>Endorsement & CGPA</th>
                  <th>Fraud / Duplicate Check</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Loading forwarded application queue...
                    </td>
                  </tr>
                ) : forwardedQueue.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No forwarded applications currently awaiting final sanction.
                    </td>
                  </tr>
                ) : (
                  forwardedQueue.map((app) => {
                    const risk = app.fraudCheck?.riskLevel || 'LOW';
                    const amount = app.scholarshipScheme?.awardAmount || 50000;
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
                            {app.academicDetails?.institutionName}
                          </div>
                        </td>

                        <td>
                          <strong style={{ color: '#059669', fontSize: '15px' }}>
                            ₹{amount.toLocaleString('en-IN')}/-
                          </strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            A/C: •••• {app.bankDetails?.accountNumber?.slice(-4)}
                          </div>
                        </td>

                        <td>
                          <div style={{ color: '#334155' }}>
                            CGPA: <strong>{app.academicDetails?.cgpa}</strong>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: '600' }}>
                            ✓ College Endorsed
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
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => setInspectingApp(app)}
                              className="btn btn-secondary btn-sm"
                              title="Inspect credentials and documents"
                            >
                              <Eye size={13} /> Inspect
                            </button>

                            <button
                              onClick={() => handleDisburseFunds(app)}
                              className="btn btn-success btn-sm"
                              disabled={disbursingId === app._id}
                            >
                              <CheckCircle size={13} />
                              {disbursingId === app._id ? 'Disbursing...' : 'Approve & Disburse'}
                            </button>

                            <button
                              onClick={() => {
                                setRejectingApp(app);
                                setRejectionReason('');
                              }}
                              className="btn btn-danger btn-sm"
                              title="Reject application"
                            >
                              <XCircle size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: DISBURSEMENT SETTLEMENT LEDGER */}
        {activeTab === 'LEDGER' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Voucher / Txn Number</th>
                  <th>UTR Reference</th>
                  <th>Beneficiary Student</th>
                  <th>Credit Bank & Masked A/C</th>
                  <th>Amount Disbursed</th>
                  <th>Settlement Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Voucher</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No disbursed transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn) => {
                    const app = txn.applicationId || {};
                    return (
                      <tr key={txn._id}>
                        <td>
                          <strong style={{ color: '#0f294a' }}>{txn.transactionNumber}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            App: {app.applicationNumber || 'SCH-REF'}
                          </div>
                        </td>

                        <td>
                          <code style={{ color: '#047857', fontWeight: '700', fontSize: '12px' }}>
                            {txn.utrNumber}
                          </code>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            PFMS Gateway Validated
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: '600' }}>{txn.studentName}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {txn.studentId?.email}
                          </div>
                        </td>

                        <td>
                          <div>{txn.recipientBankName}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {txn.recipientAccountMasked} ({txn.recipientIfsc})
                          </div>
                        </td>

                        <td>
                          <strong style={{ color: '#059669', fontSize: '15px' }}>
                            ₹{Number(txn.amount).toLocaleString('en-IN')}/-
                          </strong>
                        </td>

                        <td>
                          <div style={{ fontSize: '12px', color: '#1e293b' }}>
                            {new Date(txn.disbursedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {new Date(txn.disbursedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <a
                            href={`http://localhost:5000/api/disbursement/receipt/${txn.applicationId?._id || txn.applicationId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '11.5px' }}
                          >
                            <Download size={13} /> PDF Voucher
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Authority Inspection Modal */}
      {inspectingApp && (
        <div className="modal-overlay" onClick={() => setInspectingApp(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={22} color="#059669" />
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0f294a' }}>
                    Authority Review — {inspectingApp.applicationNumber}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Beneficiary: {inspectingApp.personalDetails?.fullName} • {inspectingApp.academicDetails?.institutionName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectingApp(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <FraudRiskWidget
                eligibilityCheck={inspectingApp.eligibilityCheck}
                fraudCheck={inspectingApp.fraudCheck}
              />

              <div className="grid-cols-2" style={{ gap: '16px', margin: '20px 0' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f294a', marginBottom: '8px' }}>
                    College Endorsement Log
                  </h4>
                  <div><strong>Institution:</strong> {inspectingApp.academicDetails?.institutionName}</div>
                  <div><strong>Student Roll No:</strong> {inspectingApp.academicDetails?.rollNumber}</div>
                  <div><strong>Verified CGPA:</strong> {inspectingApp.academicDetails?.cgpa} / 10.0</div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f294a', marginBottom: '8px' }}>
                    Target DBT Bank Account
                  </h4>
                  <div><strong>Beneficiary:</strong> {inspectingApp.bankDetails?.accountHolderName}</div>
                  <div><strong>Bank:</strong> {inspectingApp.bankDetails?.bankName} ({inspectingApp.bankDetails?.branchName})</div>
                  <div><strong>Account No:</strong> •••• •••• {inspectingApp.bankDetails?.accountNumber?.slice(-4)}</div>
                  <div><strong>IFSC:</strong> {inspectingApp.bankDetails?.ifscCode}</div>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f294a', marginBottom: '10px' }}>
                  Cryptographically Fingerprinted Documents ({inspectingApp.documents?.length || 0})
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                  {inspectingApp.documents?.map((doc) => (
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
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setInspectingApp(null)} className="btn btn-secondary btn-sm">
                Close
              </button>
              <button
                onClick={() => {
                  const toDisburse = inspectingApp;
                  setInspectingApp(null);
                  handleDisburseFunds(toDisburse);
                }}
                className="btn btn-success btn-sm"
              >
                <CheckCircle size={14} /> Approve & Release DBT Funds
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authority Rejection Modal */}
      {rejectingApp && (
        <div className="modal-overlay" onClick={() => setRejectingApp(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#be123c' }}>
                Reject Application — {rejectingApp.applicationNumber}
              </h3>
              <button onClick={() => setRejectingApp(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleRejectSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
                  Please state the official authority reason for rejecting this claim. This reason will be logged in the immutable audit trail and sent to the student.
                </p>

                <div className="form-group">
                  <label className="form-label">Mandatory Rejection Reason*</label>
                  <textarea
                    rows={4}
                    className="form-textarea"
                    placeholder="e.g. Duplicate Aadhaar detected across multiple submissions or annual income exceeds scheme limits."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setRejectingApp(null)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger btn-sm" disabled={processingReject}>
                  {processingReject ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptApp && (
        <ReceiptModal
          application={receiptApp}
          onClose={() => setReceiptApp(null)}
        />
      )}

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <DocumentViewerModal
          document={viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
};

export default AuthorityDashboard;
