const { callOpenRouter } = require('./openRouterService');

// Helper to get company style instruction
const getCompanyStyleInstruction = (company) => {
  switch (company?.toLowerCase()) {
    case 'google':
      return "Focus Style: Google standards. DSA Heavy, Optimization questions, Fast-paced, Deep follow-ups, Space/Time Big-O complexity.";
    case 'amazon':
      return "Focus Style: Amazon Standards. Inquire extensively about Leadership Principles (Ownership, Customer Obsession, Dive Deep) combined with technical scalability.";
    case 'cisco':
      return "Focus Style: Cisco Standards. Focus on Networking, Backend infrastructure, Protocols (TCP/IP, HTTP), APIs, and Communication clarity.";
    case 'flipkart':
      return "Focus Style: Flipkart Standards. Focus on Backend APIs, Real-world engineering system constraints, Caching, and high-concurrency scaling.";
    default:
      return `Focus Style: Fast-growing startup Tech Lead style at ${company || 'generic company'}. Focus on practical full-stack coding, pragmatic architectures, and fast feature delivery.`;
  }
};

// Helper to get goal style instruction
const getGoalStyleInstruction = (goal) => {
  switch (goal?.toLowerCase()) {
    case 'placement_prep':
      return "Interview Goal: Campus Placement Preparation. Heavily focus on Data Structures & Algorithms, Core CS fundamentals (OS, DBMS, OOPs), and standard problem-solving.";
    case 'internship':
      return "Interview Goal: Internship Assessment. Target fundamental coding concepts, learning capacity, project architecture interest, and baseline programming capability.";
    case 'product_company':
      return "Interview Goal: Product Company. Focus on real-world engineering problem solving, caching, database structures, APIs, scalability, and code cleanliness.";
    default:
      return "Interview Goal: Balanced Practice. Provide a healthy mix of DSA, backend implementation design, and standard technical queries.";
  }
};

// Helper to get difficulty level instructions
const getDifficultyInstruction = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'learning':
      return "Target the assessment at a beginner level. Ask about basic programming paradigms, simple code blocks, and introductory syntax.";
    case 'placement':
    case 'recommended':
      return "Target the assessment at a standard campus placement level. Focus on fundamental algorithms, data structures, and database keys.";
    case 'professional':
      return "Target the assessment at a professional software engineer level. Focus on scale issues, APIs design, query optimizations, and testing.";
    case 'expert':
      return "Target the assessment at an expert/senior level. Focus on advanced distributed system scaling, caching bottlenecks, concurrency issues, and system design.";
    default:
      return "Target the assessment at a professional engineering standard.";
  }
};

// Helper to generate dynamic 5-step roadmap
const generateDynamicRoadmap = (interviewType, skills = []) => {
  const primarySkills = skills.slice(0, 3).map(s => s.trim()).join(' & ') || 'Core Technologies';
  switch (interviewType?.toLowerCase()) {
    case 'backend':
      return ['Project Overview', 'Backend APIs', 'Database & Caching', 'System Design', 'Behavioral Fit'];
    case 'frontend':
      return ['Project Overview', 'React & DOM Architecture', 'State Management', 'Performance & UI Optimization', 'Behavioral Fit'];
    case 'fullstack':
      return ['Project Overview', 'Client-Server Communication', 'Backend Architecture', 'Database Scale', 'Behavioral Fit'];
    case 'dsa':
      return ['Warmup & Array/String', 'Linked List & Stack/Queue', 'Trees & Graphs', 'Dynamic Programming', 'Behavioral Fit'];
    case 'system_design':
      return ['Requirements & Core APIs', 'High Level Design', 'Scaling & Bottlenecks', 'Data Replication & Partitioning', 'Behavioral Fit'];
    case 'hr':
      return ['Icebreaker', 'Past Experiences', 'Conflict Resolution', 'Career Goals', 'Culture Fit'];
    default:
      return ['Project Discussion', `Frontend / Backend (${primarySkills})`, 'System Structure', 'Optimization', 'Behavioral Fit'];
  }
};

