const jwt = require('jsonwebtoken');
const { User, USER_ROLES } = require('../models/User');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Access denied. Invalid token.' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Access denied. Invalid token.' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied. Not authenticated.' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        required: roles,
        current: req.user.role
      });
    }
    
    next();
  };
};

// Check if user can access based on role hierarchy
const canAccess = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied. Not authenticated.' });
    }
    
    if (!req.user.canAccess(requiredRole)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        required: requiredRole,
        current: req.user.role
      });
    }
    
    next();
  };
};

// Admin only middleware
const adminOnly = authorize(USER_ROLES.ADMIN);

// Moderator and above middleware
const moderatorOnly = canAccess(USER_ROLES.MODERATOR);

module.exports = {
  authenticate,
  authorize,
  canAccess,
  adminOnly,
  moderatorOnly
};
const mongoose = require('mongoose');