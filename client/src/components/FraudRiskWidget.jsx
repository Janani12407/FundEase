import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, XCircle, Hash, Landmark, FileCheck } from 'lucide-react';

export const FraudRiskWidget = ({ eligibilityCheck, fraudCheck }) => {
  const riskLevel = fraudCheck?.riskLevel || 'LOW';

  return (
    <div
      style={{
        backgroundColor: riskLevel === 'HIGH' ? '#fff1f2' : riskLevel === 'MEDIUM' ? '#fffbeb' : '#f0fdf4',
        border: `1px solid ${riskLevel === 'HIGH' ? '#fecdd3' : riskLevel === 'MEDIUM' ? '#fde68a' : '#bbf7d0'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        marginTop: '12px',
        marginBottom: '16px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {riskLevel === 'HIGH' ? (
            <AlertOctagon size={22} color="#e11d48" />
          ) : riskLevel === 'MEDIUM' ? (
            <AlertTriangle size={22} color="#d97706" />
          ) : (
            <ShieldCheck size={22} color="#059669" />
          )}
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: riskLevel === 'HIGH' ? '#9f1239' : riskLevel === 'MEDIUM' ? '#92400e' : '#065f46' }}>
              Automated Integrity & Eligibility Check
            </h4>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Rule-based verification score: <strong>{eligibilityCheck?.score || 100}/100</strong>
            </span>
          </div>
        </div>

        <div>
          <span className={`risk-badge risk-${riskLevel.toLowerCase()}`}>
            {riskLevel === 'HIGH' ? 'High Risk / Duplicate Flagged' : riskLevel === 'MEDIUM' ? 'Review Advised' : 'Verified Clear'}
          </span>
        </div>
      </div>

      {/* Checklist grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
        {/* Income Criterion */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          {eligibilityCheck?.incomeEligible ? (
            <CheckCircle2 size={16} color="#059669" />
          ) : (
            <XCircle size={16} color="#e11d48" />
          )}
          <span>Family Income Limit: <strong>{eligibilityCheck?.incomeEligible ? 'Passed' : 'Exceeded'}</strong></span>
        </div>

        {/* Academic Criterion */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          {eligibilityCheck?.academicEligible ? (
            <CheckCircle2 size={16} color="#059669" />
          ) : (
            <XCircle size={16} color="#e11d48" />
          )}
          <span>Academic Benchmark: <strong>{eligibilityCheck?.academicEligible ? 'Qualified' : 'Below Cutoff'}</strong></span>
        </div>

        {/* Aadhaar Duplicate Check */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          {!fraudCheck?.hasDuplicateAadhaar ? (
            <CheckCircle2 size={16} color="#059669" />
          ) : (
            <XCircle size={16} color="#e11d48" />
          )}
          <span>Aadhaar Unique: <strong>{!fraudCheck?.hasDuplicateAadhaar ? 'No Duplicates' : 'Duplicate Found!'}</strong></span>
        </div>

        {/* Bank Account Duplicate Check */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          {!fraudCheck?.hasDuplicateBank ? (
            <CheckCircle2 size={16} color="#059669" />
          ) : (
            <XCircle size={16} color="#e11d48" />
          )}
          <span>Bank Account Unique: <strong>{!fraudCheck?.hasDuplicateBank ? 'Unique A/C' : 'Reused A/C!'}</strong></span>
        </div>

        {/* Document SHA-256 Hash Check */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          {!fraudCheck?.hasDuplicateDocumentHash ? (
            <FileCheck size={16} color="#059669" />
          ) : (
            <XCircle size={16} color="#e11d48" />
          )}
          <span>Doc SHA-256 Hash: <strong>{!fraudCheck?.hasDuplicateDocumentHash ? 'Authentic' : 'Duplicate Hash!'}</strong></span>
        </div>
      </div>

      {/* Duplicate / Advisory Details */}
      {fraudCheck?.duplicateDetails && fraudCheck.duplicateDetails.length > 0 && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
          }}
        >
          <strong style={{ color: riskLevel === 'HIGH' ? '#e11d48' : '#d97706', display: 'block', marginBottom: '4px' }}>
            System Audit Flags:
          </strong>
          <ul style={{ paddingLeft: '18px', margin: 0, color: '#334155' }}>
            {fraudCheck.duplicateDetails.map((msg, idx) => (
              <li key={idx} style={{ marginBottom: '3px' }}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FraudRiskWidget;
