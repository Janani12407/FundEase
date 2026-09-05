import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fundease_super_secret_jwt_key_2026_academic_production');

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      return next();
    } catch (error) {
      console.error('[Auth Error]', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
    }
  }

  return res.status(401).json({ success: false, message: 'Not authorized, authorization token missing' });
};
