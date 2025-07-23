const mongoose = require('mongoose');

const foodLogSchema = new mongoose.Schema({
  childId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Child', 
    required: true 
  },
  mealTime: { 
    type: String, 
    enum: {
      values: ['breakfast', 'lunch', 'dinner', 'snack'],
      message: 'Meal time must be breakfast, lunch, dinner, or snack'
    },
    required: [true, 'Meal time is required']
  },
  foodName: { 
    type: String, 
    required: [true, 'Food name is required'],
    trim: true,
    maxlength: [100, 'Food name cannot be more than 100 characters']
  },
  portion: { 
    type: String, 
    required: [true, 'Portion is required'],
    maxlength: [50, 'Portion description cannot be more than 50 characters']
  },
  calories: { 
    type: Number,
    min: [0, 'Calories cannot be negative'],
    max: [5000, 'Calories cannot exceed 5000']
  },
  protein: { 
    type: Number,
    min: [0, 'Protein cannot be negative'],
    max: [500, 'Protein cannot exceed 500g']
  },
  carbs: { 
    type: Number,
    min: [0, 'Carbs cannot be negative'],
    max: [1000, 'Carbs cannot exceed 1000g']
  },
  fat: { 
    type: Number,
    min: [0, 'Fat cannot be negative'],
    max: [500, 'Fat cannot exceed 500g']
  },
  fiber: {
    type: Number,
    min: [0, 'Fiber cannot be negative'],
    max: [100, 'Fiber cannot exceed 100g']
  },
  sugar: {
    type: Number,
    min: [0, 'Sugar cannot be negative'],
    max: [200, 'Sugar cannot exceed 200g']
  },
  sodium: {
    type: Number,
    min: [0, 'Sodium cannot be negative'],
    max: [10000, 'Sodium cannot exceed 10000mg']
  },
  photo: { 
    type: String 
  },
  notes: {
    type: String,
    maxlength: [200, 'Notes cannot be more than 200 characters']
  },
  logDate: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('FoodLog', foodLogSchema);