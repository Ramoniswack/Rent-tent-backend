const SiteSettings = require('../models/SiteSettings');

// GET /api/site-settings - Get all site settings (public)
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await SiteSettings.find();
    
    // Transform to key-value format
    const result = {};
    settings.forEach(setting => {
      result[setting.settingKey] = setting.settingValue;
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/site-settings/:key - Get specific setting (public)
exports.getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await SiteSettings.findOne({ settingKey: key });
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ key: setting.settingKey, value: setting.settingValue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/admin/site-settings/:key - Update setting (admin only)
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }
    
    const updated = await SiteSettings.findOneAndUpdate(
      { settingKey: key },
      { 
        settingKey: key,
        settingValue: value,
        description: description || '',
        lastModifiedBy: req.userId 
      },
      { new: true, upsert: true, runValidators: true }
    );
    
    res.json({ 
      message: 'Setting updated successfully', 
      setting: updated 
    });
  } catch (error) {
    console.error('Error updating site setting:', error);
    res.status(500).json({ error: error.message });
  }
};
