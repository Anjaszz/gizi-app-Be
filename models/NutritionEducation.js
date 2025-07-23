const mongoose = require('mongoose');

const nutritionEducationSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: { 
    type: String, 
    required: [true, 'Content is required']
  },
  summary: {
    type: String,
    maxlength: [500, 'Summary cannot be more than 500 characters']
  },
  category: { 
    type: String, 
    required: [true, 'Category is required'],
    enum: {
      values: ['ASI dan Menyusui', 'MPASI', 'Gizi Seimbang', 'Tips Makan', 'Protein', 'Pencegahan Stunting', 'Vitamin Mineral', 'Camilan Sehat', 'Hidrasi', 'Pengukuran Gizi', 'Alergi Makanan', 'Obesitas'],
      message: 'Invalid category'
    }
  },
  ageGroup: { 
    type: String,
    enum: {
      values: ['0-6m', '6-12m', '1-2y', '2-5y', '5-12y', 'all'],
      message: 'Invalid age group'
    }
  },
  imageUrl: { 
    type: String 
  },
  author: {
    type: String,
    default: 'GiziCerdas Team'
  },
  readTime: {
    type: Number, // in minutes
    default: 5
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublished: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
nutritionEducationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('NutritionEducation', nutritionEducationSchema);