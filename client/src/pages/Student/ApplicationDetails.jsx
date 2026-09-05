import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import FraudRiskWidget from '../../components/FraudRiskWidget';
import TimelineTracker from '../../components/TimelineTracker';
import DocumentViewerModal from '../../components/DocumentViewerModal';
import ReceiptModal from '../../components/ReceiptModal';
import {
  ArrowLeft,
  Download,
  FileText,
  Building,
  GraduationCap,
  Landmark,
  ShieldCheck,
  AlertCircle,
  Upload,
} from 'lucide-react';

export const ApplicationDetails = () => {
  const { id } = useParams();
  const { token } = useAuth();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingDoc, setViewingDoc] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Resubmission state
  const [resubmitFile, setResubmitFile] = useState(null);
  const [resubmitNote, setResubmitNote] = useState('');
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitSuccess, setResubmitSuccess] = useState('');

  const fetchApplication = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/applications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setApplication(data.application);
      } else {
        setError(data.message || 'Failed to retrieve application.');
      }
    } catch (err) {
      setError('Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id, token]);

  const handleResubmit = async (e) => {
    e.preventDefault();
    if (!resubmitFile) {
      alert('Please choose a revised document file to upload.');
      return;
    }

    setResubmitting(true);
    try {
      // 1. Upload file
      const uploadPayload = new FormData();
      uploadPayload.append('files', resubmitFile);
      uploadPayload.append('documentType', 'income_certificate');
      uploadPayload.append('applicationId', application._id);

      const upRes = await fetch('http://localhost:5000/api/applications/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadPayload,
      });
      const upData = await upRes.json();
      const newDocId = upData.documents[0]?._id;

      // 2. Call resubmit endpoint
      const res = await fetch(`http://localhost:5000/api/applications/${application._id}/resubmit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          documentIds: [newDocId],
          note: resubmitNote,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setResubmitSuccess('Document resubmitted successfully! Status reset to Submitted.');
        setApplication(data.application);
        setResubmitFile(null);
        setResubmitNote('');
      }
    } catch (err) {
      alert('Resubmission failed: ' + err.message);
    } finally {
      setResubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading application details...
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <h3 style={{ color: '#e11d48', marginBottom: '12px' }}>{error || 'Application not found'}</h3>
        <Link to="/student" className="btn btn-secondary">
          <ArrowLeft size={16} /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const p = application.personalDetails || {};
  const a = application.academicDetails || {};
  const inc = application.incomeDetails || {};
  const b = application.bankDetails || {};
  const isDisbursed = application.status === 'Disbursed';
  const isResubmission = application.status === 'Resubmission Requested';

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container">
        {/* Navigation & Header */}
        <div style={{ marginBottom: '20px' }}>
          <Link
            to="/student"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--text-muted)',
              marginBottom: '12px',
            }}
          >
            <ArrowLeft size={14} /> Back to My Applications
          </Link>

          <div className="page-header" style={{ marginBottom: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h1 className="page-title">{application.applicationNumber}</h1>
                <StatusBadge status={application.status} />
              </div>
              <p className="page-subtitle">
                {application.scholarshipScheme?.name} • Submitted on{' '}
                {new Date(application.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isDisbursed && (
                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="btn btn-success"
                >
                  <Download size={16} /> Download Disbursement Voucher (PDF)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Status Tracker */}
        <TimelineTracker
          statusHistory={application.statusHistory || []}
          currentStatus={application.status}
        />

        {/* Resubmission Box if Requested */}
        {isResubmission && (
          <div
            className="card"
            style={{
              backgroundColor: '#fffbeb',
              borderColor: '#fde68a',
              marginBottom: '24px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#92400e' }}>
              <AlertCircle size={22} color="#d97706" />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#92400e' }}>
                Document Resubmission Required
              </h3>
            </div>
            <p style={{ fontSize: '13.5px', color: '#78350f', marginBottom: '16px' }}>
              The reviewer requested revised documentation. Please choose the updated certificate below and submit.
            </p>

            {resubmitSuccess && (
              <div style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '14px', fontSize: '13px' }}>
                {resubmitSuccess}
              </div>
            )}

            <form onSubmit={handleResubmit}>
              <div className="grid-cols-2" style={{ gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label" style={{ color: '#92400e' }}>Choose Scanned Document (PDF / JPG)*</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setResubmitFile(e.target.files[0])}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ color: '#92400e' }}>Applicant Clarification Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Uploaded clear original stamp copy for FY 2025-26"
                    value={resubmitNote}
                    onChange={(e) => setResubmitNote(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ backgroundColor: '#d97706' }}
                disabled={resubmitting}
              >
                <Upload size={14} /> {resubmitting ? 'Uploading...' : 'Submit Revised Document'}
              </button>
            </form>
          </div>
        )}

        {/* Automated Eligibility & Integrity Result */}
        <FraudRiskWidget
          eligibilityCheck={application.eligibilityCheck}
          fraudCheck={application.fraudCheck}
        />

        {/* Detailed Application Information Grid */}
        <div className="grid-cols-2" style={{ gap: '24px', marginTop: '24px' }}>
          {/* Personal Info Card */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: '#0f294a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={18} color="#2563eb" /> Personal Credentials
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Full Name</span>
                <div style={{ fontWeight: '600' }}>{p.fullName}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Aadhaar Number</span>
                <div style={{ fontWeight: '600' }}>{p.aadhaarNumber}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Gender & Category</span>
                <div style={{ fontWeight: '600' }}>{p.gender} • {p.category}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Mobile & Email</span>
                <div style={{ fontWeight: '600' }}>{p.mobileNumber}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Permanent Address</span>
                <div style={{ fontWeight: '600' }}>{p.permanentAddress}, {p.state} - {p.pincode}</div>
              </div>
            </div>
          </div>

          {/* Academic Info Card */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: '#0f294a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={18} color="#059669" /> Academic Record
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Institution</span>
                <div style={{ fontWeight: '600' }}>{a.institutionName}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Program & Course</span>
                <div style={{ fontWeight: '600' }}>{a.degree} - {a.course}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Roll Number</span>
                <div style={{ fontWeight: '600' }}>{a.rollNumber}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>CGPA (Scale 10.0)</span>
                <div style={{ fontWeight: '700', color: '#059669', fontSize: '15px' }}>{a.cgpa} / 10.0</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Previous Marks (%)</span>
                <div style={{ fontWeight: '600' }}>{a.previousPercentage}%</div>
              </div>
            </div>
          </div>

          {/* Family & Income Info Card */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: '#0f294a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#d97706" /> Family & Financial Profile
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Father's Name & Role</span>
                <div style={{ fontWeight: '600' }}>{inc.fatherName} ({inc.fatherOccupation})</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Annual Family Income</span>
                <div style={{ fontWeight: '700', color: '#0f294a', fontSize: '15px' }}>
                  ₹{Number(inc.annualFamilyIncome || 0).toLocaleString('en-IN')}/-
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Certificate Number</span>
                <div style={{ fontWeight: '600' }}>{inc.incomeCertificateNumber}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Issuing Authority</span>
                <div style={{ fontWeight: '600' }}>{inc.issuingAuthority}</div>
              </div>
            </div>
          </div>

          {/* Direct Benefit Transfer Bank Account */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: '#0f294a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Landmark size={18} color="#7c3aed" /> DBT Bank Account Specification
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Account Holder</span>
                <div style={{ fontWeight: '600' }}>{b.accountHolderName}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Bank & Branch</span>
                <div style={{ fontWeight: '600' }}>{b.bankName} ({b.branchName})</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Account Number</span>
                <div style={{ fontWeight: '600' }}>
                  {b.accountNumber ? `•••• •••• ${b.accountNumber.slice(-4)}` : 'N/A'}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>IFSC Code</span>
                <div style={{ fontWeight: '600' }}>{b.ifscCode}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Uploaded Documents Section */}
        <div className="card" style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: '#0f294a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#2563eb" /> Cryptographically Verified Documents ({application.documents?.length || 0})
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {application.documents && application.documents.length > 0 ? (
              application.documents.map((doc) => (
                <div
                  key={doc._id}
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <FileText size={20} color="#0f294a" style={{ flexShrink: 0 }} />
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: '600', fontSize: '13px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {doc.originalFilename}
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'capitalize' }}>
                        {doc.documentType?.replace('_', ' ')} • {(doc.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setViewingDoc(doc)}
                    className="btn btn-secondary btn-sm"
                    style={{ flexShrink: 0, fontSize: '11px' }}
                  >
                    View File
                  </button>
                </div>
              ))
            ) : (
              <div style={{ color: '#64748b', fontSize: '13px' }}>
                No electronic attachments recorded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {viewingDoc && (
        <DocumentViewerModal
          document={viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}

      {showReceiptModal && (
        <ReceiptModal
          application={application}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
};

export default ApplicationDetails;
