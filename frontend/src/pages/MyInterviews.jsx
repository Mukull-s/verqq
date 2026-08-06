import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useNotification } from "../contexts/NotificationContext";

export default function MyInterviews() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stats aggregations
  const [stats, setStats] = useState({
    avgTechnical: 0,
    avgCommunication: 0,
    avgProblemSolving: 0,
    avgConfidence: 0,
    completedCount: 0
  });

  const [weakTopics, setWeakTopics] = useState([]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.getInterviews();
      if (response.status === 'success' && response.data) {
        const list = response.data;
        setInterviews(list);

        // Aggregate statistics
        const completed = list.filter(i => i.status === 'completed');
        if (completed.length > 0) {
          let techSum = 0;
          let commSum = 0;
          let problemSum = 0;
          let confSum = 0;
          let allWeaknesses = [];

          completed.forEach(item => {
            const evalObj = item.overallEvaluation || {};
            techSum += evalObj.technicalProficiency?.score || 0;
            commSum += evalObj.communicationSkills?.score || 0;
            problemSum += evalObj.problemSolvingAbility?.score || 0;
            confSum += evalObj.confidence?.score || 0;
            
            // Gather areas for growth as weak topics
            if (evalObj.areasForGrowth) {
              allWeaknesses = [...allWeaknesses, ...evalObj.areasForGrowth];
            }
          });

          const n = completed.length;
          setStats({
            avgTechnical: Number((techSum / n).toFixed(1)),
            avgCommunication: Number((commSum / n).toFixed(1)),
            avgProblemSolving: Number((problemSum / n).toFixed(1)),
            avgConfidence: Number((confSum / n).toFixed(1)),
            completedCount: n
          });

          // Unique weaknesses to show as Weak Topics
          const uniqueWeaknesses = [...new Set(allWeaknesses)].slice(0, 5);
          setWeakTopics(uniqueWeaknesses);
        }
      }
    } catch (err) {
      console.error('Error fetching interviews:', err);
      showError('Failed to load interview history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleContinue = (interviewId, questionsList) => {
    // If the interview is in progress, check if first question is saved
    const lastQuestion = questionsList?.[questionsList.length - 1]?.question;
    localStorage.setItem('currentInterview', JSON.stringify({
      id: interviewId,
      question: lastQuestion || 'Let us discuss your experiences.'
    }));
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
        roadmap: item.roadmap || []
      };

      const response = await api.createInterview(payload);
      if (response.status === 'success' && response.data && response.data.interviewId) {
        localStorage.setItem('currentInterview', JSON.stringify({
          id: response.data.interviewId,
          question: response.data.question
        }));
        navigate(`/interview/session/${response.data.interviewId}`);
      }
    } catch (err) {
      console.error('Error in Practice Again:', err);
      showError('Failed to spawn new session.');
    }
  };

  const handleViewReport = (interviewId) => {
    navigate(`/interview/session/${interviewId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 px-4 flex flex-col items-center justify-center bg-[#09090B] font-chakra text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-t-purple-500 border-b-zinc-800"></div>
        <p className="mt-4 text-xs font-semibold text-zinc-500 uppercase tracking-widest">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 px-4 sm:px-8 bg-[#09090B] pb-24 text-white relative">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
            <p className="text-xs text-zinc-500 mt-1">Review your practice history, aggregate scores, and improvement focus areas.</p>
          </div>
          <button
            onClick={() => navigate('/interview')}
            className="inline-flex items-center justify-center bg-white hover:bg-zinc-200 text-black font-semibold py-2 px-4 rounded-lg text-xs cursor-pointer transition-colors shadow-sm"
          >
            Start New Practice
          </button>
        </div>

        {interviews.length === 0 ? (
          /* Empty State */
          <div className="rounded-lg border border-zinc-900 bg-[#0C0C0E]/50 p-12 text-center max-w-md mx-auto space-y-5">
            <div className="w-12 h-12 rounded-lg bg-zinc-950 border border-zinc-900 flex items-center justify-center text-zinc-500 mx-auto text-xl">
              📊
            </div>
            <h3 className="text-sm font-semibold text-zinc-200">No interviews recorded</h3>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
              You haven't completed any mock practice sessions yet. Upload a resume and practice targeting top companies.
            </p>
            <button
              onClick={() => navigate('/interview')}
              className="bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 px-4 rounded-lg text-xs cursor-pointer transition-colors"
            >
              Practice Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left columns - Interview History */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Recent Practice Sessions</h3>
              
              <div className="space-y-4">
                {interviews.map((item) => {
                  const isCompleted = item.status === 'completed';
                  const score = item.overallEvaluation?.overallScore || 0;
                  const progressColor = 'bg-zinc-300';

                  return (
                    <motion.div
                      key={item._id}
                      className="rounded-lg border border-zinc-900 bg-[#0C0C0E]/50 p-5 flex flex-col sm:flex-row justify-between gap-6 hover:border-zinc-800 transition-colors"
                      whileHover={{ y: -1 }}
                    >
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{item.targetCompany}</span>
                          <span className="text-[10px] text-zinc-500">•</span>
                          <span className="text-xs text-zinc-400 capitalize">{item.jobRole}</span>
                        </div>

                        <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                          <span className={`px-2 py-0.5 rounded border ${
                            isCompleted ? 'bg-zinc-900/60 border-zinc-850 text-zinc-500' : 'bg-zinc-900 border-zinc-800 text-zinc-300 font-semibold'
                          }`}>
                            {item.status.replace('_', ' ')}
                          </span>
                          <span>•</span>
                          <span>{item.difficulty} level</span>
                        </div>

                        {/* Miniature progress bar for score */}
                        {isCompleted && (
                          <div className="space-y-1.5 w-full max-w-[200px] pt-1">
                            <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
                              <span>Overall Accuracy</span>
                              <span className="text-zinc-400">{score * 10}%</span>
                            </div>
                            <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                              <div className={`h-full ${progressColor}`} style={{ width: `${score * 10}%` }}></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card actions */}
                      <div className="flex sm:flex-col justify-end items-end gap-3 self-center sm:self-auto">
                        {isCompleted ? (
                          <>
                            <button
                              onClick={() => handleViewReport(item._id)}
                              className="w-full sm:w-auto text-center bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-200 font-medium py-1.5 px-4 rounded-lg text-xs cursor-pointer transition-colors"
                            >
                              View Report
                            </button>
                            <button
                              onClick={() => handlePracticeAgain(item)}
                              className="w-full sm:w-auto text-center text-zinc-400 hover:text-white font-medium text-xs cursor-pointer transition-colors"
                            >
                              Practice Again
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleContinue(item._id, item.questions)}
                            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 px-4 rounded-lg text-xs cursor-pointer transition-colors shadow-sm"
                          >
                            Continue Session
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right column - Dashboard Statistics */}
            <div className="space-y-6">
              
              {/* Aggregated progress stats */}
              {stats.completedCount > 0 && (
                <div className="rounded-lg border border-zinc-900 bg-[#0C0C0E]/50 p-5 space-y-4">
                  <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2.5">Weekly Progress</h3>
                  
                  <div className="space-y-3">
                    {[
                      { name: 'Technical Depth', score: stats.avgTechnical },
                      { name: 'Communication Clarity', score: stats.avgCommunication },
                      { name: 'Problem Solving Method', score: stats.avgProblemSolving },
                      { name: 'Speaking Confidence', score: stats.avgConfidence }
                    ].map(metric => (
                      <div key={metric.name} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">{metric.name}</span>
                          <span className="text-zinc-350 font-semibold">{metric.score}/10</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full bg-zinc-300 rounded-full" style={{ width: `${metric.score * 10}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weak Topics / Growth areas */}
              {weakTopics.length > 0 && (
                <div className="rounded-lg border border-zinc-900 bg-[#0C0C0E]/50 p-5 space-y-3">
                  <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2.5">Weak Topics</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {weakTopics.map(topic => (
                      <span
                        key={topic}
                        className="px-2.5 py-1 rounded border border-zinc-800 bg-zinc-900/60 text-zinc-300 text-[11px] font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-550 leading-relaxed pt-1">
                    AI identified these topics as having notable gaps. Practice company profiles matching these areas.
                  </p>
                </div>
              )}

              {/* Quick statistics summary */}
              <div className="rounded-lg border border-zinc-900 bg-[#0C0C0E]/50 p-5 text-center space-y-1">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Total Practiced Sessions</span>
                <p className="text-3xl font-bold text-white pt-1">{stats.completedCount}</p>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}