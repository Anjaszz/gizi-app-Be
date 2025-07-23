const express = require('express');
const GrowthRecord = require('../models/GrowthRecord');
const Child = require('../models/Child');
const { authenticate } = require('../middleware/Auth');
const { calculateAge } = require('../utils/calculations');
const router = express.Router();

// Add growth record
router.post('/', authenticate, async (req, res) => {
  try {
    const { childId, weight, height, headCircumference, notes } = req.body;
    
    // Verify child ownership
    const child = await Child.findOne({ _id: childId, parentId: req.user._id });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    const ageInMonths = calculateAge(child.birthDate);
    
    const growthRecord = new GrowthRecord({
      childId,
      weight,
      height,
      ageInMonths,
      headCircumference,
      notes
    });
    
    await growthRecord.save();
    res.status(201).json(growthRecord);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get growth records for a child
router.get('/:childId', authenticate, async (req, res) => {
  try {
    // Verify child ownership
    const child = await Child.findOne({ 
      _id: req.params.childId, 
      parentId: req.user._id 
    });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    const { limit = 50, sort = 'desc' } = req.query;
    
    const records = await GrowthRecord.find({ childId: req.params.childId })
      .sort({ recordDate: sort === 'desc' ? -1 : 1 })
      .limit(parseInt(limit));
      
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific growth record
router.get('/record/:recordId', authenticate, async (req, res) => {
  try {
    const record = await GrowthRecord.findById(req.params.recordId)
      .populate('childId');
    
    if (!record) {
      return res.status(404).json({ error: 'Growth record not found' });
    }
    
    // Verify ownership
    if (record.childId.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update growth record
router.put('/:recordId', authenticate, async (req, res) => {
  try {
    const { weight, height, headCircumference, notes } = req.body;
    
    const record = await GrowthRecord.findById(req.params.recordId)
      .populate('childId');
    
    if (!record) {
      return res.status(404).json({ error: 'Growth record not found' });
    }
    
    // Verify ownership
    if (record.childId.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update fields
    if (weight !== undefined) record.weight = weight;
    if (height !== undefined) record.height = height;
    if (headCircumference !== undefined) record.headCircumference = headCircumference;
    if (notes !== undefined) record.notes = notes;
    
    await record.save();
    res.json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete growth record
router.delete('/:recordId', authenticate, async (req, res) => {
  try {
    const record = await GrowthRecord.findById(req.params.recordId)
      .populate('childId');
    
    if (!record) {
      return res.status(404).json({ error: 'Growth record not found' });
    }
    
    // Verify ownership
    if (record.childId.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await GrowthRecord.findByIdAndDelete(req.params.recordId);
    res.json({ message: 'Growth record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get growth chart data
router.get('/:childId/chart', authenticate, async (req, res) => {
  try {
    // Verify child ownership
    const child = await Child.findOne({ 
      _id: req.params.childId, 
      parentId: req.user._id 
    });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    const records = await GrowthRecord.find({ childId: req.params.childId })
      .sort({ recordDate: 1 })
      .select('weight height bmi recordDate ageInMonths');
    
    const chartData = records.map(record => ({
      date: record.recordDate,
      age: record.ageInMonths,
      weight: record.weight,
      height: record.height,
      bmi: record.bmi
    }));
    
    res.json(chartData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;