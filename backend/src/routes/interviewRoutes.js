const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Interview = require('../models/Interview');
const { createInterview, getUserInterviews, updateInterviewStatus, addQuestionAnswer, completeInterview } = require('../services/interviewService');
const { processPDF, extractResumeProfile } = require('../services/pdfService');
const { generateInterviewQuestion, evaluateAnswer, generateFollowUpQuestion, generateOverallEvaluation, generateDynamicRoadmap } = require('../services/geminiService');
const { speechToText } = require('../services/deepgramService');
const multer = require('multer');

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

// Analyze resume for smart defaults
router.post('/analyze-resume', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    const resume = req.file;
    if (!resume) {
      return res.status(400).json({
        status: 'error',
        message: 'Resume PDF is required'
      });
    }

    console.log('[Analyze] Extracting resume text...');
    const resumeText = await processPDF(resume.buffer);
    
    console.log('[Analyze] Extracting structured resume profile...');
    const resumeProfile = await extractResumeProfile(resumeText);
    
    const skills = resumeProfile.skills || [];
    const experienceList = resumeProfile.experience || [];
    const projects = resumeProfile.projects || [];
    
    let years = 0.5;
    if (experienceList.length > 0) {
      years = experienceList.length * 1.5;
    }
    
    let recommendedDifficulty = 'placement';
    let recommendedGoal = 'placement_prep';
    let recommendedType = 'fullstack';
    let recommendedRole = 'Software Engineer';
    
    if (years >= 5) {
      recommendedDifficulty = 'expert';
      recommendedGoal = 'product_company';
    } else if (years >= 2) {
      recommendedDifficulty = 'professional';
      recommendedGoal = 'product_company';
    } else {
      recommendedDifficulty = 'placement';
      recommendedGoal = 'placement_prep';
    }
    
    const skillsText = skills.join(' ').toLowerCase();
    if (skillsText.includes('react') || skillsText.includes('css') || skillsText.includes('html') || skillsText.includes('frontend')) {
      if (skillsText.includes('node') || skillsText.includes('express') || skillsText.includes('sql') || skillsText.includes('mongodb')) {
        recommendedType = 'fullstack';
        recommendedRole = 'Full Stack Developer';
      } else {
        recommendedType = 'frontend';
        recommendedRole = 'Frontend Engineer';
      }
    } else if (skillsText.includes('node') || skillsText.includes('express') || skillsText.includes('sql') || skillsText.includes('django') || skillsText.includes('backend')) {
      recommendedType = 'backend';
      recommendedRole = 'Backend Engineer';
    } else if (skillsText.includes('data structure') || skillsText.includes('algorithm') || skillsText.includes('c++') || skillsText.includes('java')) {
      recommendedType = 'dsa';
      recommendedRole = 'Software Development Engineer';
    }
    
    const roadmap = generateDynamicRoadmap(recommendedType, skills);
    
    res.status(200).json({
      status: 'success',
      data: {
        resumeText,
        resumeProfile,
        recommendations: {
          experienceYears: years.toFixed(1),
          detectedSkills: skills,
          detectedProjects: projects.map(p => p.name),
          recommendedDifficulty,
          recommendedGoal,
          recommendedType,
          recommendedRole,
          roadmap
        }
      }
    });
  } catch (error) {
    console.error('Error in analyze-resume route:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to analyze resume'
    });
  }
});

// Start a new interview
router.post('/start', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    console.log('Starting new interview for user:', req.user._id);
    
    const { jobRole, targetCompany, difficulty, interviewGoal, interviewType } = req.body;
    let { resumeText, resumeProfile, roadmap } = req.body;
    const resumeFile = req.file;
    
    // Parse text/profile from body if sent as JSON string
    if (typeof resumeProfile === 'string') {
      try { resumeProfile = JSON.parse(resumeProfile); } catch (e) {}
    }
    if (typeof roadmap === 'string') {
      try { roadmap = JSON.parse(roadmap); } catch (e) {}
    }

    if (!resumeFile && (!resumeText || !resumeProfile)) {
      return res.status(400).json({
        status: 'error',
        message: 'Resume (PDF or structured text/profile) is required'
      });
    }

    if (!jobRole || !targetCompany || !difficulty) {
      return res.status(400).json({
        status: 'error',
        message: 'Job role, target company, and difficulty level are required'
      });
    }

    // Process PDF if file uploaded, else use submitted values
    if (resumeFile) {
      console.log('Processing PDF and extracting raw text...');
      resumeText = await processPDF(resumeFile.buffer);
      console.log('Generating structured resume profile...');
      resumeProfile = await extractResumeProfile(resumeText);
    }

    const type = interviewType || 'fullstack';
    const goal = interviewGoal || 'practice';
    
    // Generate dynamic roadmap if not provided
    if (!roadmap || roadmap.length === 0) {
      roadmap = generateDynamicRoadmap(type, resumeProfile.skills || []);
    }

    console.log('Creating interview entry in database...');
    const interview = await createInterview(
      req.user._id, 
      jobRole, 
      targetCompany, 
      difficulty, 
      resumeText, 
      resumeProfile,
      goal,
      type,
      roadmap
    );

    console.log('Generating first question...');
    const question = await generateInterviewQuestion(
      jobRole, 
      targetCompany, 
      difficulty, 
      resumeProfile, 
      [],
      goal,
      type,
      roadmap
    );

    console.log('Interview started successfully:', interview._id);
    res.status(201).json({
      status: 'success',
      data: {
        interviewId: interview._id,
        question,
        roadmap
      }
    });
  } catch (error) {
    console.error('Error in /start route:', {
      userId: req.user?._id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to start interview'
    });
  }
});

