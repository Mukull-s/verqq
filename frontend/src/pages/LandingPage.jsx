import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { isAuthenticated } from '../services/authService';

/* Soft cloudscape rendered as blurred SVG ellipses layered into the sky. */
const Clouds = () => (
  <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
    <filter id="vq-clouds"><feGaussianBlur stdDeviation="34" /></filter>
    <g filter="url(#vq-clouds)" fill="#ffffff">
      <ellipse cx="240" cy="250" rx="320" ry="140" opacity=".72" />
      <ellipse cx="500" cy="340" rx="270" ry="120" opacity=".5" />
      <ellipse cx="1310" cy="200" rx="340" ry="140" opacity=".62" />
      <ellipse cx="1070" cy="330" rx="230" ry="110" opacity=".42" />
      <ellipse cx="830" cy="770" rx="460" ry="175" opacity=".58" />
      <ellipse cx="290" cy="740" rx="310" ry="140" opacity=".44" />
      <ellipse cx="1520" cy="650" rx="290" ry="140" opacity=".38" />
    </g>
  </svg>
);

export default function LandingPage() {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const auth = await isAuthenticated();
        if (mounted) setIsAuth(auth);
      } catch {
        if (mounted) setIsAuth(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const startHref = isAuth ? '/interview' : '/login';

  const faqs = [
    {
      q: 'How does VerQ prepare me for interviews?',
      a: 'VerQ parses your resume and extracts key projects and skills. It generates personalized technical questions tailored to your target role and difficulty, adjusting depth in real time.',
    },
    {
      q: 'Are the questions specific to companies?',
      a: 'Yes. VerQ models target styles for top product companies — Google’s algorithmic focus, Amazon’s leadership principles, Cisco’s networking depth — and supports any custom company persona you type in.',
    },
    {
      q: 'Do I get feedback on my performance?',
      a: 'At the end of every session you receive a report card grading technical accuracy, communication and problem solving, alongside a five-point action plan for growth.',
    },
    {
      q: 'Can I practice with voice or text?',
      a: 'You answer naturally using your microphone. VerQ transcribes your speech and can read questions back aloud with browser speech synthesis.',
    },
  ];

  const features = [
    ['01', 'Voice-native scoring', 'Your answer is transcribed and scored on substance and delivery together — clarity, technical accuracy and language.'],
    ['02', 'Grounded in your resume', 'Questions are generated from your real projects and the role you target. No generic question banks.'],
    ['03', 'A plan, not a number', 'Every session produces an overall report with the exact gaps to drill before next time.'],
  ];

  const steps = [
    ['01', 'Upload resume', 'Drag-and-drop your resume. VerQ extracts your skills, projects and experience.'],
    ['02', 'Configure goals', 'Pick your interview type, difficulty, target company and preparation goals.'],
    ['03', 'Practice out loud', 'Speak your responses. VerQ asks follow-ups to probe your real depth.'],
    ['04', 'Get your report', 'Receive graded metrics and five concrete things to improve.'],
  ];

  return (
    <div>
      {/* ============================ HERO ============================ */}
      <section className="wrap" style={{ paddingTop: 96, paddingBottom: 56 }}>
        <div className="sky reveal" style={{ borderRadius: 'var(--r-xl)', boxShadow: 'var(--sh-lg)', minHeight: 620, display: 'grid', placeItems: 'center', textAlign: 'center', border: '1px solid rgba(255,255,255,.6)' }}>
          <Clouds />
          <div style={{ maxWidth: 760, padding: '80px 24px' }}>
            <span className="tag tag--glass" style={{ marginBottom: 26 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#BFE3CF', display: 'inline-block' }} />
              Private beta · 2026 cohort
            </span>
            <h1 style={{ fontSize: 'clamp(44px, 6.4vw, 78px)', color: '#F4F8FB', textShadow: '0 2px 30px rgba(40,60,80,.25)', lineHeight: 1.02 }}>
              Rehearse out loud.<br />Walk in <em className="serif">ready</em>.
            </h1>
            <p style={{ color: 'rgba(245,249,252,.9)', fontSize: 'clamp(15px, 1.5vw, 18px)', maxWidth: 560, margin: '24px auto 0', lineHeight: 1.6 }}>
              Say goodbye to guessing. VerQ listens to your spoken answers, scores them against the role you’re chasing, and shows exactly where to tighten up.
            </p>
            {!loading && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 34, flexWrap: 'wrap' }}>
                <Link to={startHref} className="btn btn--white btn--lg">
                  {isAuth ? 'Start practising' : 'Start free practice'} →
                </Link>
                <a href="#how" className="btn btn--ghost btn--lg">How it works</a>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, margin: '34px 6px 0', flexWrap: 'wrap' }}>
          <p className="kicker">Candidates targeting</p>
          <div style={{ display: 'flex', gap: 34, alignItems: 'center', opacity: .55, flexWrap: 'wrap' }}>
            {['Google', 'Amazon', 'Flipkart', 'Cisco', 'Atlassian'].map((x) => (
              <span key={x} style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 15, letterSpacing: '-.01em' }}>{x}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ========================== FEATURES ========================== */}
      <section className="wrap" style={{ paddingTop: 40, paddingBottom: 24 }}>
        <hr className="hair" style={{ marginBottom: 64 }} />
        <div style={{ maxWidth: 660 }}>
          <p className="kicker eyebrow-dot">Why VerQ</p>
          <h2 className="display-l" style={{ marginTop: 16 }}>Built for the parts a text tool can’t measure.</h2>
          <p className="lead" style={{ marginTop: 14, maxWidth: 520 }}>
            Pace, filler words, structure and depth — judged the way a real interviewer hears them, then turned into a plan.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 20, marginTop: 36 }}>
          {features.map(([n, t, d]) => (
            <article key={n} className="card card--lg" style={{ padding: 30 }}>
              <span className="kicker" style={{ color: 'var(--ink-4)' }}>{n}</span>
              <h3 style={{ fontSize: 21, margin: '16px 0 9px' }}>{t}</h3>
              <p className="lead" style={{ fontSize: 14.5 }}>{d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ========================= HOW IT WORKS ======================= */}
      <section id="how" className="wrap" style={{ paddingTop: 72, paddingBottom: 24 }}>
        <hr className="hair" style={{ marginBottom: 64 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <p className="kicker eyebrow-dot">The process</p>
            <h2 className="display-l" style={{ marginTop: 16 }}>From resume to report in minutes.</h2>
          </div>
          <p className="lead" style={{ maxWidth: 320, fontSize: 14.5 }}>Four steps, no setup ceremony. You’ll be answering questions within a minute.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4" style={{ gap: 20, marginTop: 40 }}>
          {steps.map(([n, t, d]) => (
            <div key={n} className="card" style={{ padding: 26, background: 'var(--surface-2)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 600, color: 'rgba(44,90,105,.22)' }}>{n}</div>
              <h3 style={{ fontSize: 17, margin: '12px 0 8px' }}>{t}</h3>
              <p className="lead" style={{ fontSize: 13.5 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =========================== PROGRESS ========================= */}
      <section className="wrap" style={{ paddingTop: 72, paddingBottom: 24 }}>
        <hr className="hair" style={{ marginBottom: 64 }} />
        <div className="card card--lg" style={{ display: 'grid', overflow: 'hidden', boxShadow: 'var(--sh-md)' }} id="progress-split">
          <div style={{ padding: '48px 44px', background: 'linear-gradient(180deg, #fff, #F7F9FB)' }}>
            <p className="kicker eyebrow-dot">Your progress</p>
            <h2 className="display-l" style={{ marginTop: 16, fontSize: 'clamp(26px,3vw,38px)' }}>Weak topics follow you across sessions.</h2>
            <p className="lead" style={{ fontSize: 14.5, maxWidth: 380, marginTop: 12 }}>
              VerQ remembers which areas cost you points and quietly aims the next session at them.
            </p>
            <Link to={isAuth ? '/my-interviews' : startHref} className="btn btn--ink" style={{ marginTop: 24 }}>View dashboard</Link>
          </div>
          <div style={{ padding: '48px 44px', borderLeft: '1px solid var(--line)', background: '#fff' }}>
            {[['Technical depth', 76, ''], ['Communication', 68, 'meter--amber'], ['Problem solving', 71, ''], ['Confidence', 82, '']].map(([l, v, c]) => (
              <div key={l} style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 600, marginBottom: 9 }}>
                  <span>{l}</span><span className="muted">{v}%</span>
                </div>
                <div className={`meter ${c}`}><i style={{ width: `${v}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================= FAQ ============================ */}
      <section className="wrap" style={{ paddingTop: 72, paddingBottom: 24, maxWidth: 900 }}>
        <hr className="hair" style={{ marginBottom: 64 }} />
        <h2 className="display-l" style={{ textAlign: 'center', marginBottom: 40 }}>Frequently asked questions</h2>
        <div className="stack" style={{ gap: 12 }}>
          {faqs.map((faq, idx) => (
            <div key={idx} className="card card--lg" style={{ overflow: 'hidden' }}>
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between"
                style={{ padding: '22px 26px', textAlign: 'left', cursor: 'pointer', background: 'transparent', border: 0 }}
              >
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, color: 'var(--ink)', paddingRight: 16 }}>{faq.q}</span>
                <span style={{ fontSize: 22, color: 'var(--ink-3)', lineHeight: 1 }}>{activeFaq === idx ? '−' : '+'}</span>
              </button>
              <div style={{ maxHeight: activeFaq === idx ? 240 : 0, overflow: 'hidden', transition: 'max-height .3s ease', borderTop: activeFaq === idx ? '1px solid var(--line)' : 'none' }}>
                <p className="lead" style={{ fontSize: 14.5, padding: '20px 26px' }}>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================= CTA ============================ */}
      <section className="wrap" style={{ paddingTop: 72, paddingBottom: 40 }}>
        <div className="sky" style={{ borderRadius: 'var(--r-xl)', padding: '72px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <Clouds />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 style={{ fontSize: 'clamp(32px, 4.4vw, 52px)', color: '#F4F8FB', textShadow: '0 2px 30px rgba(40,60,80,.25)', maxWidth: 720, margin: '0 auto' }}>
              The interview starts the moment you <em className="serif">speak</em>.
            </h2>
            <p style={{ color: 'rgba(245,249,252,.9)', fontSize: 15, maxWidth: 460, margin: '18px auto 32px' }}>
              Practise out loud, get scored, and fix the gaps — before the real panel.
            </p>
            {!loading && (
              <Link to={startHref} className="btn btn--white btn--lg">
                {isAuth ? 'Start practising' : 'Start free practice'} →
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
