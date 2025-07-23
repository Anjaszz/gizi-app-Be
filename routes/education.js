const express = require('express');
const NutritionEducation = require('../models/NutritionEducation');
const { authenticate } = require('../middleware/Auth');
const router = express.Router();

// Get education articles
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      ageGroup, 
      search, 
      limit = 20, 
      page = 1,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    let query = { isPublished: true };
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Filter by age group
    if (ageGroup && ageGroup !== 'all') {
      query.ageGroup = { $in: [ageGroup, 'all'] };
    }
    
    // Search in title and content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const articles = await NutritionEducation.find(query)
      .select('title summary category ageGroup imageUrl author readTime views createdAt tags')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await NutritionEducation.countDocuments(query);
    
    res.json({
      articles,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get article by ID
router.get('/:articleId', async (req, res) => {
  try {
    const article = await NutritionEducation.findById(req.params.articleId);
    
    if (!article || !article.isPublished) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Increment view count
    article.views = (article.views || 0) + 1;
    await article.save();
    
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get related articles
router.get('/:articleId/related', async (req, res) => {
  try {
    const article = await NutritionEducation.findById(req.params.articleId);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    const relatedArticles = await NutritionEducation.find({
      _id: { $ne: req.params.articleId },
      $or: [
        { category: article.category },
        { ageGroup: article.ageGroup },
        { tags: { $in: article.tags } }
      ],
      isPublished: true
    })
    .select('title summary category ageGroup imageUrl readTime views')
    .limit(5)
    .sort({ views: -1 });
    
    res.json(relatedArticles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get categories with counts
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await NutritionEducation.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get popular articles
router.get('/meta/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const articles = await NutritionEducation.find({ isPublished: true })
      .select('title summary category ageGroup imageUrl views readTime')
      .sort({ views: -1 })
      .limit(parseInt(limit));
    
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent articles
router.get('/meta/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const articles = await NutritionEducation.find({ isPublished: true })
      .select('title summary category ageGroup imageUrl createdAt readTime')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Add new article (protected)
router.post('/', authenticate, async (req, res) => {
  try {
    // Add basic admin check (you can enhance this)
    if (!req.user.email.includes('admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const article = new NutritionEducation(req.body);
    await article.save();
    res.status(201).json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Update article
router.put('/:articleId', authenticate, async (req, res) => {
  try {
    if (!req.user.email.includes('admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const article = await NutritionEducation.findByIdAndUpdate(
      req.params.articleId,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Delete article
router.delete('/:articleId', authenticate, async (req, res) => {
  try {
    if (!req.user.email.includes('admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const article = await NutritionEducation.findByIdAndDelete(req.params.articleId);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;