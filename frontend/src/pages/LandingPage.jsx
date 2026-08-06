import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { isAuthenticated } from '../services/authService';

export default function LandingPage() {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await isAuthenticated();
        setIsAuth(auth);
      } catch (error) {
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "How does VerQ prepare me for interviews?",
      a: "VerQ parses your resume and extracts key projects and skills. It generates personalized technical questions tailored to your target job role and difficulty, adjusting the depth in real time."
    },
    {
      q: "Are the interview questions specific to companies?",
      a: "Yes! VerQ models target styles for top product companies (like Google's algorithmic focus, Amazon's leadership principles, or Cisco's networking depth) and supports any custom company persona you type in."
    },
    {
      q: "Do I get feedback on my performance?",
      a: "Absolutely. At the end of each session, you receive a detailed report card grading your technical accuracy, communication skills, and problem solving, alongside a 5-point Action Plan for growth."
    },
    {
      q: "Can I practice with voice or text?",
      a: "You can interact naturally using your microphone. VerQ supports real-time speech-to-text transcription and can speak questions back to you aloud using speech synthesis."
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#09090B] text-white relative overflow-hidden font-chakra">
      {/* Premium Cybernetic SVG Grid Backdrop */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-zinc-700" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* Glowing Radial Vignette Lights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-purple-900/10 blur-[130px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-cyan-900/5 blur-[120px]" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center text-center px-4 pt-20">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <motion.div 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/25 bg-purple-950/20 text-purple-300 text-xs font-semibold tracking-wider uppercase"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            <span>AI Interview Intelligence</span>
          </motion.div>

          <motion.h1 
            className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Interview <span className="gradient-text font-black">Smarter.</span>
          </motion.h1>

          <motion.p 
            className="text-xl sm:text-2xl font-light text-zinc-400 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Elevate your technical communication and practice dynamic mock interviews tailored to your resume stack.
          </motion.p>

          {!loading && (
            <motion.div 
              className="pt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Link 
                to={isAuth ? "/interview" : "/login"}
                className="inline-flex items-center justify-center gap-2.5 bg-white text-black font-bold py-4.5 px-11 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] text-sm cursor-pointer"
              >
                {isAuth ? "Start Free Practice" : "Login to Begin"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="relative z-10 py-24 px-4 max-w-7xl mx-auto border-t border-zinc-900">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">Supercharge Your Prep</h2>
          <p className="text-zinc-450 max-w-xl mx-auto">Get realistic, deep technical conversations designed specifically for your experience profile.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-2xl border border-zinc-850 bg-zinc-950/30 backdrop-blur-sm space-y-4 hover:border-purple-500/25 hover:bg-zinc-950/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xl font-bold group-hover:scale-105 transition-transform">📄</div>
            <h3 className="text-lg font-bold text-white">Resume-Driven Questions</h3>
            <p className="text-sm text-zinc-450 leading-relaxed font-medium">
              We analyze your uploaded experience, projects, and tech stack to construct custom interview paths. No generic questions.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-2xl border border-zinc-850 bg-zinc-950/30 backdrop-blur-sm space-y-4 hover:border-cyan-500/25 hover:bg-zinc-950/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-xl font-bold group-hover:scale-105 transition-transform">📈</div>
            <h3 className="text-lg font-bold text-white">Dynamic Difficulty</h3>
            <p className="text-sm text-zinc-450 leading-relaxed font-medium">
              Questions automatically get harder or easier in real-time based on the technical accuracy and depth of your answers.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-2xl border border-zinc-850 bg-zinc-950/30 backdrop-blur-sm space-y-4 hover:border-emerald-500/25 hover:bg-zinc-950/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl font-bold group-hover:scale-105 transition-transform">🎙️</div>
            <h3 className="text-lg font-bold text-white">Natural Voice Dialogue</h3>
            <p className="text-sm text-zinc-450 leading-relaxed font-medium">
              Answer aloud using your microphone. Experience realistic conversational pacing with optional live audio reading.
            </p>
          </div>
        </div>
      </section>

      {/* AI Workflow / How it works Section */}
      <section className="relative z-10 py-24 px-4 bg-zinc-950/20 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">How It Works</h2>
            <p className="text-zinc-455 max-w-xl mx-auto font-medium">From resume upload to comprehensive feedback report in minutes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="space-y-4">
              <div className="text-5xl font-black text-purple-500/20">01</div>
              <h3 className="text-lg font-bold text-white">Upload Resume</h3>
              <p className="text-sm text-zinc-450 leading-relaxed font-medium">
                Drag-and-drop your resume. VerQ extracts your skills and projects.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4">
              <div className="text-5xl font-black text-cyan-500/20">02</div>
              <h3 className="text-lg font-bold text-white">Configure Goals</h3>
              <p className="text-sm text-zinc-450 leading-relaxed font-medium">
                Pick your interview type, difficulty, target company, and preparation goals.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-4">
              <div className="text-5xl font-black text-indigo-500/20">03</div>
              <h3 className="text-lg font-bold text-white">Interactive Practice</h3>
              <p className="text-sm text-zinc-450 leading-relaxed font-medium">
                Speak your responses aloud. AI asks follow-up questions to test your depth.
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-4">
              <div className="text-5xl font-black text-emerald-500/20">04</div>
              <h3 className="text-lg font-bold text-white">Detailed Report</h3>
              <p className="text-sm text-zinc-450 leading-relaxed font-medium">
                Receive graded metrics (Technical, Communication, Confidence) and five things to improve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQS Accordion Section */}
      <section className="relative z-10 py-24 px-4 max-w-4xl mx-auto border-t border-zinc-900">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="rounded-2xl border border-zinc-850 bg-zinc-950/30 overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none cursor-pointer hover:bg-zinc-900/30 transition-colors"
              >
                <span className="font-bold text-base sm:text-lg pr-4">{faq.q}</span>
                <span className="text-xl text-zinc-400 transition-transform duration-300">
                  {activeFaq === idx ? '−' : '+'}
                </span>
              </button>
              <div 
                className={`transition-all duration-300 ease-in-out ${
                  activeFaq === idx ? 'max-h-48 border-t border-zinc-900/40 p-6' : 'max-h-0'
                } overflow-hidden text-sm text-zinc-400 leading-relaxed`}
              >
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4 max-w-6xl mx-auto">
        <div className="rounded-3xl border border-purple-500/20 bg-[radial-gradient(ellipse_at_top_right,rgba(107,33,168,0.08),transparent_50%)] bg-zinc-950/60 p-8 sm:p-16 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <h2 className="text-3xl sm:text-5xl font-bold">Ready to stand out?</h2>
          <p className="text-zinc-400 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
            Get instant, personalized feedback on your interview communication and tech depth. Start practicing for free.
          </p>
          <div className="pt-4">
            <Link
              to={isAuth ? "/interview" : "/login"}
              className="inline-flex items-center justify-center bg-white text-black font-bold py-4 px-8 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_35px_rgba(255,255,255,0.2)] text-sm cursor-pointer"
            >
              Start Free Practice
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}