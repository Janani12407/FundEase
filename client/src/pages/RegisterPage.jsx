import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ArrowRight } from 'lucide-react';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    institution: 'Apex Institute of Technology',
    studentRollNumber: '',
    phone: '',
    aadhaarNumber: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await register({ ...formData, role: 'student' });
      navigate('/student');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '50px 0' }}>
      <div className="container" style={{ maxWidth: '560px' }}>
        <div className="card" style={{ padding: '36px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'var(--primary-900)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <GraduationCap size={24} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Student Portal Registration</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Create an applicant account to submit and track your scholarship
            </p>
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
              <label className="form-label">Full Name (as per Aadhaar)</label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="e.g. Aarav Sharma"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid-cols-2" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="student@example.edu"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input
                  type="text"
                  name="phone"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid-cols-2" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">College / University</label>
                <input
                  type="text"
                  name="institution"
                  className="form-input"
                  value={formData.institution}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Student Roll / Enrollment No</label>
                <input
                  type="text"
                  name="studentRollNumber"
                  className="form-input"
                  placeholder="e.g. AIT-2024-CS-042"
                  value={formData.studentRollNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid-cols-2" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Aadhaar / National ID No</label>
                <input
                  type="text"
                  name="aadhaarNumber"
                  className="form-input"
                  placeholder="7845-9012-3456"
                  value={formData.aadhaarNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password (min 6 characters)</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '10px' }}
              disabled={submitting}
            >
              {submitting ? 'Creating Account...' : 'Complete Student Registration'} <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Already registered?{' '}
            <Link to="/login" style={{ fontWeight: '700', color: 'var(--primary-600)' }}>
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
