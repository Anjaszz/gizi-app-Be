const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Child validation
const validateChild = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters'),
  body('birthDate')
    .isISO8601()
    .withMessage('Birth date must be a valid date')
    .custom(value => {
      if (new Date(value) > new Date()) {
        throw new Error('Birth date cannot be in the future');
      }
      return true;
    }),
  body('gender')
    .isIn(['male', 'female'])
    .withMessage('Gender must be either male or female'),
  handleValidationErrors
];

// Growth record validation
const validateGrowthRecord = [
  body('weight')
    .isFloat({ min: 0.5, max: 200 })
    .withMessage('Weight must be between 0.5 and 200 kg'),
  body('height')
    .isFloat({ min: 30, max: 250 })
    .withMessage('Height must be between 30 and 250 cm'),
  body('headCircumference')
    .optional()
    .isFloat({ min: 25, max: 70 })
    .withMessage('Head circumference must be between 25 and 70 cm'),
  handleValidationErrors
];

// Food log validation
const validateFoodLog = [
  body('mealTime')
    .isIn(['breakfast', 'lunch', 'dinner', 'snack'])
    .withMessage('Meal time must be breakfast, lunch, dinner, or snack'),
  body('foodName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Food name must be between 1 and 100 characters'),
  body('portion')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Portion must be between 1 and 50 characters'),
  body('calories')
    .optional()
    .isFloat({ min: 0, max: 5000 })
    .withMessage('Calories must be between 0 and 5000'),
  body('protein')
    .optional()
    .isFloat({ min: 0, max: 500 })
    .withMessage('Protein must be between 0 and 500g'),
  handleValidationErrors
];

// Reminder validation
const validateReminder = [
  body('type')
    .isIn(['meal', 'vitamin', 'checkup', 'medication', 'exercise'])
    .withMessage('Invalid reminder type'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in HH:MM format'),
  handleValidationErrors
];

// Auth validation
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
  handleValidationErrors
];

module.exports = {
  validateChild,
  validateGrowthRecord,
  validateFoodLog,
  validateReminder,
  validateRegister,
  validateLogin,
  validateObjectId,
  handleValidationErrors
};