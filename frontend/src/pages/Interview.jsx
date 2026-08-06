import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CompanyCombobox } from '../components/CompanyCombobox';
import { ResumeUploader } from '../components/ResumeUploader';
import { useNotification } from '../contexts/NotificationContext';

const INTERVIEW_GOALS = [
  { id: 'placement_prep', title: 'Placement Preparation ⭐', desc: 'Focus heavily on Data Structures, Algorithms, and Core Computer Science fundamentals.' },
  { id: 'internship', title: 'Internship Ready', desc: 'Target foundational coding standards, project structures, and quick-learning potential.' },
  { id: 'product_company', title: 'Product Company', desc: 'Focus on production backend/frontend design patterns, API paradigms, and system design.' },
  { id: 'practice', title: 'Balanced Practice', desc: 'Provides a healthy, balanced mix of DSA, project building, and behavioral fit questions.' }
];

const INTERVIEW_TYPES = [
  { id: 'fullstack', name: 'Full Stack Development' },
  { id: 'backend', name: 'Backend Engineering' },
  { id: 'frontend', name: 'Frontend Engineering' },
  { id: 'dsa', name: 'Data Structures & Algorithms' },
  { id: 'system_design', name: 'System Design' },
  { id: 'hr', name: 'HR & Culture Fit' }
];

const DIFFICULTY_TIERS = [
  { id: 'learning', title: '🌱 Learning', desc: 'First practice interview. Friendly pacing, basic paradigms.' },
  { id: 'placement', title: '📘 Campus Placement ⭐ Recommended', desc: 'Typical placement questions. Standard algorithms & database keys.' },
  { id: 'professional', title: '💼 Professional', desc: 'Standard product company interview. Focus on scaling bottlenecks & clean architecture.' },
  { id: 'expert', title: '🚀 Expert', desc: 'Senior candidate challenge. Complex distributed systems & deep follow-ups.' }
];

