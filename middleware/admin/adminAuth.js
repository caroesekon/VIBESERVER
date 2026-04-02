const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const AdminUser = require('../../models/admin/AdminUser');

const adminAuth = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer')) {
      token = authHeader.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Admin token missing' });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const admin = await AdminUser.findById(decoded.id).select('-password');
    
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin not found' });
    }
    
    if (!admin.isActive) {
      return res.status(401).json({ success: false, message: 'Admin account disabled' });
    }
    
    req.admin = admin;
    req.adminId = admin._id;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid admin token' });
  }
};

const superAdminAuth = async (req, res, next) => {
  await adminAuth(req, res, () => {
    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Super admin access required' });
    }
    next();
  });
};

module.exports = { adminAuth, superAdminAuth };