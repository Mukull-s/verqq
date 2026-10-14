require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedUser = async () => {
  try {
    // Never seed accounts in production (VRQ-004).
    if (process.env.NODE_ENV === 'production') {
      console.error('Refusing to seed accounts while NODE_ENV=production.');
      process.exit(1);
    }

    // Credentials come from the environment; never hardcode weak defaults (VRQ-004).
    const email = process.env.SEED_CANDIDATE_EMAIL || 'candidate@verq.com';
    const password = process.env.SEED_CANDIDATE_PASSWORD;
    if (!password || password.length < 8) {
      console.error('Set SEED_CANDIDATE_PASSWORD (min 8 chars) before seeding. No default is provided.');
      process.exit(1);
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/verq';
    console.log('Connecting to database:', mongoUri);

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log(`Candidate account already exists: ${email}`);
      process.exit(0);
    }

    console.log('Creating standard candidate account...');
    const candidate = await User.create({
      displayName: process.env.SEED_CANDIDATE_NAME || 'Aman Aziz',
      email: email,
      password,
      authMethod: 'jwt',
      isEmailVerified: true
    });

    console.log('--------------------------------------');
    console.log('Candidate Account Seeding Complete!');
    console.log(`Email: ${candidate.email}`);
    // Never log the password (VRQ-004).
    console.log('Password: [set from SEED_CANDIDATE_PASSWORD]');
    console.log('--------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedUser();
