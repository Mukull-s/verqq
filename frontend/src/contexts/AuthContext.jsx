import { createContext, useContext, useState, useEffect } from 'react';
import { 
  isAuthenticated as checkIsAuthenticated, 
  login as apiLogin, 
  register as apiRegister, 
  logout as apiLogout,
  getCurrentUser
} from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logAuthState = (message, data = {}) => {
    console.log(`[AuthContext] ${message}`, {
      ...data,
      hasUser: !!user,
      hasToken: !!localStorage.getItem('firebaseToken'),
      loading
    });
  };

  useEffect(() => {
    const initializeAuth = async () => {
      logAuthState('Initializing auth state');
      try {
        const isAuth = await checkIsAuthenticated();
        if (isAuth) {
          const currentUser = getCurrentUser();
          setUser(currentUser);
          logAuthState('User authenticated on startup');
        } else {
          setUser(null);
          logAuthState('User not authenticated on startup');
        }
      } catch (err) {
        console.error('Error during startup authentication check:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    logAuthState('Attempting login', { email });
    try {
      const result = await apiLogin(email, password);
      setUser(result);
      logAuthState('Login successful');
      return result;
    } catch (err) {
      logAuthState('Login failed', { error: err.message });
      setError(err);
      throw err;
    }
  };

  const register = async (displayName, email, password) => {
    logAuthState('Attempting registration', { email });
    try {
      const result = await apiRegister(displayName, email, password);
      setUser(result);
      logAuthState('Registration successful');
      return result;
    } catch (err) {
      logAuthState('Registration failed', { error: err.message });
      setError(err);
      throw err;
    }
  };

  const logout = async () => {
    logAuthState('Attempting logout');
    try {
      await apiLogout();
      setUser(null);
      logAuthState('Logout successful');
    } catch (err) {
      logAuthState('Logout failed', { error: err.message });
      setError(err);
      throw err;
    }
  };

  const isAuthenticated = async () => {
    logAuthState('Checking authentication status');
    try {
      const result = await checkIsAuthenticated();
      if (result) {
        setUser(getCurrentUser());
      } else {
        setUser(null);
      }
      return result;
    } catch (err) {
      logAuthState('Authentication check failed', { error: err.message });
      setError(err);
      return false;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 