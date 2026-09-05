import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fundease_super_secret_jwt_key_2026_academic_production', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @route   POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, institution, phone, studentRollNumber, aadhaarNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    // Restrict staff roles registration in production if needed, but allow for demo/testing
    const userRole = role && ['student', 'institution_admin', 'scholarship_authority', 'auditor'].includes(role)
      ? role
      : 'student';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: userRole,
      institution: institution || 'Apex Institute of Technology',
      phone,
      studentRollNumber,
      aadhaarNumber,
    });

    const token = generateToken(user._id);

    // Audit log
    await AuditLog.create({
      action: 'USER_REGISTERED',
      performedBy: user._id,
      performedByName: user.name,
      performedByEmail: user.email,
      role: user.role,
      targetEntity: 'User',
      entityId: user._id.toString(),
      description: `New ${user.role} account registered for ${user.name} (${user.email}).`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact system admin.' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const unreadNotificationsCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      user,
      unreadNotificationsCount,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/auth/notifications
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/auth/notifications/read
export const markNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};
