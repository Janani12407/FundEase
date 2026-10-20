import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const DEMO_CREDENTIALS = {
  student: { email: 'student@fundease.gov.in', password: 'Password@123' },
  institution_admin: { email: 'admin@apexcollege.edu.in', password: 'Password@123' },
  scholarship_authority: { email: 'authority@scholarship.gov.in', password: 'Password@123' },
  auditor: { email: 'auditor@compliance.gov.in', password: 'Password@123' },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('fundease_token') || null);
  const [loading, setLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      // H7: If user profile is already populated in state (e.g. from login/register), avoid redundant /api/auth/me
      if (user) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (res.ok && data.success && data.user) {
          setUser(data.user);
        } else if (res.status === 401) {
          logout();
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
        // H7: Do not wipe session on transient network error
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed.');
      }

      localStorage.setItem('fundease_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed.');
      }

      localStorage.setItem('fundease_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('fundease_token');
    setToken(null);
    setUser(null);
  };

  // One-click quick demo switcher
  const switchDemoRole = async (targetRole) => {
    const creds = DEMO_CREDENTIALS[targetRole];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchDemoRole,
        isAuthenticated: !!user,
        role: user?.role || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
