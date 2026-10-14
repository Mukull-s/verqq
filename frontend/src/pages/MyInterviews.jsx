import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

export default function MyInterviews() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avgTechnical: 0, avgCommunication: 0, avgProblemSolving: 0, avgConfidence: 0, completedCount: 0 });
  const [weakTopics, setWeakTopics] = useState([]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.getInterviews();
      if (response.status === 'success' && response.data) {
        const list = response.data;
        setInterviews(list);

        const completed = list.filter((i) => i.status === 'completed');
        if (completed.length > 0) {
          let techSum = 0, commSum = 0, problemSum = 0, confSum = 0;
          let allWeaknesses = [];
          completed.forEach((item) => {
            const evalObj = item.overallEvaluation || {};
            techSum += evalObj.technicalProficiency?.score || 0;
            commSum += evalObj.communicationSkills?.score || 0;
            problemSum += evalObj.problemSolvingAbility?.score || 0;
            confSum += evalObj.confidence?.score || 0;
            if (evalObj.areasForGrowth) allWeaknesses = [...allWeaknesses, ...evalObj.areasForGrowth];
          });
          const n = completed.length;
          setStats({
            avgTechnical: Number((techSum / n).toFixed(1)),
            avgCommunication: Number((commSum / n).toFixed(1)),
            avgProblemSolving: Number((problemSum / n).toFixed(1)),
            avgConfidence: Number((confSum / n).toFixed(1)),
            completedCount: n,
          });
          setWeakTopics([...new Set(allWeaknesses)].slice(0, 6));
        }
      }
    } catch (err) {
      console.error('Error fetching interviews:', err);
      showError('Failed to load interview history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleContinue = (interviewId, questionsList) => {
    const lastQuestion = questionsList?.[questionsList.length - 1]?.question;
    localStorage.setItem('currentInterview', JSON.stringify({ id: interviewId, question: lastQuestion || 'Let us discuss your experiences.' }));
    navigate(`/interview/session/${interviewId}`);
  };

  const handlePracticeAgain = async (item) => {
    try {
      showSuccess('Preparing similar interview...');
      const payload = {
        jobRole: item.jobRole,
        targetCompany: item.targetCompany,
        difficulty: item.difficulty,
        interviewGoal: item.interviewGoal || 'practice',
        interviewType: item.interviewType || 'fullstack',
        resumeText: item.resumeText,
        resumeProfile: item.resumeProfile,
        roadmap: item.roadmap || [],
      };
      const response = await api.createInterview(payload);
      if (response.status === 'success' && response.data && response.data.interviewId) {
        localStorage.setItem('currentInterview', JSON.stringify({ id: response.data.interviewId, question: response.data.question }));
        navigate(`/interview/session/${response.data.interviewId}`);
      }
    } catch (err) {
      console.error('Error in Practice Again:', err);
      showError('Failed to spawn new session.');
    }
  };

  if (loading) {
    return (
      <div className="wrap" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div className="spin" style={{ width: 40, height: 40, borderRadius: 999, border: '3px solid var(--line)', borderTopColor: 'var(--accent)' }} />
        <p className="kicker">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 72 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--line)', paddingBottom: 24, marginBottom: 30, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(28px,3.4vw,40px)' }}>Dashboard</h1>
          <p className="lead" style={{ fontSize: 14.5, marginTop: 8 }}>Your practice history, aggregate scores and focus areas.</p>
        </div>
        <button className="btn btn--accent" onClick={() => navigate('/interview')}>+ New practice</button>
      </div>

      {interviews.length === 0 ? (
        <div className="card card--lg card--pad" style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center', padding: 48 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', margin: '0 auto 18px', color: 'var(--ink-3)' }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M3 3v18h18M8 17V9m5 8V5m5 12v-6" /></svg>
          </div>
          <h3 style={{ fontSize: 18 }}>No interviews recorded</h3>
          <p className="lead" style={{ fontSize: 13.5, marginTop: 10, maxWidth: 300, margin: '10px auto 0' }}>
            You haven’t completed any mock practice sessions yet. Upload a resume and target a company to begin.
          </p>
          <button className="btn btn--accent" style={{ marginTop: 22 }} onClick={() => navigate('/interview')}>Practice now</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.95fr) minmax(0,1fr)', gap: 26, alignItems: 'start' }} className="dash-grid">
          <div>
            <p className="kicker" style={{ marginBottom: 16 }}>Recent sessions</p>
            <div className="stack" style={{ gap: 16 }}>
              {interviews.map((item) => {
                const isCompleted = item.status === 'completed';
                const score = item.overallEvaluation?.overallScore || 0;
                return (
                  <div key={item._id} className="card card--lg card--pad" style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>{item.targetCompany}</span>
                        <span className="muted" style={{ fontSize: 13.5 }}>{item.jobRole}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 11, flexWrap: 'wrap' }}>
                        <span className={`tag ${isCompleted ? 'tag--green' : 'tag--amber'}`}>{item.status.replace('_', ' ')}</span>
                        <span className="tag">{item.difficulty}</span>
                        {item.duration ? <span className="tag">{item.duration} min</span> : null}
                      </div>
                      {isCompleted && (
                        <div style={{ maxWidth: 240, marginTop: 15 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, marginBottom: 7 }}>
                            <span className="muted">Overall</span><span>{score * 10}%</span>
                          </div>
                          <div className="meter"><i style={{ width: `${score * 10}%` }} /></div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 150 }}>
                      {isCompleted ? (
                        <>
                          <button className="btn btn--outline btn--sm" onClick={() => navigate(`/interview/session/${item._id}`)}>View report</button>
                          <button className="link-quiet" style={{ color: 'var(--accent)', background: 'none', border: 0, cursor: 'pointer' }} onClick={() => handlePracticeAgain(item)}>Practice again</button>
                        </>
                      ) : (
                        <button className="btn btn--accent btn--sm" onClick={() => handleContinue(item._id, item.questions)}>Continue session</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="stack" style={{ gap: 20 }}>
            {stats.completedCount > 0 && (
              <div className="card card--lg card--pad">
                <p className="kicker" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12, marginBottom: 16 }}>Overall progress</p>
                {[
                  ['Technical depth', stats.avgTechnical],
                  ['Communication clarity', stats.avgCommunication],
                  ['Problem solving', stats.avgProblemSolving],
                  ['Confidence', stats.avgConfidence],
                ].map(([l, v], i) => (
                  <div key={l} style={{ marginBottom: 15 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                      <span>{l}</span><span className="muted">{v}/10</span>
                    </div>
                    <div className={`meter ${i === 1 ? 'meter--amber' : ''}`}><i style={{ width: `${v * 10}%` }} /></div>
                  </div>
                ))}
              </div>
            )}

            {weakTopics.length > 0 && (
              <div className="card card--lg card--pad">
                <p className="kicker" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12, marginBottom: 16 }}>Weak topics</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {weakTopics.map((t) => <span key={t} className="tag">{t}</span>)}
                </div>
                <p className="muted" style={{ fontSize: 12.5, marginTop: 15 }}>VerQ will target these in your next session.</p>
              </div>
            )}

            <div className="sky" style={{ borderRadius: 'var(--r-lg)', padding: 28, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
                <filter id="vq-stat-clouds"><feGaussianBlur stdDeviation="24" /></filter>
                <g filter="url(#vq-stat-clouds)" fill="#fff">
                  <ellipse cx="90" cy="60" rx="120" ry="70" opacity=".6" />
                  <ellipse cx="320" cy="140" rx="140" ry="80" opacity=".5" />
                </g>
              </svg>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <p className="kicker" style={{ color: 'rgba(245,249,252,.8)' }}>Sessions completed</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 46, fontWeight: 600, color: '#F4F8FB', marginTop: 6 }}>{stats.completedCount}</p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
