import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import RecordingBlob from '../components/RecordingBlob';
import { useNotification } from '../contexts/NotificationContext';

export default function InterviewSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess, showInfo } = useNotification();

  // State definitions
  const [interview, setInterview] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [pendingNextQuestion, setPendingNextQuestion] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Recording states
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [audioURL, setAudioURL] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);
  const [audioStream, setAudioStream] = useState(null);

  // AI Work Progress States
  const [aiState, setAiState] = useState(''); // 'listening', 'transcribing', 'evaluating_accuracy', 'evaluating_concepts', 'preparing_followup', 'finalizing_report', ''
  
  // Dialog / Modal state
  const [showExitModal, setShowExitModal] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [overallEvaluation, setOverallEvaluation] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  // Client-side Web Speech TTS
  const speak = (text) => {
    if (isMuted) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
    if (premiumVoice) utterance.voice = premiumVoice;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (currentQuestion && !isLoading) {
      speak(currentQuestion);
    }
  }, [currentQuestion, isLoading]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Fetch / Sync interview state
  const fetchSessionData = async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      const { data } = await api.getInterviewById(sessionId);
      setInterview(data);

      if (data.status === 'completed') {
        setIsComplete(true);
        setOverallEvaluation(data.overallEvaluation);
      } else {
        // Find current question context
        const Qs = data.questions || [];
        if (Qs.length > 0 && !currentQuestion) {
          // If in progress, show the last answered question's evaluation or prompt next
          const lastQA = Qs[Qs.length - 1];
          if (lastQA && !showEvaluation) {
            setCurrentQuestion(lastQA.question);
          }
        } else if (Qs.length === 0 && !currentQuestion) {
          // Fallback to first question stored in localStorage
          const saved = localStorage.getItem('currentInterview');
          if (saved) {
            const { question } = JSON.parse(saved);
            setCurrentQuestion(question);
          }
        }
      }
      setError('');
    } catch (err) {
      console.error('Error syncing session:', err);
      setError(err.message || 'Failed to sync session state');
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchSessionData(true);
    }
  }, [sessionId]);

  const startRecording = async () => {
    try {
      setAudioURL(null);
      setRecordingTime(0);
      audioChunksRef.current = [];
      setAiState('listening');

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      setAudioStream(stream);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus'
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // Auto-submit response to trigger AI processing states
        await submitResponse(audioBlob);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Recording error:', err);
      showError('Mic permissions are required for the voice session');
      setAiState('');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRecording(false);
      setAudioStream(null);
    }
  };

  const submitResponse = async (audioBlob) => {
    try {
      setAiState('transcribing');
      
      // Simulate progressive AI state updates during evaluations
      const timer1 = setTimeout(() => setAiState('evaluating_accuracy'), 1800);
      const timer2 = setTimeout(() => setAiState('evaluating_concepts'), 3600);

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('currentQuestion', currentQuestion);

      const { data } = await api.submitAnswer(sessionId, formData);
      
      clearTimeout(timer1);
      clearTimeout(timer2);

      setCurrentEvaluation(data.evaluation);
      setShowEvaluation(true);

      if (data.isComplete) {
        setAiState('finalizing_report');
        setIsComplete(true);
        setOverallEvaluation(data.overallEvaluation);
        setAiState('');
        showSuccess('Interview evaluation report is ready!');
      } else {
        setAiState('');
        if (data.nextQuestion) {
          setPendingNextQuestion(data.nextQuestion);
        }
      }

      // Sync latest history from DB
      await fetchSessionData();
    } catch (err) {
      console.error('Answer submission error:', err);
      showError(err.message || 'Failed to submit response');
      setAiState('');
    }
  };

  const handleGenerateFollowUp = async () => {
    try {
      setIsGeneratingQuestion(true);
      setAiState('preparing_followup');

      const { data } = await api.generateFollowUpQuestion(sessionId);
      
      if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion);
        setShowEvaluation(false);
        setCurrentEvaluation(null);
        setAudioURL(null);
      }
      setAiState('');
    } catch (err) {
      console.error('Follow-up error:', err);
      showError('Failed to generate follow-up question');
      setAiState('');
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const handleNextQuestion = () => {
    if (pendingNextQuestion) {
      setCurrentQuestion(pendingNextQuestion);
      setPendingNextQuestion(null);
      setShowEvaluation(false);
      setCurrentEvaluation(null);
      setAudioURL(null);
    }
  };

  // Exit workflows
  const handleExitDecision = (action) => {
    setShowExitModal(false);
    if (action === 'save') {
      showSuccess('Session state auto-saved.');
      navigate('/interview');
    } else if (action === 'discard') {
      showInfo('Session discarded.');
      navigate('/interview');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 px-4 sm:px-8 flex flex-col items-center justify-center bg-[#09090B] font-chakra text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-t-purple-500 border-b-zinc-800"></div>
        <p className="mt-4 text-xs font-semibold text-zinc-500 uppercase tracking-widest">Resuming Session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-32 px-4 bg-[#09090B] font-chakra text-white">
        <div className="max-w-md mx-auto rounded-2xl border border-red-500/20 bg-red-950/20 p-6 text-center space-y-4">
          <p className="text-red-300 font-semibold">{error}</p>
          <button onClick={() => navigate('/my-interviews')} className="bg-white text-black font-bold py-2.5 px-6 rounded-full text-xs cursor-pointer">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const roadmap = interview?.roadmap || ['Introduction', 'Technical Skills', 'Problem Solving', 'Behavioral', 'Wrapping Up'];
  const activeRoadmapIndex = Math.min(interview?.questions?.length || 0, roadmap.length - 1);

  return (
    <div className="min-h-screen pt-28 px-4 sm:px-8 bg-[#09090B] pb-24 text-white font-chakra relative">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Dynamic Timeline Roadmap Header */}
        {!isComplete && (
          <div className="rounded-2xl border border-zinc-850 bg-[#0C0C0E]/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Interview Roadmap</h2>
            <button
              onClick={() => setShowExitModal(true)}
              className="text-xs px-4 py-2 font-bold rounded-full border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 transition-colors cursor-pointer text-zinc-400 hover:text-white"
            >
              Exit Session
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {roadmap.map((stage, idx) => {
              const isPassed = idx < activeRoadmapIndex;
              const isCurrent = idx === activeRoadmapIndex;
              
              return (
                <div key={idx} className="flex-1 w-full relative">
                  <div className={`p-3 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                    isCurrent
                      ? 'bg-purple-950/20 border-purple-500/40 text-purple-300'
                      : isPassed
                      ? 'bg-zinc-900/40 border-zinc-850 text-zinc-400'
                      : 'bg-zinc-950/10 border-zinc-900 text-zinc-600'
                  }`}>
                    <span className="text-xs font-semibold truncate max-w-[150px]">{stage}</span>
                    <span className="text-[10px] font-bold">
                      {isPassed ? '✓' : isCurrent ? 'Active' : `0${idx + 1}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

        {/* Main Content Pane */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left panel - session actions */}
          <div className="lg:col-span-2 space-y-6">
            {!isComplete ? (
              <div className="rounded-lg border border-zinc-900 bg-[#0C0C0E]/50 p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Target Context: {interview?.targetCompany} Persona</span>
                  <button 
                    onClick={() => {
                      setIsMuted(!isMuted);
                      if (!isMuted) window.speechSynthesis.cancel();
                    }}
                    className="px-2.5 py-1 text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded border border-zinc-850 cursor-pointer transition-colors font-medium"
                    title={isMuted ? 'Unmute Audio Voice' : 'Mute Audio Voice'}
                  >
                    {isMuted ? '🔇 Muted' : '🔊 Speaking'}
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">{currentQuestion}</h3>
                </div>

                {/* Mic recording box */}
                <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-zinc-900 bg-zinc-950/20 gap-6">
                  {isRecording ? (
                    <>
                      <RecordingBlob isActive={isRecording} stream={audioStream} />
                      <div className="text-center">
                        <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1">Time elapsed</p>
                        <p className="text-xl font-bold text-zinc-300">
                          {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                      <button
                        onClick={stopRecording}
                        className="px-5 py-2 bg-red-650 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors cursor-pointer text-xs shadow-sm"
                      >
                        Stop Recording
                      </button>
                    </>
                  ) : (
                    <>
                      {/* AI work states loading instead of generic spinning */}
                      {aiState ? (
                        <div className="flex flex-col items-center gap-3 py-6">
                          <div className="animate-spin rounded-full h-7 w-7 border-2 border-t-zinc-300 border-b-zinc-900"></div>
                          <p className="text-[10px] text-zinc-450 font-semibold uppercase tracking-widest">
                            {aiState === 'transcribing' && 'Transcribing response...'}
                            {aiState === 'evaluating_accuracy' && 'Reviewing technical accuracy...'}
                            {aiState === 'evaluating_concepts' && 'Comparing with expected concepts...'}
                            {aiState === 'preparing_followup' && 'Preparing follow-up question...'}
                            {aiState === 'finalizing_report' && 'Finalizing evaluation...'}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center space-y-4">
                          <button
                            onClick={startRecording}
                            className="w-12 h-12 rounded-full bg-white hover:bg-zinc-200 flex items-center justify-center text-black transition-all cursor-pointer shadow-sm active:scale-95"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                            </svg>
                          </button>
                          <p className="text-xs text-zinc-500">Click to start recording your response. Answer clearly.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* Final Comprehensive SaaS Report Panel */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg border border-zinc-900 bg-[#0C0C0E]/50 p-6 sm:p-8 space-y-6 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-zinc-900/60 pb-5">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Practice Report Card</h2>
                    <p className="text-xs text-zinc-550 mt-1">Detailed performance review based on your 5 conversation cycles.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Decision:</span>
                    <span className="bg-zinc-900 border border-zinc-800 text-zinc-350 font-semibold px-2.5 py-1 rounded text-xs uppercase">
                      {overallEvaluation?.hiringRecommendation?.decision || 'Practice Complete'}
                    </span>
                  </div>
                </div>

                {/* Slider metrics */}
                <div className="space-y-5">
                  <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Performance Metrics</h3>
                  
                  {[
                    { label: 'Technical Depth', score: overallEvaluation?.technicalProficiency?.score, desc: overallEvaluation?.technicalProficiency?.explanation },
                    { label: 'Communication Clarity', score: overallEvaluation?.communicationSkills?.score, desc: overallEvaluation?.communicationSkills?.explanation },
                    { label: 'Problem Solving Method', score: overallEvaluation?.problemSolvingAbility?.score, desc: overallEvaluation?.problemSolvingAbility?.explanation },
                    { label: 'Target Company Alignment', score: overallEvaluation?.companyFit?.score, desc: overallEvaluation?.companyFit?.explanation },
                    { label: 'Speaking Confidence Index', score: overallEvaluation?.confidence?.score, desc: overallEvaluation?.confidence?.explanation }
                  ].map((metric) => (
                    <div key={metric.label} className="space-y-1.5 p-4 rounded-lg bg-zinc-950 border border-zinc-900">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-300">{metric.label}</span>
                        <span className="text-zinc-250 font-semibold">{metric.score || 0}/10</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-zinc-300 rounded-full" style={{ width: `${(metric.score || 0) * 10}%` }}></div>
                      </div>
                      <p className="text-[10px] text-zinc-550 pt-1 font-medium leading-relaxed">{metric.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Highlights: Impressive vs Concerning Answers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-zinc-900/60">
                  <div className="p-4 rounded-lg border border-zinc-900 bg-zinc-950 space-y-2">
                    <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">✓ Most Impressive Spot</h4>
                    <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                      {overallEvaluation?.mostImpressiveAnswer || 'No specific impressive highlights.'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-zinc-900 bg-zinc-950 space-y-2">
                    <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">⚠ Key Improvement Spot</h4>
                    <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                      {overallEvaluation?.mostConcerningAnswer || 'No critical bottlenecks identified.'}
                    </p>
                  </div>
                </div>

                {/* 5 Actions to improve */}
                {overallEvaluation?.nextFiveImprovements && (
                  <div className="pt-6 border-t border-zinc-900/60 space-y-3">
                    <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Next 5 Things to Focus & Improve</h3>
                    <ul className="space-y-2.5 text-xs text-zinc-300">
                      {overallEvaluation.nextFiveImprovements.map((item, idx) => (
                        <li key={idx} className="flex gap-2.5 items-start">
                          <span className="w-5 h-5 rounded bg-zinc-900 border border-zinc-850 flex items-center justify-center font-semibold text-zinc-300 flex-shrink-0 text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed pt-0.5">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-6 flex justify-end">
                  <button
                    onClick={() => navigate('/my-interviews')}
                    className="bg-white hover:bg-zinc-200 text-black font-semibold py-2 px-4 rounded-lg text-xs cursor-pointer transition-colors shadow-sm"
                  >
                    Done & Exit
                  </button>
                </div>
              </motion.div>
            )}

            {/* Answer feedback panels */}
            {showEvaluation && currentEvaluation && !isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-zinc-900 bg-[#0C0C0E]/50 p-6 space-y-6"
              >
                <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
                  <h3 className="text-[10px] font-semibold text-zinc-455 uppercase tracking-widest">Live Feedback Review</h3>
                  <span className="text-xs font-semibold text-zinc-200">Score: {currentEvaluation.overallScore}/10</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-900 space-y-2">
                    <span className="text-zinc-500 font-semibold block uppercase tracking-wider text-[9px]">What Went Well</span>
                    <ul className="list-disc pl-4 space-y-1 text-zinc-300 font-medium">
                      {currentEvaluation.strengths?.slice(0, 2).map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-900 space-y-2">
                    <span className="text-zinc-500 font-semibold block uppercase tracking-wider text-[9px]">Things to Optimize</span>
                    <ul className="list-disc pl-4 space-y-1 text-zinc-300 font-medium">
                      {currentEvaluation.areasForImprovement?.slice(0, 2).map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-900/60">
                  <button 
                    onClick={() => setShowEvaluation(false)}
                    className="text-xs text-zinc-450 hover:text-white cursor-pointer transition-colors"
                  >
                    Hide Feedback
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={handleNextQuestion}
                      className="bg-white hover:bg-zinc-200 text-black font-semibold py-1.5 px-4 rounded-lg text-xs cursor-pointer transition-colors shadow-sm"
                    >
                      Next Question
                    </button>
                    <button
                      onClick={handleGenerateFollowUp}
                      disabled={isGeneratingQuestion}
                      className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 font-semibold py-1.5 px-4 rounded-lg text-xs cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {isGeneratingQuestion ? 'Drilling...' : 'Drill Down / Follow-up'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right panel - History feed */}
          <div className="space-y-6">
            <div className="rounded-lg border border-zinc-900 bg-[#0C0C0E]/50 p-5 space-y-4">
              <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2.5">Session Log</h3>
              
              <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                {interview?.questions?.map((qa, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-zinc-900 bg-zinc-950 space-y-2">
                    <div className="flex justify-between text-[9px] font-semibold text-zinc-550 uppercase tracking-wider">
                      <span>Cycle 0{idx + 1}</span>
                      <span className="text-zinc-350">Score: {qa.evaluation?.overallScore}/10</span>
                    </div>
                    <p className="text-xs text-zinc-300 font-medium leading-relaxed whitespace-pre-wrap">{qa.question}</p>
                    <p className="text-[11px] text-zinc-500 italic leading-relaxed whitespace-pre-wrap">"{qa.answer}"</p>
                  </div>
                ))}

                {(!interview?.questions || interview.questions.length === 0) && (
                  <div className="text-center py-6 text-xs text-zinc-600 font-medium">
                    Responses will log here in real-time.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Flow Confirmation Modal */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExitModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-3xl border border-zinc-800 bg-[#0C0C0E] p-6 space-y-6 shadow-2xl text-center font-chakra text-white"
            >
              <h3 className="text-lg font-bold">Exit Practice Session?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                You can save your current question and responses to continue practicing later, or discard this session entirely.
              </p>
              
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => handleExitDecision('save')}
                  className="w-full py-3 rounded-full bg-white text-black font-bold text-xs cursor-pointer hover:scale-[1.02] transition-transform"
                >
                  Save & Exit Later
                </button>
                <button
                  onClick={() => handleExitDecision('discard')}
                  className="w-full py-3 rounded-full border border-red-500/20 bg-red-950/20 hover:bg-red-950/30 text-red-400 font-bold text-xs cursor-pointer"
                >
                  Discard Practice Session
                </button>
                <button
                  onClick={() => setShowExitModal(false)}
                  className="w-full py-3 rounded-full text-zinc-500 hover:text-white font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}