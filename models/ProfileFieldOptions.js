const mongoose = require('mongoose');

const profileFieldOptionsSchema = new mongoose.Schema({
  fieldType: {
    type: String,
    enum: ['travelStyles', 'interests', 'languages', 'gearCategories', 'gearConditions', 'bookingFeatures', 'footerProductMenu', 'footerCompanyMenu'],
    required: true,
    unique: true
  },
  options: [{
    type: String,
    required: true
  }],
  // For bookingFeatures, store structured data
  features: [{
    icon: String,
    title: String,
    description: String
  }],
  // For footer menus, store menu items with label and URL
  menuItems: [{
    label: String,
    url: String
  }],
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProfileFieldOptions', profileFieldOptionsSchema);
