const mongoose = require('mongoose');

const growthRecordSchema = new mongoose.Schema({
  childId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Child', 
    required: true 
  },
  weight: { 
    type: Number, 
    required: [true, 'Weight is required'],
    min: [0.5, 'Weight must be at least 0.5 kg'],
    max: [200, 'Weight cannot exceed 200 kg']
  },
  height: { 
    type: Number, 
    required: [true, 'Height is required'],
    min: [30, 'Height must be at least 30 cm'],
    max: [250, 'Height cannot exceed 250 cm']
  },
  ageInMonths: { 
    type: Number, 
    required: true 
  },
  bmi: { 
    type: Number 
  },
  nutritionStatus: { 
    type: String,
    enum: ['severely_underweight', 'underweight', 'normal', 'overweight', 'obese']
  },
  headCircumference: {
    type: Number,
    min: [25, 'Head circumference must be at least 25 cm'],
    max: [70, 'Head circumference cannot exceed 70 cm']
  },
  notes: {
    type: String,
    maxlength: [300, 'Notes cannot be more than 300 characters']
  },
  recordDate: { 
    type: Date, 
    default: Date.now 
  }
});

// Pre-save middleware to calculate BMI and nutrition status
growthRecordSchema.pre('save', function(next) {
  // Calculate BMI
  const heightInM = this.height / 100;
  this.bmi = parseFloat((this.weight / (heightInM * heightInM)).toFixed(2));
  
  // Determine nutrition status based on BMI for children
  if (this.bmi < 16) {
    this.nutritionStatus = 'severely_underweight';
  } else if (this.bmi < 17) {
    this.nutritionStatus = 'underweight';
  } else if (this.bmi < 25) {
    this.nutritionStatus = 'normal';
  } else if (this.bmi < 30) {
    this.nutritionStatus = 'overweight';
  } else {
    this.nutritionStatus = 'obese';
  }
  
  next();
});

module.exports = mongoose.model('GrowthRecord', growthRecordSchema);