function Interview() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();

  // Step state
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Resume states
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeProfile, setResumeProfile] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  // Setup Form states
  const [targetCompany, setTargetCompany] = useState('Google');
  const [jobRole, setJobRole] = useState('Software Engineer');
  const [interviewGoal, setInterviewGoal] = useState('practice');
  const [interviewType, setInterviewType] = useState('fullstack');
  const [difficulty, setDifficulty] = useState('placement');
  const [duration, setDuration] = useState(30);
  const [focusAreas, setFocusAreas] = useState([]);

  // Load saved setup on mount
  useEffect(() => {
    const savedSetup = localStorage.getItem('interviewSetupCache');
    if (savedSetup) {
      try {
        const cache = JSON.parse(savedSetup);
        if (cache.targetCompany) setTargetCompany(cache.targetCompany);
        if (cache.jobRole) setJobRole(cache.jobRole);
        if (cache.interviewGoal) setInterviewGoal(cache.interviewGoal);
        if (cache.interviewType) setInterviewType(cache.interviewType);
        if (cache.difficulty) setDifficulty(cache.difficulty);
        if (cache.duration) setDuration(cache.duration);
      } catch (e) {
        console.error('Error loading setup cache:', e);
      }
    }
  }, []);

  // Save setup to cache on change
  useEffect(() => {
    const setup = { targetCompany, jobRole, interviewGoal, interviewType, difficulty, duration };
    localStorage.setItem('interviewSetupCache', JSON.stringify(setup));
  }, [targetCompany, jobRole, interviewGoal, interviewType, difficulty, duration]);

  const handleResumeSuccess = (file, responseData) => {
    setResumeFile(file);
    setResumeText(responseData.resumeText);
    setResumeProfile(responseData.resumeProfile);
    
    const recs = responseData.recommendations;
    setRecommendations(recs);

    // Apply Smart Defaults recommended by AI
    if (recs) {
      if (recs.recommendedRole) setJobRole(recs.recommendedRole);
      if (recs.recommendedDifficulty) setDifficulty(recs.recommendedDifficulty);
      if (recs.recommendedGoal) setInterviewGoal(recs.recommendedGoal);
      if (recs.recommendedType) setInterviewType(recs.recommendedType);
      
      // Focus areas based on Dynamic Roadmap
      if (recs.roadmap) setFocusAreas(recs.roadmap.slice(1, 4));
    }
  };

  const handleClearResume = () => {
    setResumeFile(null);
    setResumeText('');
    setResumeProfile(null);
    setRecommendations(null);
    setStep(1);
  };

  const handleStartInterview = async () => {
    if (!resumeText || !resumeProfile) {
      showError('Please upload and analyze your resume first');
      setStep(1);
      return;
    }

    if (!jobRole) {
      showError('Please specify your target job role');
      setStep(2);
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        jobRole,
        targetCompany,
        difficulty,
        interviewGoal,
        interviewType,
        resumeText,
        resumeProfile,
        roadmap: recommendations?.roadmap || []
      };

      const response = await api.createInterview(payload);
      
      if (response.status === 'success' && response.data && response.data.interviewId) {
        showSuccess('Starting interview session...');
        localStorage.setItem('currentInterview', JSON.stringify({
          id: response.data.interviewId,
          question: response.data.question
        }));
        
        navigate(`/interview/session/${response.data.interviewId}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error starting interview:', err);
      showError(err.message || 'Failed to start interview');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 px-4 sm:px-8 bg-[#09090B] pb-16 text-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Step Tracker Indicator */}
        <div className="flex items-center justify-between max-w-xs mx-auto mb-8 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          <span className={step >= 1 ? 'text-zinc-200 font-semibold' : 'text-zinc-600'}>1. Resume</span>
          <span className="text-zinc-800">•</span>
          <span className={step >= 2 ? 'text-zinc-200 font-semibold' : 'text-zinc-600'}>2. Target</span>
          <span className="text-zinc-800">•</span>
          <span className={step >= 3 ? 'text-zinc-200 font-semibold' : 'text-zinc-600'}>3. Settings</span>
          <span className="text-zinc-800">•</span>
          <span className={step >= 4 ? 'text-zinc-200 font-semibold' : 'text-zinc-600'}>4. Launch</span>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full max-w-xs mx-auto h-1 bg-zinc-900 rounded-full mb-12 overflow-hidden flex">
          <div className={`h-full bg-zinc-400 rounded-full transition-all duration-300 ${
            step === 1 ? 'w-1/4' : step === 2 ? 'w-2/4' : step === 3 ? 'w-3/4' : 'w-full'
          }`}></div>
        </div>

        {/* Step 1: Upload Resume */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">Upload Your Profile</h1>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                We extract details from your resume to align the interview goals and questions with your real-world stack.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <ResumeUploader 
                onUploadSuccess={handleResumeSuccess} 
                onClear={handleClearResume}
                initialFileName={resumeFile ? resumeFile.name : ''}
              />
            </div>

            {/* Smart analysis output if uploaded */}
            {recommendations && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto rounded-lg border border-zinc-900 bg-[#0C0C0E]/50 p-6 space-y-5"
              >
                <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
                  <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-400">Analysis Summary</h3>
                  <span className="text-[10px] px-2.5 py-0.5 font-semibold rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                    {recommendations.experienceYears} Years Exp
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="text-zinc-500 block mb-1 text-[10px] uppercase tracking-wider font-semibold">Primary Stack</span>
                    <span className="text-zinc-200 font-medium">{recommendations.recommendedType === 'dsa' ? 'Algorithms & Data Structures' : recommendations.recommendedRole}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-1 text-[10px] uppercase tracking-wider font-semibold">Detected Stack</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {recommendations.detectedSkills.slice(0, 5).map(skill => (
                        <span key={skill} className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-900 text-[10px] text-zinc-400 font-medium">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {recommendations.detectedProjects.length > 0 && (
                  <div className="pt-3 text-sm border-t border-zinc-900/60">
                    <span className="text-zinc-500 block mb-1.5 text-[10px] uppercase tracking-wider font-semibold">Extracted Projects</span>
                    <div className="flex flex-wrap gap-1.5">
                      {recommendations.detectedProjects.map(proj => (
                        <span key={proj} className="text-xs text-zinc-300 bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded font-medium">{proj}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="bg-white hover:bg-zinc-200 text-black font-semibold py-2 px-4 rounded-lg text-xs cursor-pointer transition-colors shadow-sm"
                  >
                    Continue to Target
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Step 2: Target Company & Role */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">Interview Target</h1>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Specify which company and role you are targeting. We tailor the interviewer persona accordingly.
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              {/* Target Company Palette */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-zinc-450 uppercase tracking-widest block">Target Company</label>
                <CompanyCombobox value={targetCompany} onChange={setTargetCompany} />
                <p className="text-[10px] text-zinc-500">Matches standard profile questions for major tech corps, or adapts to custom submissions.</p>
              </div>

              {/* Target Role input */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-zinc-450 uppercase tracking-widest block">Target Role</label>
                <input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="w-full bg-zinc-950 text-white rounded-lg border border-zinc-800 px-4 py-2.5 focus:outline-none focus:border-zinc-500 transition-all text-sm outline-none"
                />
              </div>

              {/* Interview Type Dropdown */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-zinc-450 uppercase tracking-widest block">Interview Category</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="w-full bg-zinc-950 text-white rounded-lg border border-zinc-800 px-4 py-2.5 focus:outline-none focus:border-zinc-500 transition-all text-sm cursor-pointer outline-none"
                >
                  {INTERVIEW_TYPES.map(type => (
                    <option key={type.id} value={type.id} className="bg-zinc-950 text-white">{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Interview Goal Radio Grid */}
              <div className="space-y-3">
                <label className="text-[10px] font-semibold text-zinc-450 uppercase tracking-widest block">Practice Goal</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {INTERVIEW_GOALS.map(goal => (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => setInterviewGoal(goal.id)}
                      className={`text-left p-5 rounded-lg border transition-all duration-150 cursor-pointer ${
                        interviewGoal === goal.id
                          ? 'border-zinc-450 bg-zinc-900/40'
                          : 'border-zinc-900 bg-zinc-950/10 hover:border-zinc-800'
                      }`}
                    >
                      <h4 className="text-xs font-semibold text-white mb-1.5">{goal.title}</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{goal.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step Buttons */}
              <div className="flex items-center justify-between pt-6">
                <button
                  onClick={() => setStep(1)}
                  className="text-zinc-400 hover:text-white text-xs font-semibold py-1.5 px-3 rounded-lg border border-zinc-900 hover:border-zinc-800 bg-zinc-950 cursor-pointer transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="bg-white hover:bg-zinc-200 text-black font-semibold py-2 px-4 rounded-lg text-xs cursor-pointer transition-colors shadow-sm"
                >
                  Continue to Settings
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Difficulty & AI Settings */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">Difficulty & Duration</h1>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Fine-tune interview speed and difficulty constraints. Autodetected settings are suggested based on your resume.
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-8">
              {/* Recommendations Transparent Badge Callout */}
              <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-850 text-zinc-350 text-xs flex gap-3 leading-relaxed">
                <span className="text-sm">💡</span>
                <div>
                  <span className="font-semibold text-zinc-200">AI Recommendation:</span> Based on your resume's {recommendations?.experienceYears || '0.5'} years of experience, we recommend starting with <span className="font-semibold capitalize text-white">{difficulty} level</span>. You can customize any of these settings below.
                </div>
              </div>

              {/* Difficulty Radio Cards */}
              <div className="space-y-3">
                <label className="text-[10px] font-semibold text-zinc-450 uppercase tracking-widest block">Difficulty Level</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {DIFFICULTY_TIERS.map(tier => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setDifficulty(tier.id)}
                      className={`text-left p-5 rounded-lg border transition-all duration-150 cursor-pointer ${
                        difficulty === tier.id
                          ? 'border-zinc-450 bg-zinc-900/40'
                          : 'border-zinc-900 bg-zinc-950/10 hover:border-zinc-800'
                      }`}
                    >
                      <h4 className="text-xs font-semibold text-white mb-1.5">{tier.title}</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{tier.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-zinc-450 uppercase tracking-widest">Interview Duration</label>
                  <span className="text-xs font-semibold text-white">{duration} Minutes</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-zinc-300"
                />
                <div className="flex justify-between text-[9px] font-semibold text-zinc-500 uppercase tracking-wider px-1">
                  <span>15m (Short)</span>
                  <span>30m (Medium)</span>
                  <span>45m (Long)</span>
                  <span>60m (Comprehensive)</span>
                </div>
              </div>

              {/* Step Buttons */}
              <div className="flex items-center justify-between pt-6">
                <button
                  onClick={() => setStep(2)}
                  className="text-zinc-400 hover:text-white text-xs font-semibold py-1.5 px-3 rounded-lg border border-zinc-900 hover:border-zinc-800 bg-zinc-950 cursor-pointer transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="bg-white hover:bg-zinc-200 text-black font-semibold py-2 px-4 rounded-lg text-xs cursor-pointer transition-colors shadow-sm"
                >
                  Continue to Review
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Review Parameters & Launch */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">Review Session</h1>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Almost ready. Review your targeted settings before spawning the conversational interviewer.
              </p>
            </div>

            <div className="max-w-2xl mx-auto rounded-lg border border-zinc-900 bg-[#0C0C0E]/50 p-6 space-y-6 shadow-xl relative">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500 block mb-1 text-[10px] uppercase tracking-wider font-semibold">Target Company</span>
                  <span className="text-zinc-200 font-semibold text-sm">{targetCompany}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1 text-[10px] uppercase tracking-wider font-semibold">Job Title</span>
                  <span className="text-zinc-200 font-semibold text-sm">{jobRole}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1 text-[10px] uppercase tracking-wider font-semibold">Interview Category</span>
                  <span className="text-zinc-200 font-semibold text-sm capitalize">{interviewType}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1 text-[10px] uppercase tracking-wider font-semibold">Practice Goal</span>
                  <span className="text-zinc-200 font-semibold text-sm">
                    {INTERVIEW_GOALS.find(g => g.id === interviewGoal)?.title || 'General Practice'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1 text-[10px] uppercase tracking-wider font-semibold">Difficulty Tier</span>
                  <span className="text-zinc-200 font-semibold text-sm">
                    {DIFFICULTY_TIERS.find(t => t.id === difficulty)?.title || 'Professional'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1 text-[10px] uppercase tracking-wider font-semibold">Session Length</span>
                  <span className="text-zinc-200 font-semibold text-sm">{duration} Minutes</span>
                </div>
              </div>

              {/* Dynamic Roadmap Visualizer */}
              {recommendations?.roadmap && (
                <div className="pt-5 border-t border-zinc-900/60">
                  <span className="text-zinc-500 block mb-3 text-[10px] uppercase tracking-wider font-semibold">Dynamic Interview Roadmap</span>
                  <div className="flex flex-col sm:flex-row justify-between gap-3 text-xs font-medium text-zinc-400">
                    {recommendations.roadmap.map((stage, idx) => (
                      <div key={idx} className="flex-1 p-2.5 rounded-lg border border-zinc-900 bg-zinc-950 text-center">
                        <div className="text-[10px] text-zinc-550 font-semibold mb-1">0{idx + 1}</div>
                        <div className="truncate text-zinc-200 font-semibold">{stage}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trust Transparency Disclaimer Badge */}
              <div className="text-center text-[10px] text-zinc-500 font-medium">
                This configuration was generated by analyzing your resume. Any adjustments above are saved to your cache.
              </div>

              {/* Launch CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-900/60">
                <button
                  onClick={() => setStep(3)}
                  disabled={isLoading}
                  className="text-zinc-400 hover:text-white text-xs font-semibold py-1.5 px-3 rounded-lg border border-zinc-900 hover:border-zinc-800 bg-zinc-950 cursor-pointer transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleStartInterview}
                  disabled={isLoading}
                  className="bg-white hover:bg-zinc-200 text-black font-semibold py-2 px-4 rounded-lg text-xs cursor-pointer transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? 'Preparing Interview...' : 'Start Interview'}
                  {!isLoading && (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Interview;