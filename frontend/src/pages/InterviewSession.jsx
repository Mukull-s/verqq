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

  const [interview, setInterview] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [pendingNextQuestion, setPendingNextQuestion] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [audioURL, setAudioURL] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);
  const [audioStream, setAudioStream] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [micError, setMicError] = useState(null);

  const [aiState, setAiState] = useState('');

  const [showExitModal, setShowExitModal] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [overallEvaluation, setOverallEvaluation] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  const speak = (text) => {
    if (isMuted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find((v) => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
    if (premiumVoice) utterance.voice = premiumVoice;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (currentQuestion && !isLoading) speak(currentQuestion);
  }, [currentQuestion, isLoading]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
      const recorder = mediaRecorderRef.current;
      if (recorder) {
        try {
          if (recorder.state !== 'inactive') recorder.stop();
          recorder.stream?.getTracks?.().forEach((track) => track.stop());
        } catch (e) {
          console.error('Error cleaning up recorder on unmount:', e);
        }
        mediaRecorderRef.current = null;
      }
    };
  }, []);

  const fetchSessionData = async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      const { data } = await api.getInterviewById(sessionId);
      setInterview(data);

      if (data.status === 'completed') {
        setIsComplete(true);
        setOverallEvaluation(data.overallEvaluation);
      } else {
        const Qs = data.questions || [];
        if (Qs.length > 0 && !currentQuestion) {
          const lastQA = Qs[Qs.length - 1];
          if (lastQA && !showEvaluation) setCurrentQuestion(lastQA.question);
        } else if (Qs.length === 0 && !currentQuestion) {
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
    if (sessionId) fetchSessionData(true);
  }, [sessionId]);

  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return '';
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/mpeg'];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
  };

  const describeMicError = (err) => {
    const name = err?.name || '';
    switch (name) {
      case 'NotAllowedError':
      case 'SecurityError':
        return 'Microphone access was blocked. Allow microphone permission for this site in your browser settings, then try again.';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No microphone was found. Connect a microphone and try again.';
      case 'NotReadableError':
      case 'TrackStartError':
        return 'Your microphone is in use by another app. Close other apps using it and try again.';
      case 'OverconstrainedError':
      case 'ConstraintNotSatisfiedError':
        return 'Your microphone does not support the requested audio settings. Try a different device.';
      case 'AbortError':
        return 'Microphone start was interrupted. Please try again.';
      default:
        return 'Could not start recording. Check your microphone and browser permissions and try again.';
    }
  };

  const startRecording = async () => {
    if (isRecording || isSubmitting) return;
    try {
      setAudioURL(null);
      setRecordingTime(0);
      audioChunksRef.current = [];
      setMicError(null);
      setAiState('listening');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      setAudioStream(stream);

      const mimeType = getSupportedMimeType();
      let mediaRecorder;
      try {
        mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 }) : new MediaRecorder(stream);
      } catch {
        mediaRecorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        const actualType = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: actualType });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        await submitResponse(audioBlob);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      timerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } catch (err) {
      console.error('Recording error:', err);
      const message = describeMicError(err);
      setMicError(message);
      showError(message);
      setAiState('');
      try { mediaRecorderRef.current?.stream?.getTracks?.().forEach((t) => t.stop()); } catch { /* noop */ }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRecording(false);
      setAudioStream(null);
    }
  };

  const submitResponse = async (audioBlob) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      setAiState('transcribing');
      const timer1 = setTimeout(() => setAiState('evaluating_accuracy'), 1800);
      const timer2 = setTimeout(() => setAiState('evaluating_concepts'), 3600);

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('currentQuestion', currentQuestion);

      const { data } = await api.submitAnswer(sessionId, formData);
      clearTimeout(timer1); clearTimeout(timer2);

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
        if (data.nextQuestion) setPendingNextQuestion(data.nextQuestion);
      }
      await fetchSessionData();
    } catch (err) {
      console.error('Answer submission error:', err);
      showError(err.message || 'Failed to submit response');
      setAiState('');
    } finally {
      setIsSubmitting(false);
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

  const handleExitDecision = (action) => {
    setShowExitModal(false);
    if (action === 'save') {
      showSuccess('Session state auto-saved.');
      navigate('/my-interviews');
    } else if (action === 'discard') {
      showInfo('Session discarded.');
      navigate('/my-interviews');
    }
  };

  if (isLoading) {
    return (
      <div className="wrap" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div className="spin" style={{ width: 40, height: 40, borderRadius: 999, border: '3px solid var(--line)', borderTopColor: 'var(--accent)' }} />
        <p className="kicker">Resuming session…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wrap" style={{ paddingTop: 60 }}>
        <div className="card card--lg card--pad" style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--rose)', fontWeight: 600 }}>{error}</p>
          <button className="btn btn--ink" style={{ marginTop: 18 }} onClick={() => navigate('/my-interviews')}>Return to dashboard</button>
        </div>
      </div>
    );
  }

  const roadmap = interview?.roadmap?.length ? interview.roadmap : ['Introduction', 'Technical Skills', 'Problem Solving', 'Behavioral', 'Wrapping Up'];
  const activeRoadmapIndex = Math.min(interview?.questions?.length || 0, roadmap.length - 1);
  const cycleCount = interview?.questions?.length || 0;

  const metrics = [
    { label: 'Technical depth', score: overallEvaluation?.technicalProficiency?.score, desc: overallEvaluation?.technicalProficiency?.explanation },
    { label: 'Communication clarity', score: overallEvaluation?.communicationSkills?.score, desc: overallEvaluation?.communicationSkills?.explanation },
    { label: 'Problem solving', score: overallEvaluation?.problemSolvingAbility?.score, desc: overallEvaluation?.problemSolvingAbility?.explanation },
    { label: 'Target company alignment', score: overallEvaluation?.companyFit?.score, desc: overallEvaluation?.companyFit?.explanation },
    { label: 'Speaking confidence', score: overallEvaluation?.confidence?.score, desc: overallEvaluation?.confidence?.explanation },
  ];

  return (
    <div className="wrap" style={{ paddingTop: 34, paddingBottom: 72 }}>
      {/* Roadmap */}
      {!isComplete && (
        <div className="card card--lg card--pad" style={{ padding: '20px 24px', marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p className="kicker" style={{ margin: 0 }}>Interview roadmap</p>
            <button className="btn btn--outline btn--sm" onClick={() => setShowExitModal(true)}>Exit session</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5" style={{ gap: 10 }}>
            {roadmap.map((stage, idx) => {
              const isPassed = idx < activeRoadmapIndex;
              const isCurrent = idx === activeRoadmapIndex;
              return (
                <div key={idx} style={{
                  padding: 13, borderRadius: 'var(--r-sm)',
                  border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--line)'}`,
                  background: isCurrent ? 'var(--accent-soft)' : isPassed ? 'var(--surface-2)' : '#fff',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5, fontWeight: 600, color: isCurrent ? 'var(--accent-2)' : 'var(--ink-2)' }}>
                    <span className="truncate">{stage}</span>
                    <span>{isPassed ? '✓' : isCurrent ? '●' : `0${idx + 1}`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.9fr) minmax(0,1fr)', gap: 22, alignItems: 'start' }} className="session-grid">
        <div className="stack" style={{ gap: 20 }}>
          {!isComplete ? (
            <div className="card card--lg card--pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <span className="kicker" style={{ margin: 0 }}>{interview?.targetCompany} · {interview?.jobType || interview?.interviewType}</span>
                <button
                  onClick={() => { setIsMuted(!isMuted); if (!isMuted) window.speechSynthesis.cancel(); }}
                  className="tag" style={{ cursor: 'pointer', border: '1px solid var(--line-2)' }}
                  title={isMuted ? 'Unmute voice' : 'Mute voice'}
                >
                  {isMuted ? '🔇 Muted' : '🔊 Speaking'}
                </button>
              </div>

              <h2 style={{ fontSize: 'clamp(20px,2.2vw,28px)', lineHeight: 1.24 }}>{currentQuestion}</h2>

              <div style={{ marginTop: 26, borderRadius: 'var(--r)', border: '1px solid var(--line)', background: 'var(--surface-2)', padding: 30, textAlign: 'center' }}>
                {isRecording ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                    <RecordingBlob isActive={isRecording} stream={audioStream} />
                    <div>
                      <p className="kicker" style={{ marginBottom: 4 }}>Elapsed</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600 }}>
                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                    <button onClick={stopRecording} className="btn" style={{ background: 'var(--rose)', color: '#fff' }}>■ Stop recording</button>
                  </div>
                ) : aiState ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '18px 0' }} aria-live="polite">
                    <div className="spin" style={{ width: 26, height: 26, borderRadius: 999, border: '3px solid var(--line-2)', borderTopColor: 'var(--accent)' }} />
                    <p className="kicker">
                      {aiState === 'transcribing' && 'Transcribing response…'}
                      {aiState === 'evaluating_accuracy' && 'Reviewing technical accuracy…'}
                      {aiState === 'evaluating_concepts' && 'Comparing with expected concepts…'}
                      {aiState === 'preparing_followup' && 'Preparing follow-up question…'}
                      {aiState === 'finalizing_report' && 'Finalizing evaluation…'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    {micError && (
                      <div style={{ width: '100%', maxWidth: 440, borderRadius: 'var(--r-sm)', border: '1px solid var(--rose-soft)', background: 'var(--rose-soft)', padding: 16, textAlign: 'center' }}>
                        <p style={{ fontSize: 13.5, color: 'var(--rose)', fontWeight: 600 }}>{micError}</p>
                        <button className="btn btn--outline btn--sm" style={{ marginTop: 12, background: '#fff' }} onClick={startRecording}>Retry microphone</button>
                      </div>
                    )}
                    <button
                      onClick={startRecording}
                      disabled={isRecording || isSubmitting}
                      aria-label="Start recording"
                      style={{
                        width: 56, height: 56, borderRadius: 999, background: 'var(--ink)', color: '#fff',
                        display: 'grid', placeItems: 'center', cursor: 'pointer', border: 0,
                        boxShadow: 'var(--sh-md)', opacity: isRecording || isSubmitting ? .5 : 1,
                      }}
                    >
                      <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                      </svg>
                    </button>
                    <p className="muted" style={{ fontSize: 13 }}>Click to start recording your response.</p>
                    {audioURL && (
                      <audio controls src={audioURL} style={{ width: '100%', maxWidth: 320, height: 34 }} aria-label="Your recorded answer" />
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="card card--lg card--pad stack" style={{ gap: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--line)', paddingBottom: 20, gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: 26 }}>Practice report card</h2>
                  <p className="lead" style={{ fontSize: 13.5, marginTop: 6 }}>
                    Detailed review based on {cycleCount} conversation {cycleCount === 1 ? 'cycle' : 'cycles'}.
                  </p>
                </div>
                <span className="tag tag--accent">
                  {overallEvaluation?.hiringRecommendation?.decision || 'Practice complete'}
                </span>
              </div>

              <div className="stack" style={{ gap: 14 }}>
                <p className="kicker" style={{ margin: 0 }}>Performance metrics</p>
                {metrics.map((m) => (
                  <div key={m.label} style={{ padding: 16, borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 600, marginBottom: 9 }}>
                      <span>{m.label}</span><span className="muted">{m.score || 0}/10</span>
                    </div>
                    <div className="meter"><i style={{ width: `${(m.score || 0) * 10}%` }} /></div>
                    {m.desc && <p className="muted" style={{ fontSize: 12.5, marginTop: 9 }}>{m.desc}</p>}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 16, borderTop: '1px solid var(--line)', paddingTop: 20 }}>
                <div className="card" style={{ padding: 18, background: 'var(--green-soft)', borderColor: 'transparent' }}>
                  <p className="kicker" style={{ color: 'var(--green)', marginBottom: 8 }}>✓ Most impressive</p>
                  <p style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>{overallEvaluation?.mostImpressiveAnswer || 'No specific highlights.'}</p>
                </div>
                <div className="card" style={{ padding: 18, background: 'var(--amber-soft)', borderColor: 'transparent' }}>
                  <p className="kicker" style={{ color: 'var(--amber)', marginBottom: 8 }}>⚠ Key improvement</p>
                  <p style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>{overallEvaluation?.mostConcerningAnswer || 'No critical bottlenecks identified.'}</p>
                </div>
              </div>

              {overallEvaluation?.nextFiveImprovements && (
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 20 }}>
                  <p className="kicker" style={{ marginBottom: 14 }}>Next five things to improve</p>
                  <ul className="stack" style={{ gap: 10, listStyle: 'none', padding: 0 }}>
                    {overallEvaluation.nextFiveImprovements.map((item, idx) => (
                      <li key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 13.5, color: 'var(--ink-2)' }}>
                        <span style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flex: 'none' }}>{idx + 1}</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn--ink" onClick={() => navigate('/my-interviews')}>Done &amp; exit</button>
              </div>
            </motion.div>
          )}

          {showEvaluation && currentEvaluation && !isComplete && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card card--lg card--pad stack" style={{ gap: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: 14 }}>
                <p className="kicker" style={{ margin: 0 }}>Live feedback</p>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>{currentEvaluation.overallScore}/10</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 14 }}>
                <div style={{ padding: 16, borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                  <p className="kicker" style={{ color: 'var(--accent)', marginBottom: 8 }}>What went well</p>
                  <ul style={{ paddingLeft: 16, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.7 }}>
                    {currentEvaluation.strengths?.slice(0, 2).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div style={{ padding: 16, borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                  <p className="kicker" style={{ color: 'var(--amber)', marginBottom: 8 }}>Optimize</p>
                  <ul style={{ paddingLeft: 16, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.7 }}>
                    {currentEvaluation.areasForImprovement?.slice(0, 2).map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                <button className="link-quiet" style={{ background: 'none', border: 0, cursor: 'pointer' }} onClick={() => setShowEvaluation(false)}>Hide feedback</button>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn--outline btn--sm" onClick={handleGenerateFollowUp} disabled={isGeneratingQuestion}>
                    {isGeneratingQuestion ? 'Drilling…' : 'Drill down'}
                  </button>
                  <button className="btn btn--ink btn--sm" onClick={handleNextQuestion}>Next question</button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Session log */}
        <aside className="card card--lg card--pad" style={{ alignSelf: 'start' }}>
          <p className="kicker" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12, marginBottom: 16 }}>Session log</p>
          <div className="stack" style={{ gap: 12, maxHeight: 460, overflowY: 'auto' }}>
            {interview?.questions?.map((qa, idx) => (
              <div key={idx} style={{ padding: 14, borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'var(--surface-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
                  <span>Cycle 0{idx + 1}</span>
                  <span>Score {qa.evaluation?.overallScore}/10</span>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 9, fontWeight: 600 }}>{qa.question}</p>
                <p className="muted" style={{ fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>“{qa.answer}”</p>
              </div>
            ))}
            {(!interview?.questions || interview.questions.length === 0) && (
              <p className="muted" style={{ fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Responses will log here in real time.</p>
            )}
          </div>
        </aside>
      </div>

      {/* Exit modal */}
      <AnimatePresence>
        {showExitModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExitModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(14,22,32,.55)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="card card--lg card--pad" style={{ position: 'relative', width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: 'var(--sh-lg)' }}>
              <h3 style={{ fontSize: 20 }}>Exit practice session?</h3>
              <p className="lead" style={{ fontSize: 13.5, marginTop: 10 }}>
                Your current question and responses are saved to your account. You can continue later or discard this session.
              </p>
              <div className="stack" style={{ gap: 10, marginTop: 22 }}>
                <button className="btn btn--ink" onClick={() => handleExitDecision('save')}>Save &amp; exit</button>
                <button className="btn btn--outline" style={{ color: 'var(--rose)', borderColor: 'var(--rose-soft)' }} onClick={() => handleExitDecision('discard')}>Discard session</button>
                <button className="link-quiet" style={{ background: 'none', border: 0, cursor: 'pointer', marginTop: 4 }} onClick={() => setShowExitModal(false)}>Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
