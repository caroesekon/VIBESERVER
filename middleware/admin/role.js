const protectSuperAdmin = (req, res, next) => {
  if (req.admin && req.admin.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Superadmin privileges required' });
  }
};

module.exports = { protectAdmin, protectSuperAdmin };