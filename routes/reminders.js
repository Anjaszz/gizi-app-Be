const express = require('express');
const Reminder = require('../models/Reminder');
const Child = require('../models/Child');
const { authenticate } = require('../middleware/Auth');
const router = express.Router();

// Add reminder
router.post('/', authenticate, async (req, res) => {
  try {
    const { childId, type, title, description, time, days } = req.body;
    
    // Verify child ownership
    const child = await Child.findOne({ _id: childId, parentId: req.user._id });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    const reminder = new Reminder({
      childId,
      type,
      title,
      description,
      time,
      days: days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    });
    
    await reminder.save();
    res.status(201).json(reminder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get reminders for a child
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
    
    const { type, isActive } = req.query;
    let query = { childId: req.params.childId };
    
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const reminders = await Reminder.find(query)
      .sort({ time: 1 });
    
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all reminders for user
router.get('/', authenticate, async (req, res) => {
  try {
    const children = await Child.find({ parentId: req.user._id }).select('_id');
    const childIds = children.map(child => child._id);
    
    const { type, isActive } = req.query;
    let query = { childId: { $in: childIds } };
    
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const reminders = await Reminder.find(query)
      .populate('childId', 'name')
      .sort({ time: 1 });
    
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific reminder
router.get('/reminder/:reminderId', authenticate, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.reminderId)
      .populate('childId');
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    // Verify ownership
    if (reminder.childId.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update reminder
router.put('/:reminderId', authenticate, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.reminderId)
      .populate('childId');
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    // Verify ownership
    if (reminder.childId.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updateData = { ...req.body };
    Object.assign(reminder, updateData);
    
    await reminder.save();
    res.json(reminder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete reminder
router.delete('/:reminderId', authenticate, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.reminderId)
      .populate('childId');
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    // Verify ownership
    if (reminder.childId.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await Reminder.findByIdAndDelete(req.params.reminderId);
    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle reminder active status
router.patch('/:reminderId/toggle', authenticate, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.reminderId)
      .populate('childId');
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    // Verify ownership
    if (reminder.childId.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    reminder.isActive = !reminder.isActive;
    await reminder.save();
    
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark reminder as triggered
router.post('/:reminderId/trigger', authenticate, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.reminderId)
      .populate('childId');
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    // Verify ownership
    if (reminder.childId.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    reminder.lastTriggered = new Date();
    await reminder.save();
    
    res.json({ message: 'Reminder marked as triggered', reminder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;