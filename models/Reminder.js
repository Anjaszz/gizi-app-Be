const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  childId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Child', 
    required: true 
  },
  type: { 
    type: String, 
    enum: {
      values: ['meal', 'vitamin', 'checkup', 'medication', 'exercise'],
      message: 'Type must be meal, vitamin, checkup, medication, or exercise'
    },
    required: [true, 'Reminder type is required']
  },
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [300, 'Description cannot be more than 300 characters']
  },
  time: { 
    type: String, 
    required: [true, 'Time is required'],
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Time must be in HH:MM format'
    }
  },
  days: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastTriggered: {
    type: Date
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Reminder', reminderSchema);
