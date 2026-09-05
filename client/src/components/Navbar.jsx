import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  GraduationCap,
  Bell,
  LogOut,
  LayoutDashboard,
  FilePlus,
  ShieldCheck,
  Building,
  BarChart3,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'student':
        return <span className="role-badge role-student">Student</span>;
      case 'institution_admin':
        return <span className="role-badge role-institution_admin">College Desk</span>;
      case 'scholarship_authority':
        return <span className="role-badge role-scholarship_authority">Authority Desk</span>;
      case 'auditor':
        return <span className="role-badge role-auditor">Auditor</span>;
      default:
        return null;
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Brand */}
        <Link to="/" className="brand-logo">
          <div className="brand-icon">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="brand-name">FundEase</div>
            <div className="brand-tag">Scholarship Portal</div>
          </div>
        </Link>

        {/* Dynamic Navigation based on logged in role */}
        <div className="nav-links">
          {isAuthenticated && user?.role === 'student' && (
            <>
              <Link
                to="/student"
                className={`nav-link ${location.pathname === '/student' ? 'active' : ''}`}
              >
                <LayoutDashboard size={16} />
                My Applications
              </Link>
              <Link
                to="/student/apply"
                className={`nav-link ${location.pathname === '/student/apply' ? 'active' : ''}`}
              >
                <FilePlus size={16} />
                Apply Scholarship
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === 'institution_admin' && (
            <>
              <Link
                to="/admin"
                className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
              >
                <Building size={16} />
                College Verification Desk
              </Link>
              <Link
                to="/analytics"
                className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}
              >
                <BarChart3 size={16} />
                Analytics & Insights
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === 'scholarship_authority' && (
            <>
              <Link
                to="/authority"
                className={`nav-link ${location.pathname === '/authority' ? 'active' : ''}`}
              >
                <ShieldCheck size={16} />
                Authority Sanction Desk
              </Link>
              <Link
                to="/analytics"
                className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}
              >
                <BarChart3 size={16} />
                Disbursement Analytics
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === 'auditor' && (
            <>
              <Link
                to="/auditor"
                className={`nav-link ${location.pathname === '/auditor' ? 'active' : ''}`}
              >
                <ShieldCheck size={16} />
                Compliance Audit Trail
              </Link>
              <Link
                to="/analytics"
                className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}
              >
                <BarChart3 size={16} />
                Disbursement Trends
              </Link>
            </>
          )}

          {!isAuthenticated && (
            <>
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                Home
              </Link>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register Student
              </Link>
            </>
          )}
        </div>

        {/* Right actions: Notifications & User profile */}
        {isAuthenticated && (
          <div className="nav-actions">
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications && unreadCount > 0) {
                    markAllRead();
                  }
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  color: 'var(--slate-700)',
                }}
                title="System Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      backgroundColor: 'var(--accent-rose-600)',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: '700',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div
                  style={{
                    position: 'absolute',
                    top: '48px',
                    right: '0',
                    width: '340px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-xl)',
                    zIndex: 100,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'var(--slate-50)',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--slate-800)' }}>
                      In-App Notifications
                    </span>
                    <button
                      onClick={markAllRead}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary-600)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCheck size={12} /> Mark read
                    </button>
                  </div>

                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border-subtle)',
                            backgroundColor: notif.isRead ? '#ffffff' : '#f0fdf4',
                            fontSize: '12.5px',
                          }}
                        >
                          <div style={{ fontWeight: '700', color: 'var(--slate-800)', marginBottom: '3px' }}>
                            {notif.title}
                          </div>
                          <div style={{ color: 'var(--slate-600)', lineHeight: '1.4' }}>
                            {notif.message}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '4px' }}>
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="user-profile-pill">
              <div className="user-avatar-circle">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="user-name-text">{user.name}</div>
                <div>{getRoleBadge(user.role)}</div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
