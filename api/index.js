const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const serverless = require('serverless-http');
require('dotenv').config();

require('../config/database');
const { apiLimiter } = require('../middleware/rateLimiter');
const errorHandler = require('../middleware/errorHandler');

const app = express();
app.set('trust proxy', 1);

// CORS
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [
          'capacitor://localhost',
          'http://localhost',
          'http://localhost:8100',
          'https://gizi-cerdas-fe.vercel.app'
        ]
      : [
          'capacitor://localhost',
          'http://localhost',
          'http://localhost:8100',
          'https://gizi-cerdas-fe.vercel.app'
        ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (limited in Vercel)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  maxAge: '1d',
  etag: true
}));

// Middleware
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/children', require('../routes/children'));
app.use('/api/growth-records', require('../routes/growth'));
app.use('/api/food-logs', require('../routes/food'));
app.use('/api/reminders', require('../routes/reminders'));
app.use('/api/education', require('../routes/education'));
app.use('/api/reports', require('../routes/reports'));
app.use('/api/dashboard', require('../routes/dashboard'));

app.get('/api', (req, res) => {
  res.json({
    name: 'GiziCerdas Backend API',
    version: '1.0.0',
    description: 'Backend API untuk aplikasi GiziCerdas',
    documentation: 'https://github.com/your-repo/gizicerdas-backend/blob/main/README.md',
    endpoints: {
      auth: '/api/auth',
      children: '/api/children',
      growth: '/api/growth-records',
      food: '/api/food-logs',
      reminders: '/api/reminders',
      education: '/api/education',
      reports: '/api/reports',
      health: '/health'
    }
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /health',
      'GET /api',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/children',
      'POST /api/children',
      'GET /api/education'
    ]
  });
});

// Create uploads folder
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const uploadSubdirs = ['profiles', 'food', 'growth'];
uploadSubdirs.forEach(subdir => {
  const subdirPath = path.join(uploadsDir, subdir);
  if (!fs.existsSync(subdirPath)) {
    fs.mkdirSync(subdirPath, { recursive: true });
  }
});

// Don't use app.listen in Vercel!
module.exports = serverless(app);
