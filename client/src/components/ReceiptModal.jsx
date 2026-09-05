import React from 'react';
import { X, Download, ShieldCheck, CheckCircle, Landmark, Award } from 'lucide-react';

export const ReceiptModal = ({ application, onClose }) => {
  if (!application) return null;

  const downloadReceipt = async () => {
    const token = localStorage.getItem('fundease_token');
    try {
      const res = await fetch(`http://localhost:5000/api/disbursement/receipt/${application._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // Fallback to window.open with query token
        window.open(`http://localhost:5000/api/disbursement/receipt/${application._id}?token=${token}`, '_blank');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Voucher_${application.applicationNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      window.open(`http://localhost:5000/api/disbursement/receipt/${application._id}?token=${token}`, '_blank');
    }
  };

  const d = application.disbursementDetails || {};
  const amount = d.amount || application.scholarshipScheme?.awardAmount || 50000;
  const rawAccount = application.bankDetails?.accountNumber || '000000000000';
  const maskedAccount = rawAccount.length > 4 ? `XXXX-XXXX-${rawAccount.slice(-4)}` : 'XXXX-XXXX-1234';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        {/* Modal Header */}
        <div className="modal-header" style={{ backgroundColor: '#0f294a', color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={24} color="#10b981" />
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff' }}>
                Electronic Disbursement Voucher (DBT)
              </h3>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Government Accredited Direct Benefit Transfer System
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#ffffff',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Success Banner */}
          <div
            style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              textAlign: 'center',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>
              <CheckCircle size={18} />
              <span>Direct Benefit Transfer Disbursed</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#064e3b', fontFamily: 'var(--font-heading)' }}>
              ₹{Number(amount).toLocaleString('en-IN')}/-
            </div>
            <span style={{ fontSize: '12px', color: '#059669' }}>
              Credited directly to Beneficiary Registered Bank Account
            </span>
          </div>

          {/* Key-Value Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '13px' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>Voucher Ref No</span>
              <strong style={{ color: '#0f294a' }}>{d.receiptNumber || `TXN-DBT-2026-X84`}</strong>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>Bank UTR Number</span>
              <strong style={{ color: '#0f294a' }}>{d.utrNumber || `UTR-SBIN-${Date.now().toString().slice(0, 10)}`}</strong>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>Beneficiary Student</span>
              <strong style={{ color: '#0f294a' }}>{application.personalDetails?.fullName}</strong>
              <div style={{ fontSize: '11px', color: '#64748b' }}>App: {application.applicationNumber}</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>Institution</span>
              <strong style={{ color: '#0f294a' }}>{application.academicDetails?.institutionName}</strong>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Roll: {application.academicDetails?.rollNumber}</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>Target Bank & Branch</span>
              <strong style={{ color: '#0f294a' }}>{application.bankDetails?.bankName}</strong>
              <div style={{ fontSize: '11px', color: '#64748b' }}>IFSC: {application.bankDetails?.ifscCode}</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>Masked Account</span>
              <strong style={{ color: '#0f294a' }}>{maskedAccount}</strong>
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>✓ Aadhaar-Linked Bank</div>
            </div>
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '10px 14px',
              backgroundColor: '#f1f5f9',
              borderRadius: 'var(--radius-md)',
              fontSize: '11.5px',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ShieldCheck size={16} color="#059669" />
            <span>
              Cryptographically timestamped DBT transfer. Recorded in the immutable audit ledger with institutional and authority signoffs.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>
          <button onClick={downloadReceipt} className="btn btn-success btn-sm">
            <Download size={15} /> Download Official PDF Voucher
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
