// server.js - GiziCerdas Backend Entry Point
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import database connection
require('./config/database');

// Import middleware
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Initialize Express app
const app = express();

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // Define allowed origins based on environment
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [
           'capacitor://localhost',
           'http://localhost',
           'http://localhost:8100',
           'https://gizi-cerdas-fe.vercel.app',
           'http://192.168.25.238:8100'
        ]
      : [
        'capacitor://localhost',
        'http://localhost',
        'http://localhost:8100',
        'https://gizi-cerdas-fe.vercel.app',
        'http://192.168.25.238:8100'
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

// Apply middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d', // Cache images for 1 day
  etag: true
}));

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/children', require('./routes/children'));
app.use('/api/growth-records', require('./routes/growth'));
app.use('/api/food-logs', require('./routes/food'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/education', require('./routes/education'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));

// API Documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'GiziCerdas Backend API',
    version: '1.0.0',
    description: 'Backend API untuk aplikasi GiziCerdas - Kalkulator Gizi Harian Anak',
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
    },
    contact: {
      developer: 'GiziCerdas Team',
      email: 'dev@gizicerdas.com',
      support: 'support@gizicerdas.com'
    }
  });
});

// 404 handler for undefined routes
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



// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Create subdirectories for better organization
const uploadSubdirs = ['profiles', 'food', 'growth'];
uploadSubdirs.forEach(subdir => {
  const subdirPath = path.join(uploadsDir, subdir);
  if (!fs.existsSync(subdirPath)) {
    fs.mkdirSync(subdirPath, { recursive: true });
    console.log(`📁 Created uploads/${subdir} directory`);
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log('🚀 Server started successfully!');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api`);
  console.log(`📁 Uploads: http://localhost:${PORT}/uploads`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode features:');
    console.log('   - CORS allows localhost origins');
    console.log('   - Detailed error messages');
    console.log('   - File watching with nodemon');
  }
  
  console.log('✅ GiziCerdas Backend is ready to serve! 🍎👶');
});

// Export server instance for testing
module.exports = server;