/**
 * Clean JSON output from potential markdown backticks
 */
const cleanJsonString = (text) => {
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.substring(7);
  } else if (clean.startsWith('```')) {
    clean = clean.substring(3);
  }
  if (clean.endsWith('```')) {
    clean = clean.substring(0, clean.length - 3);
  }
  return clean.trim();
};

/**
 * Generate an interview question based on resume, role, company, difficulty, goal, type, and history
 */
const generateInterviewQuestion = async (jobRole, targetCompany, difficulty, resumeProfile, history = [], interviewGoal = 'practice', interviewType = 'fullstack', roadmap = []) => {
  const companyInst = getCompanyStyleInstruction(targetCompany);
  const goalInst = getGoalStyleInstruction(interviewGoal);
  const diffInst = getDifficultyInstruction(difficulty);

  const roadmapStages = roadmap && roadmap.length > 0 ? roadmap : ['Project Discussion', 'Core Coding', 'Infrastructure', 'Scaling', 'Behavioral Fit'];
  const stage = roadmapStages[Math.min(history.length, roadmapStages.length - 1)];

  const resumeCtx = resumeProfile ? 
    `Candidate Profile:
- Skills: ${resumeProfile.skills?.join(', ') || 'Not specified'}
- Projects: ${JSON.stringify(resumeProfile.projects || [])}
- Experiences: ${JSON.stringify(resumeProfile.experience || [])}` : 
    'No resume profile available.';

  const historyCtx = history.length > 0 ? 
    `Conversation History:
${history.map((h, i) => `Q${i+1}: ${h.question}\nA${i+1}: ${h.answer}`).join('\n\n')}` : 
    'No history. This is the first question.';

  const prompt = `${companyInst}
${goalInst}
${diffInst}

Currently, we are in this dynamic interview stage: ${stage}.
Target Job Role: ${jobRole}
Interview Style Segment: ${interviewType}

${resumeCtx}

${historyCtx}

Based on this information, generate the next interview question.
RULES:
1. Make the question specific to the candidate's profile and matching the current stage (${stage}).
2. The question should be 2-3 sentences max.
3. Ask directly. Do not output intro templates.
4. Generate ONLY the question text itself.`;

  try {
    const messages = [{ role: 'user', content: prompt }];
    const responseText = await callOpenRouter(messages, false);
    return responseText.trim();
  } catch (error) {
    console.error('Error generating question via OpenRouter:', error);
    throw new Error(`Failed to generate question: ${error.message}`);
  }
};

/**
 * Evaluate an interview answer using Structured JSON Output
 */
const evaluateAnswer = async (question, answer) => {
  const prompt = `Evaluate the candidate's response to the interview question below.
  
Question: "${question}"
Candidate's Answer: "${answer}"

You must return a valid JSON object matching this schema structure:
{
  "clarity": {
    "score": 8, // Integer from 1 to 10
    "explanation": "Explanation text"
  },
  "technicalAccuracy": {
    "score": 7, // Integer from 1 to 10
    "explanation": "Explanation text"
  },
  "language": {
    "score": 9, // Integer from 1 to 10
    "explanation": "Explanation text"
  },
  "strengths": [
    "strength 1",
    "strength 2",
    "strength 3"
  ],
  "areasForImprovement": [
    "weakness 1",
    "weakness 2",
    "weakness 3"
  ],
  "recommendations": [
    "recommendation 1",
    "recommendation 2",
    "recommendation 3"
  ],
  "overallScore": 8 // Integer from 1 to 10
}

Ensure to output ONLY valid JSON. Do not write any explanation outside of the JSON block.`;

  try {
    const messages = [{ role: 'user', content: prompt }];
    const responseText = await callOpenRouter(messages, true);
    const cleanJson = cleanJsonString(responseText);
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Error evaluating answer via OpenRouter:', error);
    throw new Error(`Failed to evaluate answer: ${error.message}`);
  }
};

/**
 * Generate a follow-up question digging deeper into the last answer
 */
