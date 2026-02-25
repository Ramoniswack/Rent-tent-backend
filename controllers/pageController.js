const Page = require('../models/Page');

// GET /api/pages - Get all pages
exports.getAllPages = async (req, res) => {
  try {
    const pages = await Page.find()
      .populate('lastModifiedBy', 'name email')
      .sort({ updatedAt: -1 });
    
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/pages/:slug - Get page by slug
exports.getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // If user is authenticated and admin, return page regardless of publish status
    const isAdmin = req.user && req.user.isAdmin;
    const query = isAdmin ? { slug } : { slug, isPublished: true };
    
    const page = await Page.findOne(query);
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    res.json(page);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/pages - Create new page (admin only)
exports.createPage = async (req, res) => {
  try {
    const { slug, title, content, metaDescription, isPublished, pageType, sections } = req.body;
    
    // Check if slug already exists
    const existingPage = await Page.findOne({ slug });
    if (existingPage) {
      return res.status(400).json({ error: 'Page with this slug already exists' });
    }
    
    const page = new Page({
      slug,
      title,
      content,
      metaDescription,
      isPublished,
      pageType,
      sections,
      lastModifiedBy: req.userId
    });
    
    await page.save();
    
    const populatedPage = await Page.findById(page._id).populate('lastModifiedBy', 'name email');
    res.status(201).json(populatedPage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/pages/:id - Update page (admin only)
exports.updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, metaDescription, isPublished, sections } = req.body;
    
    const page = await Page.findById(id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    if (title) page.title = title;
    if (content !== undefined) page.content = content;
    if (metaDescription !== undefined) page.metaDescription = metaDescription;
    if (isPublished !== undefined) page.isPublished = isPublished;
    if (sections) page.sections = sections;
    page.lastModifiedBy = req.userId;
    
    await page.save();
    
    const updatedPage = await Page.findById(id).populate('lastModifiedBy', 'name email');
    res.json(updatedPage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/pages/:id - Delete page (admin only)
exports.deletePage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const page = await Page.findById(id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    await Page.findByIdAndDelete(id);
    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