// Get interview details
router.get('/:interviewId', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching interview:', req.params.interviewId);
    
    const interview = await Interview.findById(req.params.interviewId);
    
    if (!interview) {
      console.error('Interview not found:', req.params.interviewId);
      return res.status(404).json({
        status: 'error',
        message: 'Interview not found'
      });
    }

    // Check if user owns the interview
    if (interview.user.toString() !== req.user._id.toString()) {
      console.error('Unauthorized access attempt:', {
        interviewId: req.params.interviewId,
        userId: req.user._id
      });
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access'
      });
    }

    console.log('Interview fetched successfully:', req.params.interviewId);
    res.status(200).json({
      status: 'success',
      data: interview
    });
  } catch (error) {
    console.error('Error in GET /:interviewId route:', {
      interviewId: req.params.interviewId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch interview'
    });
  }
});

// Submit answer and get next question
router.post('/:interviewId/answer', authMiddleware, upload.single('audio'), async (req, res) => {
  try {
    console.log('Processing answer for interview:', req.params.interviewId);
    
    const audio = req.file;
    const { currentQuestion } = req.body;
    
    if (!audio || !currentQuestion) {
      console.error('Missing required fields:', { hasAudio: !!audio, hasQuestion: !!currentQuestion });
      return res.status(400).json({
        status: 'error',
        message: 'Audio file and current question are required'
      });
    }

    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) {
      throw new Error('Interview not found');
    }

    console.log('Converting speech to text...');
    const transcript = await speechToText(audio.buffer);
    console.log('Transcript:', transcript);

    console.log('Evaluating answer...');
    const evaluation = await evaluateAnswer(currentQuestion, transcript);
    console.log('Evaluation result:', JSON.stringify(evaluation, null, 2));

    // Add question and answer to interview
    await addQuestionAnswer(
      req.params.interviewId,
      currentQuestion,
      transcript,
      evaluation
    );

    // Get the fresh record to check size
    const updatedInterview = await Interview.findById(req.params.interviewId);
    
    if (updatedInterview.questions.length >= 5) {
      console.log('Generating overall evaluation...');
      const overallEvaluation = await generateOverallEvaluation(
        updatedInterview.questions,
        updatedInterview.jobRole,
        updatedInterview.targetCompany
      );

      // Complete the interview with overall evaluation
      await completeInterview(req.params.interviewId, overallEvaluation);

      return res.status(200).json({
        status: 'success',
        data: {
          isComplete: true,
          evaluation,
          overallEvaluation
        }
      });
    }

    // Generate next question
    console.log('Generating next question...');
    const nextQuestion = await generateInterviewQuestion(
      updatedInterview.jobRole,
      updatedInterview.targetCompany,
      updatedInterview.difficulty,
      updatedInterview.resumeProfile,
      updatedInterview.questions,
      updatedInterview.interviewGoal,
      updatedInterview.interviewType,
      updatedInterview.roadmap
    );

    console.log('Answer processed successfully:', req.params.interviewId);
    res.status(200).json({
      status: 'success',
      data: {
        isComplete: false,
        nextQuestion,
        evaluation
      }
    });
  } catch (error) {
    console.error('Error in /:interviewId/answer route:', {
      interviewId: req.params.interviewId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to process answer'
    });
  }
});

// Generate follow-up question
router.post('/:interviewId/follow-up', authMiddleware, async (req, res) => {
  try {
    console.log('Generating follow-up question for interview:', req.params.interviewId);
    
    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) {
      console.error('Interview not found:', req.params.interviewId);
      return res.status(404).json({
        status: 'error',
        message: 'Interview not found'
      });
    }

    // Get the last question and answer
    const lastQA = interview.questions[interview.questions.length - 1];
    if (!lastQA) {
      const nextQuestion = await generateInterviewQuestion(
        interview.jobRole,
        interview.targetCompany,
        interview.difficulty,
        interview.resumeProfile,
        [],
        interview.interviewGoal,
        interview.interviewType,
        interview.roadmap
      );
      return res.status(200).json({
        status: 'success',
        data: { nextQuestion }
      });
    }

    // Generate follow-up question based on the last Q&A
    const nextQuestion = await generateFollowUpQuestion(
      lastQA.question,
      lastQA.answer,
      lastQA.evaluation,
      interview.jobRole,
      interview.targetCompany,
      interview.difficulty,
      interview.interviewGoal,
      interview.interviewType
    );

    console.log('Follow-up question generated successfully:', req.params.interviewId);
    res.status(200).json({
      status: 'success',
      data: { nextQuestion }
    });
  } catch (error) {
    console.error('Error in /:interviewId/follow-up route:', {
      interviewId: req.params.interviewId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to generate follow-up question'
    });
  }
});

// Get user's interviews
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching interviews for user:', req.user._id);
    
    const interviews = await getUserInterviews(req.user._id);
    
    console.log(`Found ${interviews.length} interviews for user:`, req.user._id);
    res.status(200).json({
      status: 'success',
      data: interviews
    });
  } catch (error) {
    console.error('Error in GET / route:', {
      userId: req.user._id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch interviews'
    });
  }
});

module.exports = router; 