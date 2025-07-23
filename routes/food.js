const express = require('express');
const FoodLog = require('../models/FoodLog');
const Child = require('../models/Child');
const { authenticate } = require('../middleware/Auth');
const upload = require('../config/multer');
const router = express.Router();

// Add food log
router.post('/', authenticate, upload.single('photo'), async (req, res) => {
  try {
    const { 
      childId, mealTime, foodName, portion, 
      calories, protein, carbs, fat, fiber, sugar, sodium, notes 
    } = req.body;
    
    // Verify child ownership
    const child = await Child.findOne({ _id: childId, parentId: req.user._id });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    const foodLog = new FoodLog({
      childId,
      mealTime,
      foodName,
      portion,
      calories: calories ? parseFloat(calories) : undefined,
      protein: protein ? parseFloat(protein) : undefined,
      carbs: carbs ? parseFloat(carbs) : undefined,
      fat: fat ? parseFloat(fat) : undefined,
      fiber: fiber ? parseFloat(fiber) : undefined,
      sugar: sugar ? parseFloat(sugar) : undefined,
      sodium: sodium ? parseFloat(sodium) : undefined,
      photo: req.file ? req.file.path : undefined,
      notes
    });
    
    await foodLog.save();
    res.status(201).json(foodLog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get food logs for a child
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
    
    const { date, mealTime, limit = 50, page = 1 } = req.query;
    let query = { childId: req.params.childId };
    
    // Filter by date
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.logDate = { $gte: startDate, $lt: endDate };
    }
    
    // Filter by meal time
    if (mealTime) {
      query.mealTime = mealTime;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const foodLogs = await FoodLog.find(query)
      .sort({ logDate: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await FoodLog.countDocuments(query);
    
    res.json({
      foodLogs,
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

// Get specific food log
router.get('/log/:logId', authenticate, async (req, res) => {
  try {
    const foodLog = await FoodLog.findById(req.params.logId)
      .populate('childId');
    
    if (!foodLog) {
      return res.status(404).json({ error: 'Food log not found' });
    }
    
    // Verify ownership
    if (foodLog.childId.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(foodLog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update food log
router.put('/:logId', authenticate, upload.single('photo'), async (req, res) => {
  try {
    const foodLog = await FoodLog.findById(req.params.logId)
      .populate('childId');
    
    if (!foodLog) {
      return res.status(404).json({ error: 'Food log not found' });
    }
    
    // Verify ownership
    if (foodLog.childId.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updateData = { ...req.body };
    
    // Handle numeric fields
    ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'].forEach(field => {
      if (updateData[field] !== undefined) {
        updateData[field] = parseFloat(updateData[field]) || 0;
      }
    });
    
    // Handle photo update
    if (req.file) {
      updateData.photo = req.file.path;
    }
    
    Object.assign(foodLog, updateData);
    await foodLog.save();
    
    res.json(foodLog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete food log
router.delete('/:logId', authenticate, async (req, res) => {
  try {
    const foodLog = await FoodLog.findById(req.params.logId)
      .populate('childId');
    
    if (!foodLog) {
      return res.status(404).json({ error: 'Food log not found' });
    }
    
    // Verify ownership
    if (foodLog.childId.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await FoodLog.findByIdAndDelete(req.params.logId);
    res.json({ message: 'Food log deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get daily nutrition summary
router.get('/summary/:childId/:date', authenticate, async (req, res) => {
  try {
    const { childId, date } = req.params;
    
    // Verify child ownership
    const child = await Child.findOne({ 
      _id: childId, 
      parentId: req.user._id 
    });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    
    const foodLogs = await FoodLog.find({
      childId,
      logDate: { $gte: startDate, $lt: endDate }
    });
    
    const summary = foodLogs.reduce((acc, log) => {
      acc.calories += log.calories || 0;
      acc.protein += log.protein || 0;
      acc.carbs += log.carbs || 0;
      acc.fat += log.fat || 0;
      acc.fiber += log.fiber || 0;
      acc.sugar += log.sugar || 0;
      acc.sodium += log.sodium || 0;
      return acc;
    }, { 
      calories: 0, protein: 0, carbs: 0, fat: 0, 
      fiber: 0, sugar: 0, sodium: 0 
    });
    
    // Group by meal time
    const mealBreakdown = {
      breakfast: { calories: 0, count: 0 },
      lunch: { calories: 0, count: 0 },
      dinner: { calories: 0, count: 0 },
      snack: { calories: 0, count: 0 }
    };
    
    foodLogs.forEach(log => {
      if (mealBreakdown[log.mealTime]) {
        mealBreakdown[log.mealTime].calories += log.calories || 0;
        mealBreakdown[log.mealTime].count++;
      }
    });
    
    res.json({
      date,
      summary,
      mealBreakdown,
      totalLogs: foodLogs.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get nutrition needs for child
router.get('/needs/:childId', authenticate, async (req, res) => {
  try {
    const child = await Child.findOne({ 
      _id: req.params.childId, 
      parentId: req.user._id 
    });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    const GrowthRecord = require('../models/GrowthRecord');
    const { 
      calculateAge, 
      calculateCalorieNeeds, 
      calculateProteinNeeds,
      getFoodRecommendations 
    } = require('../utils/calculations');
    
    const latestGrowth = await GrowthRecord.findOne({ childId: req.params.childId })
      .sort({ recordDate: -1 });
    
    if (!latestGrowth) {
      return res.status(404).json({ error: 'No growth records found' });
    }
    
    const ageInMonths = calculateAge(child.birthDate);
    const calorieNeeds = calculateCalorieNeeds(ageInMonths, child.gender, latestGrowth.weight);
    const proteinNeeds = calculateProteinNeeds(ageInMonths, latestGrowth.weight);
    const foodRecommendations = getFoodRecommendations(ageInMonths, calorieNeeds, proteinNeeds);
    
    res.json({
      childInfo: {
        name: child.name,
        ageInMonths,
        weight: latestGrowth.weight,
        height: latestGrowth.height,
        bmi: latestGrowth.bmi,
        nutritionStatus: latestGrowth.nutritionStatus
      },
      nutritionNeeds: {
        calories: Math.round(calorieNeeds),
        protein: proteinNeeds,
        carbs: Math.round(calorieNeeds * 0.6 / 4), // 60% of calories from carbs
        fat: Math.round(calorieNeeds * 0.25 / 9), // 25% of calories from fat
        fiber: ageInMonths < 12 ? 5 : Math.round(ageInMonths / 12 + 5), // Age + 5g rule
        water: ageInMonths < 12 ? 800 : Math.round(ageInMonths * 50) // ml per day
      },
      foodRecommendations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;