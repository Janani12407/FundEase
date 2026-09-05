import React from 'react';
import { Check, Clock, AlertCircle, X, ArrowRight, Shield } from 'lucide-react';

export const TimelineTracker = ({ statusHistory = [], currentStatus = 'Submitted' }) => {
  const steps = [
    { key: 'Submitted', label: '1. Submitted' },
    { key: 'Under Institution Review', label: '2. College Review' },
    { key: 'Forwarded', label: '3. Forwarded to State' },
    { key: 'Approved', label: '4. State Sanction' },
    { key: 'Disbursed', label: '5. DBT Disbursed' },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'Submitted':
        return 0;
      case 'Under Institution Review':
        return 1;
      case 'Forwarded':
      case 'Under Authority Review':
        return 2;
      case 'Approved':
        return 3;
      case 'Disbursed':
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);
  const isRejected = currentStatus === 'Rejected';
  const isResubmission = currentStatus === 'Resubmission Requested';

  return (
    <div style={{ marginTop: '20px', marginBottom: '28px' }}>
      {/* Horizontal Step Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          padding: '10px 0 24px 0',
        }}
      >
        {/* Connecting Line */}
        <div
          style={{
            position: 'absolute',
            top: '28px',
            left: '30px',
            right: '30px',
            height: '3px',
            backgroundColor: '#e2e8f0',
            zIndex: 1,
          }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx <= currentIndex && !isRejected;
          const isCurrent = idx === currentIndex;

          return (
            <div
              key={step.key}
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'center',
                width: '120px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? '#059669' : isCurrent ? '#0f294a' : '#ffffff',
                  border: `2px solid ${isCompleted ? '#059669' : isCurrent ? '#0f294a' : '#cbd5e1'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isCompleted || isCurrent ? '#ffffff' : '#64748b',
                  fontSize: '13px',
                  fontWeight: '700',
                  boxShadow: isCurrent ? '0 0 0 4px #dbeafe' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {isCompleted ? <Check size={18} /> : idx + 1}
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: isCurrent ? '700' : '500',
                  color: isCurrent ? '#0f294a' : isCompleted ? '#059669' : '#64748b',
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Exception Alerts */}
      {isRejected && (
        <div
          style={{
            backgroundColor: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            color: '#9f1239',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <X size={18} color="#e11d48" />
          <span>This application was <strong>Rejected</strong> during review. Check the event log below for detailed feedback remarks.</span>
        </div>
      )}

      {isResubmission && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            color: '#92400e',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <AlertCircle size={18} color="#d97706" />
          <span><strong>Document Resubmission Requested:</strong> The reviewer requires updated or clearer certificates. Please resubmit below.</span>
        </div>
      )}

      {/* Detailed Status History Log */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
        <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Verification & Transition Audit Trail ({statusHistory.length} Events)
        </h5>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {statusHistory.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                paddingBottom: index !== statusHistory.length - 1 ? '12px' : '0',
                borderBottom: index !== statusHistory.length - 1 ? '1px solid #f1f5f9' : 'none',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0f294a',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <Clock size={15} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f294a' }}>
                    {item.status}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {new Date(item.timestamp).toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                  Action by: <strong>{item.changedByName || 'System'}</strong> ({item.role || 'user'})
                </div>
                {item.remarks && (
                  <div
                    style={{
                      fontSize: '12px',
                      backgroundColor: '#f8fafc',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      marginTop: '6px',
                      color: '#334155',
                      borderLeft: '3px solid #2563eb',
                    }}
                  >
                    "{item.remarks}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelineTracker;
