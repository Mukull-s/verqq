const Interview = require('../models/Interview');
const User = require('../models/User');

/**
 * Creates a new interview instance with extracted resume text and structured profile
 */
const createInterview = async (userId, jobRole, targetCompany, difficulty, resumeText, resumeProfile, interviewGoal, interviewType, roadmap) => {
  try {
    console.log('Creating interview for user:', userId);
    
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found:', userId);
      throw new Error('User not found');
    }

    const interview = new Interview({
      user: user._id,
      jobRole,
      targetCompany,
      difficulty,
      resumeText,
      resumeProfile,
      interviewGoal: interviewGoal || 'practice',
      interviewType: interviewType || 'fullstack',
      roadmap: roadmap || [],
      status: 'pending'
    });

    await interview.save();
    console.log('Interview created successfully:', interview._id);
    return interview;
  } catch (error) {
    console.error('Error in createInterview:', {
      userId,
      jobRole,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Gets all interviews for a user
 */
const getUserInterviews = async (userId) => {
  try {
    console.log('Fetching interviews for user:', userId);
    
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found:', userId);
      throw new Error('User not found');
    }
    
    const interviews = await Interview.find({ user: user._id })
      .sort({ createdAt: -1 })
      .exec();
    
    console.log(`Found ${interviews.length} interviews for user:`, userId);
    return interviews;
  } catch (error) {
    console.error('Error in getUserInterviews:', {
      userId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Updates interview status
 */
const updateInterviewStatus = async (interviewId, status) => {
  try {
    console.log('Updating interview status:', { interviewId, status });
    
    const interview = await Interview.findByIdAndUpdate(
      interviewId,
      { 
        status,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!interview) {
      console.error('Interview not found:', interviewId);
      throw new Error('Interview not found');
    }
    
    console.log('Interview status updated successfully:', interviewId);
    return interview;
  } catch (error) {
    console.error('Error in updateInterviewStatus:', {
      interviewId,
      status,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Adds a question and answer to the interview
 */
const addQuestionAnswer = async (interviewId, question, answer, evaluation) => {
  try {
    console.log('Adding question and answer to interview:', interviewId);
    
    const interview = await Interview.findByIdAndUpdate(
      interviewId,
      {
        $push: {
          questions: {
            question,
            answer,
            evaluation,
            timestamp: Date.now()
          }
        },
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!interview) {
      console.error('Interview not found:', interviewId);
      throw new Error('Interview not found');
    }
    
    console.log('Question and answer added successfully to interview:', interviewId);
    return interview;
  } catch (error) {
    console.error('Error in addQuestionAnswer:', {
      interviewId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Completes the interview and saves the overall evaluation
 */
const completeInterview = async (interviewId, overallEvaluation) => {
  try {
    console.log('Completing interview and saving overall evaluation:', interviewId);
    
    const interview = await Interview.findByIdAndUpdate(
      interviewId,
      {
        status: 'completed',
        overallEvaluation,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!interview) {
      console.error('Interview not found:', interviewId);
      throw new Error('Interview not found');
    }
    
    console.log('Interview completed successfully:', interviewId);
    return interview;
  } catch (error) {
    console.error('Error in completeInterview:', {
      interviewId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  createInterview,
  getUserInterviews,
  updateInterviewStatus,
  addQuestionAnswer,
  completeInterview
}; 