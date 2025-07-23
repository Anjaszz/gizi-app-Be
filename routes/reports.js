const express = require('express');
const Child = require('../models/Child');
const GrowthRecord = require('../models/GrowthRecord');
const FoodLog = require('../models/FoodLog');
const { authenticate } = require('../middleware/Auth');
const router = express.Router();

// Monthly progress report
router.get('/monthly/:childId/:year/:month', authenticate, async (req, res) => {
  try {
    const { childId, year, month } = req.params;
    
    // Verify child ownership
    const child = await Child.findOne({ 
      _id: childId, 
      parentId: req.user._id 
    });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    // Get growth records for the month
    const growthRecords = await GrowthRecord.find({
      childId,
      recordDate: { $gte: startDate, $lte: endDate }
    }).sort({ recordDate: 1 });
    
    // Get food logs for the month
    const foodLogs = await FoodLog.find({
      childId,
      logDate: { $gte: startDate, $lte: endDate }
    });
    
    // Calculate nutrition analytics
    const nutritionByDay = {};
    const mealsByType = {
      breakfast: 0, lunch: 0, dinner: 0, snack: 0
    };
    
    foodLogs.forEach(log => {
      const day = log.logDate.getDate();
      if (!nutritionByDay[day]) {
        nutritionByDay[day] = { 
          calories: 0, protein: 0, carbs: 0, fat: 0, 
          fiber: 0, sugar: 0, sodium: 0, meals: 0 
        };
      }
      nutritionByDay[day].calories += log.calories || 0;
      nutritionByDay[day].protein += log.protein || 0;
      nutritionByDay[day].carbs += log.carbs || 0;
      nutritionByDay[day].fat += log.fat || 0;
      nutritionByDay[day].fiber += log.fiber || 0;
      nutritionByDay[day].sugar += log.sugar || 0;
      nutritionByDay[day].sodium += log.sodium || 0;
      nutritionByDay[day].meals++;
      
      mealsByType[log.mealTime]++;
    });
    
    const daysWithLogs = Object.keys(nutritionByDay).length;
    const totalDays = endDate.getDate();
    
    // Calculate averages
    const avgNutrition = Object.values(nutritionByDay).reduce(
      (acc, day) => {
        acc.calories += day.calories;
        acc.protein += day.protein;
        acc.carbs += day.carbs;
        acc.fat += day.fat;
        acc.fiber += day.fiber;
        acc.sugar += day.sugar;
        acc.sodium += day.sodium;
        acc.meals += day.meals;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, meals: 0 }
    );
    
    if (daysWithLogs > 0) {
      Object.keys(avgNutrition).forEach(key => {
        avgNutrition[key] = Math.round(avgNutrition[key] / daysWithLogs);
      });
    }
    
    // Growth analysis
    const growthAnalysis = {
      recordsCount: growthRecords.length,
      weightChange: 0,
      heightChange: 0,
      bmiChange: 0
    };
    
    if (growthRecords.length >= 2) {
      const first = growthRecords[0];
      const last = growthRecords[growthRecords.length - 1];
      growthAnalysis.weightChange = +(last.weight - first.weight).toFixed(2);
      growthAnalysis.heightChange = +(last.height - first.height).toFixed(2);
      growthAnalysis.bmiChange = +(last.bmi - first.bmi).toFixed(2);
    }
    
    res.json({
      period: `${year}-${month.toString().padStart(2, '0')}`,
      childInfo: {
        name: child.name,
        ageInMonths: child.ageInMonths
      },
      growthRecords,
      growthAnalysis,
      avgDailyNutrition: avgNutrition,
      mealDistribution: mealsByType,
      totalFoodLogs: foodLogs.length,
      daysWithLogs,
      totalDays,
      complianceRate: Math.round((daysWithLogs / totalDays) * 100)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Weekly summary
router.get('/weekly/:childId/:year/:week', authenticate, async (req, res) => {
  try {
    const { childId, year, week } = req.params;
    
    // Verify child ownership
    const child = await Child.findOne({ 
      _id: childId, 
      parentId: req.user._id 
    });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    // Calculate week start/end dates
    const startDate = new Date(year, 0, 1 + (week - 1) * 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const foodLogs = await FoodLog.find({
      childId,
      logDate: { $gte: startDate, $lte: endDate }
    }).sort({ logDate: 1 });
    
    // Group by day
    const dailyData = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    foodLogs.forEach(log => {
      const dayName = dayNames[log.logDate.getDay()];
      if (!dailyData[dayName]) {
        dailyData[dayName] = {
          date: log.logDate.toISOString().split('T')[0],
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          mealCount: 0
        };
      }
      dailyData[dayName].calories += log.calories || 0;
      dailyData[dayName].protein += log.protein || 0;
      dailyData[dayName].carbs += log.carbs || 0;
      dailyData[dayName].fat += log.fat || 0;
      dailyData[dayName].mealCount++;
    });
    
    res.json({
      period: `Week ${week}, ${year}`,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dailyData,
      totalLogs: foodLogs.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Growth trend analysis
router.get('/growth-trend/:childId', authenticate, async (req, res) => {
  try {
    const { childId } = req.params;
    const { months = 12 } = req.query;
    
    // Verify child ownership
    const child = await Child.findOne({ 
      _id: childId, 
      parentId: req.user._id 
    });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    
    const growthRecords = await GrowthRecord.find({
      childId,
      recordDate: { $gte: startDate }
    }).sort({ recordDate: 1 });
    
    // Calculate trends
    const trends = {
      weight: { data: [], trend: 'stable' },
      height: { data: [], trend: 'stable' },
      bmi: { data: [], trend: 'stable' }
    };
    
    growthRecords.forEach(record => {
      const point = {
        date: record.recordDate,
        age: record.ageInMonths
      };
      
      trends.weight.data.push({ ...point, value: record.weight });
      trends.height.data.push({ ...point, value: record.height });
      trends.bmi.data.push({ ...point, value: record.bmi });
    });
    
    // Simple trend calculation
    if (growthRecords.length >= 2) {
      const first = growthRecords[0];
      const last = growthRecords[growthRecords.length - 1];
      
      trends.weight.trend = last.weight > first.weight ? 'increasing' : 
                           last.weight < first.weight ? 'decreasing' : 'stable';
      trends.height.trend = last.height > first.height ? 'increasing' : 
                           last.height < first.height ? 'decreasing' : 'stable';
      trends.bmi.trend = last.bmi > first.bmi ? 'increasing' : 
                        last.bmi < first.bmi ? 'decreasing' : 'stable';
    }
    
    res.json({
      childName: child.name,
      period: `${months} months`,
      recordsCount: growthRecords.length,
      trends
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Nutrition compliance report
router.get('/nutrition-compliance/:childId', authenticate, async (req, res) => {
  try {
    const { childId } = req.params;
    const { days = 30 } = req.query;
    
    // Verify child ownership
    const child = await Child.findOne({ 
      _id: childId, 
      parentId: req.user._id 
    });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const foodLogs = await FoodLog.find({
      childId,
      logDate: { $gte: startDate }
    });
    
    // Get nutrition needs
    const GrowthRecord = require('../models/GrowthRecord');
    const { 
      calculateAge, 
      calculateCalorieNeeds, 
      calculateProteinNeeds 
    } = require('../utils/calculations');
    
    const latestGrowth = await GrowthRecord.findOne({ childId })
      .sort({ recordDate: -1 });
    
    if (!latestGrowth) {
      return res.status(404).json({ error: 'No growth records found' });
    }
    
    const ageInMonths = calculateAge(child.birthDate);
    const targetCalories = calculateCalorieNeeds(ageInMonths, child.gender, latestGrowth.weight);
    const targetProtein = calculateProteinNeeds(ageInMonths, latestGrowth.weight);
    
    // Calculate daily compliance
    const dailyData = {};
    foodLogs.forEach(log => {
      const date = log.logDate.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { calories: 0, protein: 0, mealCount: 0 };
      }
      dailyData[date].calories += log.calories || 0;
      dailyData[date].protein += log.protein || 0;
      dailyData[date].mealCount++;
    });
    
    // Calculate compliance rates
    const compliance = {
      calorie: [],
      protein: [],
      mealFrequency: []
    };
    
    Object.entries(dailyData).forEach(([date, data]) => {
      const calorieCompliance = Math.min((data.calories / targetCalories) * 100, 100);
      const proteinCompliance = Math.min((data.protein / targetProtein) * 100, 100);
      const mealCompliance = Math.min((data.mealCount / 4) * 100, 100); // Target 4 meals/day
      
      compliance.calorie.push({ date, value: calorieCompliance });
      compliance.protein.push({ date, value: proteinCompliance });
      compliance.mealFrequency.push({ date, value: mealCompliance });
    });
    
    // Calculate averages
    const avgCompliance = {
      calorie: compliance.calorie.reduce((sum, item) => sum + item.value, 0) / compliance.calorie.length || 0,
      protein: compliance.protein.reduce((sum, item) => sum + item.value, 0) / compliance.protein.length || 0,
      mealFrequency: compliance.mealFrequency.reduce((sum, item) => sum + item.value, 0) / compliance.mealFrequency.length || 0
    };
    
    res.json({
      period: `${days} days`,
      targets: {
        calories: targetCalories,
        protein: targetProtein,
        meals: 4
      },
      compliance,
      averageCompliance: avgCompliance,
      daysTracked: Object.keys(dailyData).length,
      totalLogs: foodLogs.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export data for sharing with healthcare providers
router.get('/export/:childId', authenticate, async (req, res) => {
  try {
    const { childId } = req.params;
    const { startDate, endDate, format = 'json' } = req.query;
    
    // Verify child ownership
    const child = await Child.findOne({ 
      _id: childId, 
      parentId: req.user._id 
    });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default 3 months
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get all data
    const [growthRecords, foodLogs] = await Promise.all([
      GrowthRecord.find({
        childId,
        recordDate: { $gte: start, $lte: end }
      }).sort({ recordDate: 1 }),
      
      FoodLog.find({
        childId,
        logDate: { $gte: start, $lte: end }
      }).sort({ logDate: 1 })
    ]);
    
    const exportData = {
      child: {
        name: child.name,
        birthDate: child.birthDate,
        gender: child.gender,
        currentAge: child.ageInMonths
      },
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      growthRecords: growthRecords.map(record => ({
        date: record.recordDate,
        weight: record.weight,
        height: record.height,
        bmi: record.bmi,
        nutritionStatus: record.nutritionStatus,
        ageInMonths: record.ageInMonths
      })),
      nutritionLogs: foodLogs.map(log => ({
        date: log.logDate,
        mealTime: log.mealTime,
        foodName: log.foodName,
        portion: log.portion,
        calories: log.calories,
        protein: log.protein,
        carbs: log.carbs,
        fat: log.fat
      })),
      summary: {
        totalGrowthRecords: growthRecords.length,
        totalFoodLogs: foodLogs.length,
        avgCaloriesPerDay: foodLogs.reduce((sum, log) => sum + (log.calories || 0), 0) / Math.max(1, foodLogs.length),
        avgProteinPerDay: foodLogs.reduce((sum, log) => sum + (log.protein || 0), 0) / Math.max(1, foodLogs.length)
      },
      generatedAt: new Date().toISOString(),
      generatedBy: 'GiziCerdas App'
    };
    
    if (format === 'csv') {
      // Simple CSV export for growth data
      const csv = [
        'Date,Weight(kg),Height(cm),BMI,Status,Age(months)',
        ...growthRecords.map(r => 
          `${r.recordDate.toISOString().split('T')[0]},${r.weight},${r.height},${r.bmi},${r.nutritionStatus},${r.ageInMonths}`
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${child.name}_growth_data.csv"`);
      res.send(csv);
    } else {
      res.json(exportData);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;