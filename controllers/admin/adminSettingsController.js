const Settings = require('../../models/admin/Settings');

// @desc    Get all settings
// @route   GET /api/admin/settings
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.find();
    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json({ success: true, data: settingsMap });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get public settings (for frontend)
// @route   GET /api/settings/public
const getPublicSettings = async (req, res) => {
  try {
    const settings = await Settings.find();
    const publicSettings = {};
    settings.forEach(s => {
      publicSettings[s.key] = s.value;
    });
    res.json({ success: true, data: publicSettings });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update settings
// @route   PUT /api/admin/settings
const updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    
    for (const [group, groupSettings] of Object.entries(updates)) {
      for (const [key, value] of Object.entries(groupSettings)) {
        await Settings.findOneAndUpdate(
          { key },
          { key, value, group },
          { upsert: true, new: true }
        );
      }
    }
    
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single setting
// @route   GET /api/admin/settings/:key
const getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await Settings.findOne({ key });
    
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Setting not found' });
    }
    
    res.json({ success: true, data: { [setting.key]: setting.value } });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSettings,
  getPublicSettings,
  updateSettings,
  getSettingByKey,
};