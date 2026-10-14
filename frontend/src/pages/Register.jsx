import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPasswordStrength } from '../utils/passwordStrength';

const Clouds = ({ id }) => (
  <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
    <filter id={id}><feGaussianBlur stdDeviation="36" /></filter>
    <g filter={`url(#${id})`} fill="#ffffff">
      <ellipse cx="300" cy="220" rx="360" ry="160" opacity=".7" />
      <ellipse cx="1200" cy="300" rx="380" ry="150" opacity=".6" />
      <ellipse cx="700" cy="780" rx="520" ry="200" opacity=".6" />
      <ellipse cx="200" cy="740" rx="320" ry="150" opacity=".45" />
    </g>
  </svg>
);

const BAR_COLORS = ['var(--rose)', 'var(--rose)', 'var(--amber)', 'var(--green)', 'var(--green)'];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (strength.isCommon) {
      setError('That password is too common. Please choose a stronger one.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(displayName, email, password);
      navigate('/my-interviews');
    } catch (err) {
      setError(err.message || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 16, padding: 16 }}>
      <aside className="auth-split__aside sky" style={{ borderRadius: 'var(--r-xl)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 40, overflow: 'hidden' }}>
        <Clouds id="vq-reg-clouds" />
        <Link className="brand" to="/" style={{ color: '#F4F8FB', zIndex: 3 }}>
          <span className="brand__mark" style={{ background: 'rgba(255,255,255,.16)', backdropFilter: 'blur(6px)' }}><i></i><i></i><i></i><i></i></span> VerQ
        </Link>
        <div style={{ zIndex: 3 }}>
          <span className="tag tag--glass" style={{ marginBottom: 22 }}>Voice-first mock interviews</span>
          <h2 style={{ fontSize: 'clamp(34px, 3.6vw, 52px)', color: '#F4F8FB', maxWidth: 460, textShadow: '0 2px 30px rgba(40,60,80,.22)' }}>
            Say it out loud before it <em className="serif">counts</em>.
          </h2>
          <p style={{ color: 'rgba(245,249,252,.86)', maxWidth: 400, marginTop: 18, fontSize: 15 }}>
            Upload a resume and VerQ sets the level for you. Practise, get scored, and improve fast.
          </p>
        </div>
        <p style={{ color: 'rgba(245,249,252,.7)', fontSize: 13, maxWidth: 360, zIndex: 3 }}>
          12k+ answers scored · 4.9/5 candidate rating
        </p>
      </aside>

      <section style={{ display: 'grid', placeItems: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 392 }}>
          <h1 style={{ fontSize: 32 }}>Create your account</h1>
          <p className="lead" style={{ fontSize: 14.5, marginTop: 8 }}>Start with a resume — we’ll set the level for you.</p>

          {error && (
            <div style={{ marginTop: 22, padding: '12px 16px', borderRadius: 'var(--r-sm)', background: 'var(--rose-soft)', color: 'var(--rose)', fontSize: 13.5, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="stack" style={{ gap: 16, marginTop: 26 }}>
            <label className="field">
              <span>Full name</span>
              <input className="input" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Mukul Singhal" required autoComplete="name" />
            </label>
            <label className="field">
              <span>Email</span>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required autoComplete="email" />
            </label>
            <label className="field">
              <span>Password</span>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="new-password" />
              {password && (
                <div style={{ marginTop: 9 }} aria-live="polite">
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className="meter" style={{ flex: 1, height: 6 }}>
                        <i style={{ width: '100%', background: i < strength.score ? BAR_COLORS[strength.score] : 'transparent' }} />
                      </span>
                    ))}
                  </div>
                  <p className="muted" style={{ fontSize: 12, marginTop: 7 }}>
                    Strength: <b style={{ color: 'var(--ink)' }}>{strength.label}</b>
                    {strength.isCommon && ' (common password — choose another)'}
                  </p>
                </div>
              )}
            </label>
            <button type="submit" className="btn btn--ink" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <p className="lead" style={{ fontSize: 13.5, marginTop: 24, textAlign: 'center' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Register;
