import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, Mail, ArrowRight, UserCheck, Building, Landmark, ShieldAlert } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = await login(email, password);
      // Navigate based on role
      const role = data.user?.role;
      if (role === 'student') navigate('/student');
      else if (role === 'institution_admin') navigate('/admin');
      else if (role === 'scholarship_authority') navigate('/authority');
      else if (role === 'auditor') navigate('/auditor');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div style={{ padding: '60px 0', minHeight: 'calc(100vh - 150px)', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '480px' }}>
        <div className="card" style={{ padding: '36px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                backgroundColor: 'var(--primary-900)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}
            >
              <GraduationCap size={28} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Portal Sign In</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Access the Paperless Scholarship Disbursement Platform
            </p>
          </div>

          {/* Quick Demo Pre-fill Pills */}
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
              Instant Demo Fill:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleDemoFill('student@fundease.gov.in', 'Password@123')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', justifyContent: 'flex-start', padding: '6px 10px' }}
              >
                <UserCheck size={13} color="#2563eb" /> Student
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('admin@apexcollege.edu.in', 'Password@123')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', justifyContent: 'flex-start', padding: '6px 10px' }}
              >
                <Building size={13} color="#d97706" /> College Desk
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('authority@scholarship.gov.in', 'Password@123')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', justifyContent: 'flex-start', padding: '6px 10px' }}
              >
                <Landmark size={13} color="#059669" /> Authority Desk
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('auditor@compliance.gov.in', 'Password@123')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', justifyContent: 'flex-start', padding: '6px 10px' }}
              >
                <ShieldAlert size={13} color="#7c3aed" /> Auditor
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#be123c',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. student@fundease.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={submitting}
            >
              {submitting ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
            New student applicant?{' '}
            <Link to="/register" style={{ fontWeight: '700', color: 'var(--primary-600)' }}>
              Register Student Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
