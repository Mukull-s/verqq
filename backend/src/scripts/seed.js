require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedUser = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/verq';
    console.log('Connecting to database:', mongoUri);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    const email = 'candidate@verq.com';
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log(`Candidate account already exists: ${email}`);
      process.exit(0);
    }

    console.log('Creating standard candidate account...');
    const candidate = await User.create({
      displayName: 'Aman Aziz',
      email: email,
      password: 'password123',
      authMethod: 'jwt',
      isEmailVerified: true
    });

    console.log('--------------------------------------');
    console.log('Candidate Account Seeding Complete!');
    console.log(`Email: ${candidate.email}`);
    console.log('Password: password123');
    console.log('--------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedUser();
