const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Interview = require('../models/Interview');
const { createInterview, getUserInterviews, updateInterviewStatus, addQuestionAnswer, completeInterview } = require('../services/interviewService');
const { processPDF, extractResumeProfile } = require('../services/pdfService');
const { generateInterviewQuestion, evaluateAnswer, generateFollowUpQuestion, generateOverallEvaluation, generateDynamicRoadmap } = require('../services/geminiService');
const { speechToText } = require('../services/deepgramService');
const multer = require('multer');
const {
  isValidObjectId,
  isOwner,
  isPdfBuffer,
  normalizeResumeProfile,
  isClosedStatus
} = require('../utils/validation');
const { computeExperience, experienceLabel } = require('../utils/experience');


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

    if (!isPdfBuffer(resume.buffer)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid PDF file. Please upload a valid text-based PDF resume.'
      });
    }

    console.log('[Analyze] Extracting resume text...');
    const resumeText = await processPDF(resume.buffer);

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        status: 'error',
        message: 'Could not extract readable text from this PDF. If it is scanned or image-only, please upload a text-based PDF.'
      });
    }
    
    console.log('[Analyze] Extracting structured resume profile...');
    const resumeProfile = await extractResumeProfile(resumeText);
    
    const skills = resumeProfile.skills || [];
    const experienceList = resumeProfile.experience || [];
    const projects = resumeProfile.projects || [];

    // Real tenure from actual dates / durations — not a flat per-entry guess.
    // A fresher with one 2-month internship must NOT read as "1.5 yrs exp".
    const exp = computeExperience(experienceList);
    const totalYears = Math.round((exp.totalMonths / 12) * 10) / 10;

    let recommendedDifficulty = 'placement';
    let recommendedGoal = 'placement_prep';
    let recommendedType = 'fullstack';
    let recommendedRole = 'Software Engineer';

    // Difficulty tiers key off full-time professional years (internships excluded).
    if (exp.fullTimeYears >= 5) {
      recommendedDifficulty = 'expert';
      recommendedGoal = 'product_company';
    } else if (exp.fullTimeYears >= 2) {
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
          experienceYears: totalYears.toFixed(1),
          experienceLabel: experienceLabel(exp),
          internshipMonths: exp.internshipMonths,
          fullTimeYears: exp.fullTimeYears,
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
    
    const { jobRole, targetCompany, difficulty, interviewGoal, interviewType, duration } = req.body;
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
      if (!isPdfBuffer(resumeFile.buffer)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid PDF file. Please upload a valid text-based PDF resume.'
        });
      }
      console.log('Processing PDF and extracting raw text...');
      resumeText = await processPDF(resumeFile.buffer);
      if (!resumeText || resumeText.trim().length < 50) {
        return res.status(400).json({
          status: 'error',
          message: 'Could not extract readable text from this PDF. Please upload a text-based PDF.'
        });
      }
      console.log('Generating structured resume profile...');
      resumeProfile = await extractResumeProfile(resumeText);
    }

    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 50) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid resume text is required (at least 50 characters of readable text).'
      });
    }

    // Validate/normalize the profile shape; never trust the body blindly (VRQ-016).
    resumeProfile = normalizeResumeProfile(resumeProfile);
    if (!resumeProfile) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid resume profile. Please re-upload and analyze your resume.'
      });
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
      roadmap,
      duration
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
    await updateInterviewStatus(interview._id, 'in_progress');
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
    if (!isValidObjectId(req.params.interviewId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid interview ID' });
    }
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
    if (!isOwner(interview, req.user._id)) {
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
  let answerPersisted = false;
  try {
    if (!isValidObjectId(req.params.interviewId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid interview ID' });
    }
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
      return res.status(404).json({ status: 'error', message: 'Interview not found' });
    }

    if (!isOwner(interview, req.user._id)) {
      console.error('Unauthorized answer attempt:', { interviewId: req.params.interviewId, userId: req.user._id });
      return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
    }

    if (isClosedStatus(interview.status)) {
      return res.status(400).json({ status: 'error', message: `Interview is already ${interview.status}` });
    }

    console.log('Converting speech to text...');
    const mimetype = audio.mimetype || 'audio/webm';
    const transcript = await speechToText(audio.buffer, { mimetype });
    console.log('Transcript length:', (transcript || '').length);

    if (!transcript || transcript.trim().length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'No speech detected. Please record again and speak clearly.'
      });
    }

    console.log('Evaluating answer...');
    const evaluation = await evaluateAnswer(currentQuestion, transcript);
    // Log only non-PII summary, not the full evaluation/transcript (VRQ-023).
    console.log('Evaluation received. overallScore:', evaluation?.overallScore);

    // Add question and answer to interview
    await addQuestionAnswer(
      req.params.interviewId,
      currentQuestion,
      transcript,
      evaluation
    );
    answerPersisted = true;

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
    // Partial write: the answer was saved but the next step (next-Q or overall
    // eval) failed. Mark the interview `failed` so it is not silently stuck
    // mid-flow and a retry can be driven off status (VRQ-024).
    if (answerPersisted && isValidObjectId(req.params.interviewId)) {
      try {
        await updateInterviewStatus(req.params.interviewId, 'failed');
      } catch (markError) {
        console.error('Failed to mark interview as failed:', markError.message);
      }
    }
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to process answer'
    });
  }
});

// Generate follow-up question
router.post('/:interviewId/follow-up', authMiddleware, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.interviewId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid interview ID' });
    }
    console.log('Generating follow-up question for interview:', req.params.interviewId);
    
    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) {
      console.error('Interview not found:', req.params.interviewId);
      return res.status(404).json({
        status: 'error',
        message: 'Interview not found'
      });
    }

    if (!isOwner(interview, req.user._id)) {
      console.error('Unauthorized follow-up attempt:', { interviewId: req.params.interviewId, userId: req.user._id });
      return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
    }

    if (isClosedStatus(interview.status)) {
      return res.status(400).json({ status: 'error', message: `Interview is already ${interview.status}` });
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

// Get user's interviews (paginated)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const skip = req.query.skip || 0;
    const interviews = await getUserInterviews(req.user._id, { limit, skip });
    
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