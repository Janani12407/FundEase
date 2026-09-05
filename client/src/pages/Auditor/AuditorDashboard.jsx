import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Shield,
  Layers,
} from 'lucide-react';

export const AuditorDashboard = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:5000/api/audit?limit=100`;
      if (roleFilter !== 'ALL') url += `&role=${roleFilter}`;
      if (actionFilter !== 'ALL') url += `&action=${actionFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token, roleFilter, actionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="risk-badge risk-high" style={{ fontSize: '10px' }}>
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="risk-badge risk-medium" style={{ fontSize: '10px' }}>
            WARNING
          </span>
        );
      default:
        return (
          <span className="risk-badge risk-low" style={{ fontSize: '10px' }}>
            INFO
          </span>
        );
    }
  };

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', marginBottom: '4px' }}>
              <ShieldAlert size={20} />
              <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>
                CAG & Regulatory Compliance Desk
              </span>
            </div>
            <h1 className="page-title">Immutable System Audit Trail</h1>
            <p className="page-subtitle">
              Cryptographically timestamped audit ledger tracking every status change, administrative decision, and financial transfer.
            </p>
          </div>
        </div>

        {/* Filters and Search */}
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
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '280px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search audit trail by user, description, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>User Role:</span>
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12.5px', width: 'auto' }}
              >
                <option value="ALL">All Roles</option>
                <option value="student">Student</option>
                <option value="institution_admin">College Desk</option>
                <option value="scholarship_authority">Authority</option>
                <option value="auditor">Auditor</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Action Category:</span>
              <select
                className="form-select"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12.5px', width: 'auto' }}
              >
                <option value="ALL">All Actions</option>
                <option value="APPLICATION_SUBMITTED">Application Submitted</option>
                <option value="INSTITUTION_FORWARDED">Institution Forwarded</option>
                <option value="AUTHORITY_APPROVED">Authority Approved</option>
                <option value="FUNDS_DISBURSED">Funds Disbursed</option>
                <option value="FRAUD_FLAG_DETECTED">Fraud Flag Detected</option>
                <option value="DOCUMENTS_RESUBMITTED">Documents Resubmitted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp (UTC+05:30)</th>
                <th>Action & Severity</th>
                <th>Actor / User</th>
                <th>Target Entity</th>
                <th>Description / Audit Event Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Loading compliance records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No audit records matching current filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#0f294a' }}>
                        {new Date(log.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <strong style={{ fontSize: '12.5px', color: '#1e293b' }}>{log.action}</strong>
                      </div>
                      <div>{getSeverityBadge(log.severity)}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '600', color: '#0f294a' }}>{log.performedByName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {log.role} • {log.performedByEmail}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#2563eb' }}>
                        {log.targetEntity}
                      </span>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                        ID: {log.entityId ? log.entityId.substring(0, 10) + '...' : 'N/A'}
                      </div>
                    </td>

                    <td style={{ maxWidth: '380px' }}>
                      <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: '1.4' }}>
                        {log.description}
                      </div>
                    </td>

                    <td>
                      <code style={{ fontSize: '11.5px', color: '#64748b' }}>
                        {log.ipAddress}
                      </code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditorDashboard;
