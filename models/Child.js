const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Child name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  birthDate: { 
    type: Date, 
    required: [true, 'Birth date is required'],
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Birth date cannot be in the future'
    }
  },
  gender: { 
    type: String, 
    enum: {
      values: ['male', 'female'],
      message: 'Gender must be either male or female'
    },
    required: [true, 'Gender is required']
  },
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  profileImage: {
    type: String
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Calculate age in months
childSchema.virtual('ageInMonths').get(function() {
  const today = new Date();
  const birth = new Date(this.birthDate);
  const ageInMs = today - birth;
  return Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 30.44));
});

// Ensure virtual fields are serialized
childSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Child', childSchema);