const generateFollowUpQuestion = async (previousQuestion, answer, evaluation, jobRole, targetCompany, difficulty, interviewGoal = 'practice', interviewType = 'fullstack') => {
  const companyInst = getCompanyStyleInstruction(targetCompany);
  const goalInst = getGoalStyleInstruction(interviewGoal);
  const diffInst = getDifficultyInstruction(difficulty);

  const prompt = `${companyInst}
${goalInst}
${diffInst}

The candidate just answered a question, and we want to drill down deeper into their response.
Previous Question: "${previousQuestion}"
Candidate's Answer: "${answer}"
Assessment: ${JSON.stringify(evaluation)}
Target Job Role: ${jobRole}
Interview Style Segment: ${interviewType}

Generate a direct follow-up question.
RULES:
1. Ask a question that forces the candidate to expand on details or handle an edge case of their last answer.
2. The question must be 2-3 sentences max.
3. Generate ONLY the question text itself.`;

  try {
    const messages = [{ role: 'user', content: prompt }];
    const responseText = await callOpenRouter(messages, false);
    return responseText.trim();
  } catch (error) {
    console.error('Error generating follow-up via OpenRouter:', error);
    throw new Error(`Failed to generate follow-up question: ${error.message}`);
  }
};

/**
 * Generate an overall final evaluation for the completed session
 */
const generateOverallEvaluation = async (questions, role, company = 'generic') => {
  const qaContext = questions.map((qa, index) => `
Q${index + 1}: ${qa.question}
A${index + 1}: ${qa.answer}
Evaluation: ${JSON.stringify(qa.evaluation)}
`).join('\n\n');

  const prompt = `You are a Principal Tech Recruiter evaluating a candidate for the position: ${role} at company ${company}.
Review the complete history of questions, answers, and mid-interview scores:

${qaContext}

Provide a deep, constructive overall assessment of the candidate. You must return a valid JSON object matching this schema structure:
{
  "technicalProficiency": {
    "score": 8, // 1-10
    "explanation": "Summary of technical strengths and depth"
  },
  "communicationSkills": {
    "score": 9, // 1-10
    "explanation": "Summary of articulation and syntax delivery"
  },
  "problemSolvingAbility": {
    "score": 7, // 1-10
    "explanation": "Summary of logic and scalability handling"
  },
  "companyFit": {
    "score": 8, // 1-10
    "explanation": "Summary of alignment with typical ${company} engineering focus and values"
  },
  "confidence": {
    "score": 9, // 1-10
    "explanation": "Summary of speaking delivery confidence"
  },
  "strengths": [
    "strength 1",
    "strength 2",
    "strength 3"
  ],
  "areasForGrowth": [
    "growth 1",
    "growth 2",
    "growth 3"
  ],
  "recommendations": [
    "suggestion 1",
    "suggestion 2",
    "suggestion 3"
  ],
  "hiringRecommendation": {
    "decision": "HIRE", // Must be exactly one of: 'STRONG HIRE', 'HIRE', 'CONSIDER', 'DO NOT HIRE'
    "justification": "2-3 sentences explaining this decision"
  },
  "mostImpressiveAnswer": "Specify which question number/concept the candidate answered most impressively and explain why.",
  "mostConcerningAnswer": "Specify which question number/concept had the most concerning technical or communication gap and explain why.",
  "nextFiveImprovements": [
    "Actionable step 1",
    "Actionable step 2",
    "Actionable step 3",
    "Actionable step 4",
    "Actionable step 5"
  ],
  "overallScore": 8 // 1-10
}

Ensure to output ONLY valid JSON. Do not write any explanation outside of the JSON block.`;

  try {
    const messages = [{ role: 'user', content: prompt }];
    const responseText = await callOpenRouter(messages, true);
    const cleanJson = cleanJsonString(responseText);
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Error generating overall evaluation via OpenRouter:', error);
    throw new Error(`Failed to generate overall evaluation: ${error.message}`);
  }
};

module.exports = {
  generateInterviewQuestion,
  evaluateAnswer,
  generateFollowUpQuestion,
  generateOverallEvaluation,
  generateDynamicRoadmap
};