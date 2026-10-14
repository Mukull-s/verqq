import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(searchParams.get('error') || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/my-interviews');
    } catch (err) {
      setError(err.message || 'Failed to sign in. Check email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 16, padding: 16 }}>
      <aside className="auth-split__aside sky" style={{ borderRadius: 'var(--r-xl)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 40, overflow: 'hidden' }}>
        <Clouds id="vq-login-clouds" />
        <Link className="brand" to="/" style={{ color: '#F4F8FB', zIndex: 3 }}>
          <span className="brand__mark" style={{ background: 'rgba(255,255,255,.16)', backdropFilter: 'blur(6px)' }}><i></i><i></i><i></i><i></i></span> VerQ
        </Link>
        <div style={{ zIndex: 3 }}>
          <span className="tag tag--glass" style={{ marginBottom: 22 }}>Voice-first mock interviews</span>
          <h2 style={{ fontSize: 'clamp(34px, 3.6vw, 52px)', color: '#F4F8FB', maxWidth: 460, textShadow: '0 2px 30px rgba(40,60,80,.22)' }}>
            The interview starts the moment you <em className="serif">speak</em>.
          </h2>
          <p style={{ color: 'rgba(245,249,252,.86)', maxWidth: 400, marginTop: 18, fontSize: 15 }}>
            Practice out loud. Get scored on substance and delivery. Fix the gaps before the real panel.
          </p>
        </div>
        <p style={{ color: 'rgba(245,249,252,.7)', fontSize: 13, maxWidth: 360, zIndex: 3 }}>
          “After three sessions my filler words dropped by half.” — campus placement candidate
        </p>
      </aside>

      <section style={{ display: 'grid', placeItems: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 392 }}>
          <h1 style={{ fontSize: 32 }}>Welcome back</h1>
          <p className="lead" style={{ fontSize: 14.5, marginTop: 8 }}>Sign in to continue practising.</p>

          {error && (
            <div style={{ marginTop: 22, padding: '12px 16px', borderRadius: 'var(--r-sm)', background: 'var(--rose-soft)', color: 'var(--rose)', fontSize: 13.5, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="stack" style={{ gap: 16, marginTop: 26 }}>
            <label className="field">
              <span>Email</span>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required autoComplete="email" />
            </label>
            <label className="field">
              <span>Password</span>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
            </label>
            <button type="submit" className="btn btn--ink" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="lead" style={{ fontSize: 13.5, marginTop: 24, textAlign: 'center' }}>
            Don’t have an account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 700 }}>Register here</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Login;
