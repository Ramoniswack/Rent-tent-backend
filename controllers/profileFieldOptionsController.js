const ProfileFieldOptions = require('../models/ProfileFieldOptions');

// GET /api/profile-field-options - Get all profile field options (public)
exports.getAllOptions = async (req, res) => {
  try {
    const options = await ProfileFieldOptions.find().sort({ fieldType: 1 });
    
    // Transform to a more convenient format
    const result = {};
    options.forEach(option => {
      if (option.fieldType === 'bookingFeatures') {
        result[option.fieldType] = option.features || [];
      } else if (option.fieldType === 'footerProductMenu' || option.fieldType === 'footerCompanyMenu') {
        result[option.fieldType] = option.menuItems || [];
      } else {
        result[option.fieldType] = option.options;
      }
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/profile-field-options/:fieldType - Get specific field options (public)
exports.getOptionsByType = async (req, res) => {
  try {
    const { fieldType } = req.params;
    
    const options = await ProfileFieldOptions.findOne({ fieldType });
    
    if (!options) {
      return res.status(404).json({ error: 'Field type not found' });
    }
    
    res.json(options);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/admin/profile-field-options/:fieldType - Update field options (admin only)
exports.updateOptions = async (req, res) => {
  try {
    const { fieldType } = req.params;
    const { options, features, menuItems } = req.body;
    
    const updateData = {
      fieldType,
      lastModifiedBy: req.userId
    };
    
    if (fieldType === 'bookingFeatures') {
      if (!features || !Array.isArray(features)) {
        return res.status(400).json({ error: 'Features array is required for bookingFeatures' });
      }
      
      // Validate features structure
      const cleanedFeatures = features.filter(f => f && f.title && f.description && f.icon);
      
      if (cleanedFeatures.length === 0) {
        return res.status(400).json({ error: 'At least one valid feature is required' });
      }
      
      updateData.features = cleanedFeatures;
    } else if (fieldType === 'footerProductMenu' || fieldType === 'footerCompanyMenu') {
      if (!menuItems || !Array.isArray(menuItems)) {
        return res.status(400).json({ error: 'Menu items array is required for footer menus' });
      }
      
      // Validate menu items structure
      const cleanedMenuItems = menuItems.filter(item => item && item.label && item.url);
      
      if (cleanedMenuItems.length === 0) {
        return res.status(400).json({ error: 'At least one valid menu item is required' });
      }
      
      updateData.menuItems = cleanedMenuItems;
    } else {
      if (!options || !Array.isArray(options)) {
        return res.status(400).json({ error: 'Options array is required' });
      }
      
      // Remove duplicates and empty strings
      const cleanedOptions = [...new Set(options.filter(opt => opt && opt.trim()))];
      
      if (cleanedOptions.length === 0) {
        return res.status(400).json({ error: 'At least one option is required' });
      }
      
      updateData.options = cleanedOptions;
    }
    
    const updatedOptions = await ProfileFieldOptions.findOneAndUpdate(
      { fieldType },
      updateData,
      { new: true, upsert: true, runValidators: true }
    );
    
    res.json({ 
      message: 'Profile field options updated successfully', 
      options: updatedOptions 
    });
  } catch (error) {
    console.error('Error updating profile field options:', error);
    res.status(500).json({ error: error.message });
  }
};
