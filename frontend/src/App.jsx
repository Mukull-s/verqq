import { BrowserRouter as Router, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import MyInterviews from './pages/MyInterviews';
import Interview from './pages/Interview';
import InterviewSession from './pages/InterviewSession';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import { NotificationProvider } from './contexts/NotificationContext';

// Create a wrapper component to access location
const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const showChrome = !isAuthPage;

  return (
    <div className="min-h-screen flex flex-col">
      {showChrome && <Navbar />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/interview" element={
            <ProtectedRoute>
              <Interview />
            </ProtectedRoute>
          } />
          <Route path="/interview/session/:sessionId" element={
            <ProtectedRoute>
              <InterviewSession />
            </ProtectedRoute>
          } />
          {/* Legacy /dashboard is dead; redirect to the live dashboard. */}
          <Route path="/dashboard" element={<Navigate to="/my-interviews" replace />} />
          <Route path="/my-interviews" element={
            <ProtectedRoute>
              <MyInterviews />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {showChrome && <Footer />}
    </div>
  );
};

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
