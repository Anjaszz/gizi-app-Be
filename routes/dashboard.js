const express = require('express');
const Child = require('../models/Child');
const GrowthRecord = require('../models/GrowthRecord');
const FoodLog = require('../models/FoodLog');
const Reminder = require('../models/Reminder');
const { authenticate } = require('../middleware/Auth');
const { calculateAge, calculateCalorieNeeds, calculateProteinNeeds } = require('../utils/calculations');
const router = express.Router();

// Get dashboard quick stats for a child
router.get('/stats/:childId', authenticate, async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Verify child ownership
    const child = await Child.findOne({ 
      _id: childId, 
      parentId: req.user._id 
    });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Get current date and date ranges
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Parallel queries for better performance
    const [
      latestGrowth,
      todayFoodLogs,
      weekFoodLogs,
      monthFoodLogs,
      activeReminders,
      recentGrowthRecords,
      totalFoodLogs
    ] = await Promise.all([
      // Latest growth record
      GrowthRecord.findOne({ childId })
        .sort({ recordDate: -1 }),
      
      // Today's food logs
      FoodLog.find({
        childId,
        logDate: { $gte: startOfToday, $lt: endOfToday }
      }),
      
      // This week's food logs
      FoodLog.find({
        childId,
        logDate: { $gte: startOfWeek, $lt: endOfToday }
      }),
      
      // This month's food logs
      FoodLog.find({
        childId,
        logDate: { $gte: startOfMonth, $lt: endOfToday }
      }),
      
      // Active reminders
      Reminder.find({
        childId,
        isActive: true
      }),
      
      // Recent growth records (last 3 months)
      GrowthRecord.find({
        childId,
        recordDate: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      }).sort({ recordDate: -1 }).limit(10),
      
      // Total food logs count
      FoodLog.countDocuments({ childId })
    ]);

    // Calculate age and nutrition needs
    const ageInMonths = calculateAge(child.birthDate);
    const currentWeight = latestGrowth?.weight || 0;
    const targetCalories = latestGrowth ? calculateCalorieNeeds(ageInMonths, child.gender, currentWeight) : 0;
    const targetProtein = latestGrowth ? calculateProteinNeeds(ageInMonths, currentWeight) : 0;

    // Calculate today's nutrition
    const todayNutrition = todayFoodLogs.reduce((acc, log) => {
      acc.calories += log.calories || 0;
      acc.protein += log.protein || 0;
      acc.carbs += log.carbs || 0;
      acc.fat += log.fat || 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    // Calculate weekly average
    const weeklyNutrition = weekFoodLogs.reduce((acc, log) => {
      acc.calories += log.calories || 0;
      acc.protein += log.protein || 0;
      return acc;
    }, { calories: 0, protein: 0 });

    const daysThisWeek = Math.min(7, Math.ceil((today - startOfWeek) / (1000 * 60 * 60 * 24))) || 1;
    const avgWeeklyCalories = Math.round(weeklyNutrition.calories / daysThisWeek);
    const avgWeeklyProtein = Math.round(weeklyNutrition.protein / daysThisWeek);

    // Calculate compliance rates
    const calorieCompliance = targetCalories > 0 ? Math.min((todayNutrition.calories / targetCalories) * 100, 100) : 0;
    const proteinCompliance = targetProtein > 0 ? Math.min((todayNutrition.protein / targetProtein) * 100, 100) : 0;

    // Meal frequency today
    const mealFrequency = {
      breakfast: todayFoodLogs.filter(log => log.mealTime === 'breakfast').length,
      lunch: todayFoodLogs.filter(log => log.mealTime === 'lunch').length,
      dinner: todayFoodLogs.filter(log => log.mealTime === 'dinner').length,
      snack: todayFoodLogs.filter(log => log.mealTime === 'snack').length
    };

    // Growth trend (last 3 records)
    let growthTrend = 'stable';
    if (recentGrowthRecords.length >= 2) {
      const latest = recentGrowthRecords[0];
      const previous = recentGrowthRecords[1];
      
      if (latest.weight > previous.weight + 0.2) {
        growthTrend = 'increasing';
      } else if (latest.weight < previous.weight - 0.2) {
        growthTrend = 'decreasing';
      }
    }

    // Days since last growth record
    const daysSinceLastGrowth = latestGrowth 
      ? Math.floor((today - latestGrowth.recordDate) / (1000 * 60 * 60 * 24))
      : null;

    // Upcoming reminders (next 2 hours)
    const currentTime = today.getHours() * 60 + today.getMinutes();
    const upcomingReminders = activeReminders.filter(reminder => {
      const [hours, minutes] = reminder.time.split(':');
      const reminderTime = parseInt(hours) * 60 + parseInt(minutes);
      return reminderTime > currentTime && reminderTime <= currentTime + 120; // Next 2 hours
    });

    // Monthly tracking consistency
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysWithLogs = new Set(monthFoodLogs.map(log => 
      log.logDate.toISOString().split('T')[0]
    )).size;
    const trackingConsistency = Math.round((daysWithLogs / Math.min(daysInMonth, today.getDate())) * 100);

    // Response object
    const stats = {
      child: {
        id: child._id,
        name: child.name,
        ageInMonths,
        ageDisplay: getAgeDisplay(ageInMonths),
        profileImage: child.profileImage
      },
      
      growth: {
        current: latestGrowth ? {
          weight: latestGrowth.weight,
          height: latestGrowth.height,
          bmi: latestGrowth.bmi,
          nutritionStatus: latestGrowth.nutritionStatus,
          recordDate: latestGrowth.recordDate
        } : null,
        trend: growthTrend,
        daysSinceLastRecord: daysSinceLastGrowth,
        needsUpdate: daysSinceLastGrowth > 30, // Alert if no record for 30+ days
        totalRecords: recentGrowthRecords.length
      },
      
      nutrition: {
        today: {
          consumed: todayNutrition,
          targets: {
            calories: Math.round(targetCalories),
            protein: targetProtein
          },
          compliance: {
            calories: Math.round(calorieCompliance),
            protein: Math.round(proteinCompliance)
          },
          mealsLogged: todayFoodLogs.length,
          mealFrequency
        },
        weekly: {
          avgCalories: avgWeeklyCalories,
          avgProtein: avgWeeklyProtein,
          totalLogs: weekFoodLogs.length
        },
        monthly: {
          totalLogs: monthFoodLogs.length,
          trackingConsistency,
          daysWithLogs
        }
      },
      
      reminders: {
        total: activeReminders.length,
        upcoming: upcomingReminders.map(r => ({
          id: r._id,
          title: r.title,
          time: r.time,
          type: r.type
        })),
        nextReminder: getNextReminder(activeReminders)
      },
      
      summary: {
        totalFoodLogs,
        lastUpdated: today.toISOString(),
        overallStatus: getOverallStatus(calorieCompliance, proteinCompliance, trackingConsistency, daysSinceLastGrowth)
      }
    };

    res.json(stats);
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to format age display
function getAgeDisplay(ageInMonths) {
  if (ageInMonths < 12) {
    return `${ageInMonths} bulan`;
  } else {
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    if (months === 0) {
      return `${years} tahun`;
    } else {
      return `${years} tahun ${months} bulan`;
    }
  }
}

// Helper function to get next reminder
function getNextReminder(reminders) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  let nextReminder = null;
  let shortestTimeDiff = Infinity;
  
  reminders.forEach(reminder => {
    const [hours, minutes] = reminder.time.split(':');
    const reminderTime = parseInt(hours) * 60 + parseInt(minutes);
    
    let timeDiff = reminderTime - currentTime;
    if (timeDiff < 0) {
      timeDiff += 24 * 60; // Next day
    }
    
    if (timeDiff < shortestTimeDiff) {
      shortestTimeDiff = timeDiff;
      nextReminder = {
        id: reminder._id,
        title: reminder.title,
        time: reminder.time,
        type: reminder.type,
        hoursUntil: Math.floor(timeDiff / 60),
        minutesUntil: timeDiff % 60
      };
    }
  });
  
  return nextReminder;
}

// Helper function to determine overall status
function getOverallStatus(calorieCompliance, proteinCompliance, trackingConsistency, daysSinceLastGrowth) {
  const avgCompliance = (calorieCompliance + proteinCompliance) / 2;
  
  if (daysSinceLastGrowth > 60) {
    return {
      status: 'needs_attention',
      message: 'Perlu update data pertumbuhan',
      priority: 'high'
    };
  }
  
  if (avgCompliance >= 80 && trackingConsistency >= 80) {
    return {
      status: 'excellent',
      message: 'Tracking dan gizi sangat baik!',
      priority: 'low'
    };
  } else if (avgCompliance >= 60 && trackingConsistency >= 60) {
    return {
      status: 'good',
      message: 'Tracking dan gizi cukup baik',
      priority: 'low'
    };
  } else {
    return {
      status: 'needs_improvement',
      message: 'Perlu lebih konsisten dalam tracking',
      priority: 'medium'
    };
  }
}

// Get dashboard overview for all children
router.get('/overview', authenticate, async (req, res) => {
  try {
    const children = await Child.find({ parentId: req.user._id });
    
    const overviewData = await Promise.all(
      children.map(async (child) => {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfToday = new Date(startOfToday);
        endOfToday.setDate(endOfToday.getDate() + 1);
        
        const [latestGrowth, todayLogs, activeReminders] = await Promise.all([
          GrowthRecord.findOne({ childId: child._id }).sort({ recordDate: -1 }),
          FoodLog.countDocuments({
            childId: child._id,
            logDate: { $gte: startOfToday, $lt: endOfToday }
          }),
          Reminder.countDocuments({
            childId: child._id,
            isActive: true
          })
        ]);
        
        return {
          id: child._id,
          name: child.name,
          ageInMonths: calculateAge(child.birthDate),
          profileImage: child.profileImage,
          todayLogs,
          activeReminders,
          lastGrowthRecord: latestGrowth?.recordDate,
          nutritionStatus: latestGrowth?.nutritionStatus || 'unknown'
        };
      })
    );
    
    res.json({
      totalChildren: children.length,
      children: overviewData,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;