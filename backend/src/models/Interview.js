const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  // Reference to the user who created the interview
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Job role for the interview
  jobRole: {
    type: String,
    required: true
  },
  // Target Company
  targetCompany: {
    type: String,
    required: true
  },
  // Interview Goal ('placement_prep', 'internship', 'product_company', 'practice', 'custom')
  interviewGoal: {
    type: String,
    required: true,
    default: 'practice'
  },
  // Interview Type ('backend', 'frontend', 'fullstack', 'dsa', 'system_design', 'hr', 'custom')
  interviewType: {
    type: String,
    required: true,
    default: 'fullstack'
  },
  // Dynamic roadmap generated based on candidate's profile and type
  roadmap: [String],
  // Difficulty Level
  difficulty: {
    type: String,
    required: true
  },
  // Planned duration in minutes (optional, UI-only before fix)
  duration: {
    type: Number,
    default: 30,
    min: 15,
    max: 60
  },
  // Extracted resume text
  resumeText: {
    type: String,
    required: true
  },
  // Structured Resume Profile (RAG Index)
  resumeProfile: {
    skills: [String],
    projects: [{
      name: String,
      technologies: [String],
      summary: String
    }],
    experience: [{
      role: String,
      company: String,
      summary: String
    }]
  },
  // Status of the interview
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'failed'],
    default: 'pending'
  },
  // Questions and answers
  questions: [{
    question: String,
    answer: String,
    evaluation: {
      clarity: {
        score: Number,
        explanation: String
      },
      technicalAccuracy: {
        score: Number,
        explanation: String
      },
      language: {
        score: Number,
        explanation: String
      },
      strengths: [String],
      areasForImprovement: [String],
      recommendations: [String],
      overallScore: Number
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Final summary evaluation
  overallEvaluation: {
    technicalProficiency: {
      score: Number,
      explanation: String
    },
    communicationSkills: {
      score: Number,
      explanation: String
    },
    problemSolvingAbility: {
      score: Number,
      explanation: String
    },
    companyFit: {
      score: Number,
      explanation: String
    },
    confidence: {
      score: Number,
      explanation: String
    },
    strengths: [String],
    areasForGrowth: [String],
    recommendations: [String],
    hiringRecommendation: {
      decision: String,
      justification: String
    },
    mostImpressiveAnswer: String,
    mostConcerningAnswer: String,
    nextFiveImprovements: [String],
    overallScore: Number
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps
interviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
interviewSchema.index({ user: 1 });
interviewSchema.index({ status: 1 });

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview; 