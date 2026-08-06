const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const logAuthService = (operation, data = {}) => {
  console.log(`[AuthService] ${operation}`, {
    ...data,
    hasToken: !!localStorage.getItem('firebaseToken')
  });
};

export const register = async (displayName, email, password) => {
  logAuthService('Starting registration', { email });
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ displayName, email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('firebaseToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      return data.data.user;
    }
    throw new Error('No token received from server');
  } catch (error) {
    logAuthService('Registration error', { error: error.message });
    throw error;
  }
};

export const login = async (email, password) => {
  logAuthService('Starting login', { email });
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('firebaseToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      return data.data.user;
    }
    throw new Error('No token received from server');
  } catch (error) {
    logAuthService('Login error', { error: error.message });
    throw error;
  }
};

export const logout = async () => {
  logAuthService('Starting logout');
  localStorage.removeItem('firebaseToken');
  localStorage.removeItem('user');
  localStorage.removeItem('currentInterview');
};

export const isAuthenticated = async () => {
  const token = localStorage.getItem('firebaseToken');
  if (!token) {
    return false;
  }

  try {
    // Verify token with backend
    const verifyResponse = await fetch(`${API_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!verifyResponse.ok) {
      localStorage.removeItem('firebaseToken');
      localStorage.removeItem('user');
      return false;
    }

    // Fetch fresh user profile
    const profileResponse = await fetch(`${API_URL}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!profileResponse.ok) {
      localStorage.removeItem('firebaseToken');
      localStorage.removeItem('user');
      return false;
    }

    const profileData = await profileResponse.json();
    if (profileData.status === 'success' && profileData.data?.user) {
      localStorage.setItem('user', JSON.stringify(profileData.data.user));
      return true;
    }

    return false;
  } catch (error) {
    logAuthService('Error verifying auth', { error: error.message });
    return false;
  }
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data', error);
    return null;
  }
}; 