import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Building, Landmark, ShieldAlert } from 'lucide-react';

export const RoleSwitcherBar = () => {
  const { user, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const handleRoleSwitch = async (targetRole, targetPath) => {
    try {
      await switchDemoRole(targetRole);
      navigate(targetPath);
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  const currentRole = user?.role;

  return (
    <div className="role-switcher-container">
      <span className="role-switcher-label">Role Switcher</span>

      <button
        onClick={() => handleRoleSwitch('student', '/student')}
        className={`role-btn-chip ${currentRole === 'student' ? 'active' : ''}`}
        title="Switch to Student View (Aarav Sharma)"
      >
        <UserCheck size={14} />
        Student
      </button>

      <button
        onClick={() => handleRoleSwitch('institution_admin', '/admin')}
        className={`role-btn-chip ${currentRole === 'institution_admin' ? 'active' : ''}`}
        title="Switch to Institution Admin View (Dr. Vikram Seth)"
      >
        <Building size={14} />
        College Desk
      </button>

      <button
        onClick={() => handleRoleSwitch('scholarship_authority', '/authority')}
        className={`role-btn-chip ${currentRole === 'scholarship_authority' ? 'active' : ''}`}
        title="Switch to State Scholarship Authority View (Meera Krishnan)"
      >
        <Landmark size={14} />
        Authority Desk
      </button>

      <button
        onClick={() => handleRoleSwitch('auditor', '/auditor')}
        className={`role-btn-chip ${currentRole === 'auditor' ? 'active' : ''}`}
        title="Switch to Compliance Auditor View (Rajeshwar Rao)"
      >
        <ShieldAlert size={14} />
        Auditor
      </button>
    </div>
  );
};

export default RoleSwitcherBar;
