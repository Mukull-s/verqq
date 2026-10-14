import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CompanyCombobox } from '../components/CompanyCombobox';
import { ResumeUploader } from '../components/ResumeUploader';
import { useNotification } from '../contexts/NotificationContext';

const INTERVIEW_GOALS = [
  { id: 'placement_prep', title: 'Placement preparation', desc: 'Data structures, algorithms and core CS fundamentals.' },
  { id: 'internship', title: 'Internship ready', desc: 'Foundational coding standards, project structure and quick-learning.' },
  { id: 'product_company', title: 'Product company', desc: 'Production design patterns, API paradigms and system design.' },
  { id: 'practice', title: 'Balanced practice', desc: 'A healthy mix of DSA, project building and behavioural fit.' },
];

const INTERVIEW_TYPES = [
  { id: 'fullstack', name: 'Full Stack Development' },
  { id: 'backend', name: 'Backend Engineering' },
  { id: 'frontend', name: 'Frontend Engineering' },
  { id: 'dsa', name: 'Data Structures & Algorithms' },
  { id: 'system_design', name: 'System Design' },
  { id: 'hr', name: 'HR & Culture Fit' },
];

const DIFFICULTY_TIERS = [
  { id: 'learning', title: 'Learning', desc: 'First practice. Friendly pacing, basic paradigms.' },
  { id: 'placement', title: 'Campus placement', desc: 'Typical placement questions. Standard algorithms & database keys.' },
  { id: 'professional', title: 'Professional', desc: 'Product company interview. Scaling bottlenecks & clean architecture.' },
  { id: 'expert', title: 'Expert', desc: 'Senior challenge. Distributed systems & deep follow-ups.' },
];

const STEPS = ['Resume', 'Target', 'Settings', 'Launch'];

const Stepper = ({ active }) => (
  <div style={{ display: 'flex', alignItems: 'center', maxWidth: 640, margin: '0 auto 38px' }}>
    {STEPS.map((s, i) => {
      const done = i < active;
      const cur = i === active;
      return (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 30, height: 30, borderRadius: 999, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700,
              background: done ? 'var(--accent)' : cur ? 'var(--ink)' : '#fff',
              color: done || cur ? '#fff' : 'var(--ink-3)',
              border: `1px solid ${done || cur ? 'transparent' : 'var(--line-2)'}`,
            }}>{done ? '✓' : i + 1}</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: cur ? 'var(--ink)' : 'var(--ink-3)' }}>{s}</span>
          </div>
          {i < STEPS.length - 1 && <span style={{ flex: 1, height: 1, background: 'var(--line-2)', margin: '0 16px' }} />}
        </div>
      );
    })}
  </div>
);

