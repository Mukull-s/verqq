require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const interviewRoutes = require('./routes/interviewRoutes');

const app = express();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and audio files are allowed.'));
    }
  }
});

// Security middleware
app.use(helmet()); // Adds various HTTP headers for security
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:5174', 'https://verqai.vercel.app', 'https://verq-ai.vercel.app'];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    // In development mode, allow localhost origins
    if (process.env.NODE_ENV === 'development' && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      return callback(null, true);
    }
    return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-type', 'Access-Control-Allow-Origin', 'Access-Control-Allow-Headers', 'Access-Control-Allow-Methods'],
  exposedHeaders: ['Content-Type', 'Authorization', 'x-auth-type'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging middleware
app.use(morgan('dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/interview', interviewRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle specific error types
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      status: 'error',
      message: err.message || 'File upload error'
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      errors: err.errors
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/verq';
    console.log('Connecting to MongoDB Atlas cluster...');
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB Atlas successfully.');
  } catch (err) {
    console.error('\n======================================================');
    console.error('MongoDB Atlas Connection Failed!');
    console.error('Reason:', err.message);
    console.error('------------------------------------------------------');
    console.error('To fix this, please whitelist your IP in MongoDB Atlas:');
    console.error('1. Go to https://cloud.mongodb.com/');
    console.error('2. Navigate to Network Access -> Add IP Address');
    console.error('3. Click "Allow Access from Anywhere" (0.0.0.0/0) or "Add Current IP Address"');
    console.error('======================================================\n');
    process.exit(1);
  }
};

// Auto-seeding helper
const seedDefaultCandidate = async () => {
  try {
    const User = require('./models/User');
    const email = 'candidate@verq.com';
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      console.log('No candidate user found. Seeding default candidate account...');
      await User.create({
        displayName: 'Aman Aziz',
        email: email,
        password: 'password123',
        authMethod: 'jwt',
        isEmailVerified: true
      });
      console.log('----------------------------------------------------');
      console.log('Default Candidate User Seeded Successfully!');
      console.log('Email: candidate@verq.com');
      console.log('Password: password123');
      console.log('----------------------------------------------------');
    } else {
      console.log('Candidate user already exists in database.');
    }
  } catch (err) {
    console.error('Failed to seed default candidate:', err.message);
  }
};

// Start server
const PORT = process.env.PORT || 3000;
const startServer = async () => {
  try {
    await connectDB();
    await seedDefaultCandidate();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
}); 