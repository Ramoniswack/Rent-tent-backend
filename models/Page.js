const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  metaDescription: {
    type: String,
    default: ''
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  pageType: {
    type: String,
    enum: ['home', 'about', 'contact', 'custom'],
    default: 'custom'
  },
  sections: [{
    type: {
      type: String,
      enum: ['hero', 'features', 'cta', 'text', 'image'],
      required: true
    },
    title: String,
    content: String,
    imageUrl: String,
    buttonText: String,
    buttonLink: String,
    order: Number
  }],
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
pageSchema.index({ slug: 1 });
pageSchema.index({ pageType: 1 });

module.exports = mongoose.model('Page', pageSchema);
