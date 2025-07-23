const express = require('express');
const Child = require('../models/Child');
const { authenticate } = require('../middleware/Auth');
const router = express.Router();

// Get all children for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const children = await Child.find({ parentId: req.user._id });
    res.json(children);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new child
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, birthDate, gender } = req.body;
    
    const child = new Child({
      name,
      birthDate,
      gender,
      parentId: req.user._id // Use authenticated user ID
    });
    
    await child.save();
    res.status(201).json(child);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get specific child (with ownership check)
router.get('/:childId', authenticate, async (req, res) => {
  try {
    const child = await Child.findOne({ 
      _id: req.params.childId, 
      parentId: req.user._id 
    });
    
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    res.json(child);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update child (NEW)
router.put('/:childId', authenticate, async (req, res) => {
  try {
    const { name, birthDate, gender } = req.body;
    
    const child = await Child.findOneAndUpdate(
      { _id: req.params.childId, parentId: req.user._id },
      { name, birthDate, gender },
      { new: true, runValidators: true }
    );
    
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    res.json(child);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete child (NEW)
router.delete('/:childId', authenticate, async (req, res) => {
  try {
    const child = await Child.findOneAndDelete({ 
      _id: req.params.childId, 
      parentId: req.user._id 
    });
    
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    // TODO: Also delete related records (growth, food logs, reminders)
    
    res.json({ message: 'Child deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;