function Interview() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeProfile, setResumeProfile] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  const [targetCompany, setTargetCompany] = useState('Google');
  const [jobRole, setJobRole] = useState('Software Engineer');
  const [interviewGoal, setInterviewGoal] = useState('practice');
  const [interviewType, setInterviewType] = useState('fullstack');
  const [difficulty, setDifficulty] = useState('placement');
  const [duration, setDuration] = useState(30);

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
    if (recs) {
      if (recs.recommendedRole) setJobRole(recs.recommendedRole);
      if (recs.recommendedDifficulty) setDifficulty(recs.recommendedDifficulty);
      if (recs.recommendedGoal) setInterviewGoal(recs.recommendedGoal);
      if (recs.recommendedType) setInterviewType(recs.recommendedType);
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
        duration,
        resumeText,
        resumeProfile,
        roadmap: recommendations?.roadmap || [],
      };
      const response = await api.createInterview(payload);
      if (response.status === 'success' && response.data && response.data.interviewId) {
        showSuccess('Starting interview session...');
        localStorage.setItem('currentInterview', JSON.stringify({
          id: response.data.interviewId,
          question: response.data.question,
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
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 72 }}>
      <Stepper active={step - 1} />

      {/* Step 1 — upload resume */}
      {step === 1 && (
        <div style={{ maxWidth: 720, margin: '0 auto' }} className="stack">
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <h1 style={{ fontSize: 'clamp(28px,3.4vw,40px)' }}>Upload your profile</h1>
            <p className="lead" style={{ fontSize: 14.5, marginTop: 8 }}>
              We extract details from your resume to align questions with your real stack.
            </p>
          </div>

          <ResumeUploader onUploadSuccess={handleResumeSuccess} onClear={handleClearResume} initialFileName={resumeFile ? resumeFile.name : ''} />

          {recommendations && (
            <div className="card card--lg card--pad stack" style={{ gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: 14 }}>
                <h3 style={{ fontSize: 15 }}>Analysis summary</h3>
                <span className="tag tag--accent">{recommendations.experienceLabel || `${recommendations.experienceYears} yrs exp`}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 20 }}>
                <div>
                  <p className="kicker" style={{ marginBottom: 8 }}>Primary stack</p>
                  <p style={{ fontWeight: 600 }}>{recommendations.recommendedType === 'dsa' ? 'Algorithms & Data Structures' : recommendations.recommendedRole}</p>
                </div>
                <div>
                  <p className="kicker" style={{ marginBottom: 8 }}>Detected skills</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {recommendations.detectedSkills.slice(0, 6).map((s) => <span key={s} className="tag" style={{ padding: '4px 10px', fontSize: 12 }}>{s}</span>)}
                  </div>
                </div>
              </div>
              {recommendations.detectedProjects?.length > 0 && (
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                  <p className="kicker" style={{ marginBottom: 10 }}>Extracted projects</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {recommendations.detectedProjects.map((p) => <span key={p} className="tag" style={{ padding: '4px 10px', fontSize: 12 }}>{p}</span>)}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn--ink" onClick={() => setStep(2)}>Continue to target →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2 — target */}
      {step === 2 && (
        <div style={{ maxWidth: 780, margin: '0 auto' }} className="stack">
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <h1 style={{ fontSize: 'clamp(28px,3.4vw,40px)' }}>Interview target</h1>
            <p className="lead" style={{ fontSize: 14.5, marginTop: 8 }}>Specify the company and role — we tailor the interviewer persona.</p>
          </div>

          <div className="card card--lg card--pad stack" style={{ gap: 22 }}>
            <div>
              <p className="kicker" style={{ marginBottom: 10 }}>Target company</p>
              <CompanyCombobox value={targetCompany} onChange={setTargetCompany} />
            </div>
            <label className="field">
              <span>Target role</span>
              <input className="input" type="text" value={jobRole} onChange={(e) => setJobRole(e.target.value)} placeholder="e.g. Software Engineer" />
            </label>
            <label className="field">
              <span>Interview category</span>
              <select className="input" value={interviewType} onChange={(e) => setInterviewType(e.target.value)}>
                {INTERVIEW_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <div>
              <p className="kicker" style={{ marginBottom: 12 }}>Practice goal</p>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
                {INTERVIEW_GOALS.map((g) => (
                  <button key={g.id} type="button" onClick={() => setInterviewGoal(g.id)}
                    className="card" style={{
                      textAlign: 'left', padding: 18, cursor: 'pointer',
                      borderColor: interviewGoal === g.id ? 'var(--accent)' : 'var(--line)',
                      boxShadow: interviewGoal === g.id ? '0 0 0 4px var(--accent-soft)' : 'var(--sh-xs)',
                    }}>
                    <h4 style={{ fontSize: 15, marginBottom: 6 }}>{g.title}</h4>
                    <p className="muted" style={{ fontSize: 13 }}>{g.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn--outline" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn--ink" onClick={() => setStep(3)}>Continue to settings →</button>
          </div>
        </div>
      )}

      {/* Step 3 — difficulty + duration */}
      {step === 3 && (
        <div style={{ maxWidth: 780, margin: '0 auto' }} className="stack">
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <h1 style={{ fontSize: 'clamp(28px,3.4vw,40px)' }}>Difficulty &amp; duration</h1>
            <p className="lead" style={{ fontSize: 14.5, marginTop: 8 }}>Pre-filled from your resume. Adjust anything.</p>
          </div>

          <div className="card card--pad" style={{ display: 'flex', gap: 14, background: 'var(--accent-soft)', borderColor: 'transparent' }}>
            <span style={{ width: 34, height: 34, borderRadius: 999, background: '#fff', display: 'grid', placeItems: 'center', flex: 'none' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z" /></svg>
            </span>
            <p style={{ fontSize: 13.5, color: 'var(--accent-2)' }}>
              <b>AI recommendation:</b> based on your resume’s {recommendations?.experienceYears || '0.5'} years, we suggest starting at <b>{difficulty}</b>.
            </p>
          </div>

          <div>
            <p className="kicker" style={{ marginBottom: 13 }}>Difficulty level</p>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
              {DIFFICULTY_TIERS.map((t) => (
                <button key={t.id} type="button" onClick={() => setDifficulty(t.id)}
                  className="card" style={{
                    textAlign: 'left', padding: 20, cursor: 'pointer',
                    borderColor: difficulty === t.id ? 'var(--accent)' : 'var(--line)',
                    boxShadow: difficulty === t.id ? '0 0 0 4px var(--accent-soft)' : 'var(--sh-xs)',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: 16 }}>{t.title}</h4>
                    {difficulty === t.id && <span className="tag tag--accent" style={{ padding: '3px 9px', fontSize: 11 }}>Selected</span>}
                  </div>
                  <p className="muted" style={{ fontSize: 13, marginTop: 7 }}>{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="card card--pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <p className="kicker">Session length</p>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>{duration} min</span>
            </div>
            <input type="range" min="15" max="60" step="15" value={duration} onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full" style={{ margin: '22px 0 10px', accentColor: 'var(--accent)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>
              <span>15m</span><span>30m</span><span>45m</span><span>60m</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn--outline" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn--ink" onClick={() => setStep(4)}>Continue to review →</button>
          </div>
        </div>
      )}

      {/* Step 4 — review */}
      {step === 4 && (
        <div style={{ maxWidth: 780, margin: '0 auto' }} className="stack">
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <h1 style={{ fontSize: 'clamp(28px,3.4vw,40px)' }}>Review session</h1>
            <p className="lead" style={{ fontSize: 14.5, marginTop: 8 }}>Almost ready — review your settings before we begin.</p>
          </div>

          <div className="card card--lg card--pad stack" style={{ gap: 26 }}>
            <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: 20 }}>
              {[
                ['Target company', targetCompany],
                ['Job title', jobRole],
                ['Interview category', interviewType],
                ['Practice goal', INTERVIEW_GOALS.find((g) => g.id === interviewGoal)?.title || 'General practice'],
                ['Difficulty', DIFFICULTY_TIERS.find((t) => t.id === difficulty)?.title || 'Professional'],
                ['Session length', `${duration} minutes`],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="kicker" style={{ marginBottom: 6 }}>{k}</p>
                  <p style={{ fontWeight: 600, textTransform: k === 'Interview category' ? 'capitalize' : 'none' }}>{v}</p>
                </div>
              ))}
            </div>

            {recommendations?.roadmap && (
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 20 }}>
                <p className="kicker" style={{ marginBottom: 14 }}>Dynamic roadmap</p>
                <div className="grid grid-cols-2 sm:grid-cols-5" style={{ gap: 10 }}>
                  {recommendations.roadmap.map((stage, idx) => (
                    <div key={idx} className="card" style={{ padding: 12, textAlign: 'center', background: 'var(--surface-2)' }}>
                      <div className="muted" style={{ fontSize: 11, fontWeight: 700, marginBottom: 5 }}>0{idx + 1}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }} className="truncate">{stage}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 20 }}>
              <button className="btn btn--outline" onClick={() => setStep(3)} disabled={isLoading}>← Back</button>
              <button className="btn btn--ink" onClick={handleStartInterview} disabled={isLoading}>
                {isLoading ? 'Preparing interview…' : 'Start interview →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Interview;
