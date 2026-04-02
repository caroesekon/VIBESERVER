const AdminUser = require('../../models/admin/AdminUser');
const { generateAccessToken } = require('../../utils/generateToken');
const bcrypt = require('bcryptjs');

// @desc    Admin login
// @route   POST /api/admin/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Admin login attempt:', { email, passwordProvided: !!password });
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    
    const admin = await AdminUser.findOne({ email });
    console.log('Admin found:', admin ? 'Yes' : 'No');
    
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    if (!admin.isActive) {
      return res.status(401).json({ success: false, message: 'Account disabled' });
    }
    
    admin.lastLogin = new Date();
    await admin.save();
    
    const token = generateAccessToken(admin._id);
    
    res.json({ 
      success: true, 
      data: { 
        token, 
        admin: { 
          _id: admin._id, 
          name: admin.name, 
          email: admin.email, 
          role: admin.role,
          avatar: admin.avatar
        } 
      } 
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin logout
// @route   POST /api/admin/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current admin
// @route   GET /api/admin/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.admin._id).select('-password');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    res.json({ 
      success: true, 
      data: admin 
    });
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  login,
  logout,
  getMe,
};