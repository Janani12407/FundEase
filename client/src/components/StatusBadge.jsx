import React from 'react';

export const StatusBadge = ({ status }) => {
  const getStatusClass = (st) => {
    switch (st) {
      case 'Submitted':
        return 'status-submitted';
      case 'Under Institution Review':
      case 'Under Authority Review':
        return 'status-under-review';
      case 'Forwarded':
        return 'status-forwarded';
      case 'Approved':
        return 'status-approved';
      case 'Disbursed':
        return 'status-disbursed';
      case 'Rejected':
        return 'status-rejected';
      case 'Resubmission Requested':
        return 'status-resubmission';
      default:
        return 'status-submitted';
    }
  };

  return (
    <span className={`status-badge ${getStatusClass(status)}`}>
      <span className="status-dot" />
      {status || 'Unknown'}
    </span>
  );
};

export default StatusBadge;
