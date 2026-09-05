import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  ShieldCheck,
  Zap,
  FileCheck,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
  Building,
  Landmark,
  ShieldAlert,
  Download,
} from 'lucide-react';

export const LandingPage = () => {
  const { switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemo = async (role, path) => {
    await switchDemoRole(role);
    navigate(path);
  };

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #061325 0%, #0c2340 50%, #172554 100%)',
          color: '#ffffff',
          padding: '80px 0 100px 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '24px',
                color: '#93c5fd',
              }}
            >
              <Zap size={14} color="#60a5fa" />
              <span>Next-Gen Paperless Scholarship Disbursement Platform</span>
            </div>

            <h1
              style={{
                fontSize: '48px',
                lineHeight: '1.15',
                fontWeight: '800',
                letterSpacing: '-0.03em',
                marginBottom: '20px',
                color: '#ffffff',
              }}
            >
              Zero Paperwork. Transparent Sanctions.{' '}
              <span style={{ color: '#38bdf8' }}>Direct to Bank Account.</span>
            </h1>

            <p
              style={{
                fontSize: '18px',
                lineHeight: '1.6',
                color: '#cbd5e1',
                marginBottom: '36px',
              }}
            >
              Eliminate physical applications, delays, and fraudulent claims. FundEase seamlessly connects students, colleges, and scholarship authorities in a cryptographic, tamper-evident approval and Direct Benefit Transfer (DBT) ecosystem.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-primary btn-lg" style={{ backgroundColor: '#2563eb' }}>
                Sign In to Portal <ArrowRight size={18} />
              </Link>
              <Link to="/register" className="btn btn-secondary btn-lg" style={{ color: '#0f172a' }}>
                Apply as Student
              </Link>
            </div>
          </div>

          {/* Quick Role Tester Cards */}
          <div
            style={{
              marginTop: '64px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#93c5fd', fontWeight: '700' }}>
                Interactive Evaluation Desks — Instant One-Click Demo Access
              </span>
            </div>

            <div className="grid-cols-4">
              {/* Student Desk */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', marginBottom: '8px' }}>
                  <GraduationCap size={20} />
                  <strong style={{ fontSize: '15px' }}>1. Student Desk</strong>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
                  Submit multi-step claims, upload marksheets, and download disbursement vouchers.
                </p>
                <button
                  onClick={() => handleQuickDemo('student', '/student')}
                  className="btn btn-sm btn-secondary"
                  style={{ width: '100%', fontSize: '12px' }}
                >
                  Enter as Aarav Sharma
                </button>
              </div>

              {/* Institution Admin */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', marginBottom: '8px' }}>
                  <Building size={20} />
                  <strong style={{ fontSize: '15px' }}>2. College Desk</strong>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
                  Inspect student records, run duplicate checks, and forward verified claims.
                </p>
                <button
                  onClick={() => handleQuickDemo('institution_admin', '/admin')}
                  className="btn btn-sm btn-secondary"
                  style={{ width: '100%', fontSize: '12px' }}
                >
                  Enter as Dr. Vikram Seth
                </button>
              </div>

              {/* Authority Desk */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', marginBottom: '8px' }}>
                  <Landmark size={20} />
                  <strong style={{ fontSize: '15px' }}>3. Authority Desk</strong>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
                  Sanction forwarded applications and trigger simulated Direct Benefit Transfer.
                </p>
                <button
                  onClick={() => handleQuickDemo('scholarship_authority', '/authority')}
                  className="btn btn-sm btn-secondary"
                  style={{ width: '100%', fontSize: '12px' }}
                >
                  Enter as Meera Krishnan
                </button>
              </div>

              {/* Auditor Desk */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', marginBottom: '8px' }}>
                  <ShieldAlert size={20} />
                  <strong style={{ fontSize: '15px' }}>4. Auditor Desk</strong>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
                  Inspect immutable audit ledger, fraud flags, and financial disbursement logs.
                </p>
                <button
                  onClick={() => handleQuickDemo('auditor', '/auditor')}
                  className="btn btn-sm btn-secondary"
                  style={{ width: '100%', fontSize: '12px' }}
                >
                  Enter as Rajeshwar Rao
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Highlights Grid */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 50px auto' }}>
            <h2 style={{ fontSize: '32px', marginBottom: '12px', color: '#0f294a' }}>
              Built for Absolute Trust & Speed
            </h2>
            <p style={{ color: '#64748b', fontSize: '16px' }}>
              Combining automated eligibility rules, document hash fingerprinting, and digital auditability to eliminate administrative delays.
            </p>
          </div>

          <div className="grid-cols-3">
            <div className="card" style={{ textAlign: 'left' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', marginBottom: '18px' }}>
                <ShieldCheck size={26} />
              </div>
              <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Automated Fraud & Duplicate Checks</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                Cross-application verification identifies reused bank accounts, duplicate Aadhaar numbers, and identical document binary hashes (SHA-256) in real time.
              </p>
            </div>

            <div className="card" style={{ textAlign: 'left' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', marginBottom: '18px' }}>
                <Layers size={26} />
              </div>
              <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Multi-Tier Institutional Approvals</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                Seamless workflow passing from Institution Desk verification to State Authority final sanction, with mandatory rejection logging and resubmission requests.
              </p>
            </div>

            <div className="card" style={{ textAlign: 'left' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', marginBottom: '18px' }}>
                <FileCheck size={26} />
              </div>
              <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Simulated DBT & PDF Receipts</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                One-click disbursement simulator executes Direct Benefit Transfer, masks sensitive student banking info, and issues an official PDF voucher with verification keys.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lifecycle Flowchart Banner */}
      <section style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '60px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>The Paperless End-to-End Lifecycle</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '40px' }}>
            Transparent status transitions tracked at every single stage of the scholarship workflow
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <span className="status-badge status-submitted">1. Submitted</span>
            <ArrowRight size={16} color="#94a3b8" />
            <span className="status-badge status-under-review">2. College Review</span>
            <ArrowRight size={16} color="#94a3b8" />
            <span className="status-badge status-forwarded">3. Forwarded</span>
            <ArrowRight size={16} color="#94a3b8" />
            <span className="status-badge status-approved">4. Approved</span>
            <ArrowRight size={16} color="#94a3b8" />
            <span className="status-badge status-disbursed">5. Disbursed (DBT)</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
