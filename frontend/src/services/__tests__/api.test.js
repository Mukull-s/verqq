import { api } from '../api';
import { API_BASE_URL } from '../../config';

// The API base URL is defined in one place (src/config.js) and injected via
// Vite's `define` for the browser, and via process.env for Jest/Node.
const BASE = API_BASE_URL;

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ status: 'success', data: { message: 'Success' } }),
  })
);

describe('API Service', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.clear();
  });

  describe('Authentication', () => {
    it('should handle login successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await api.login(credentials);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE}/api/auth/login`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(credentials),
        })
      );
      expect(response).toEqual({ status: 'success', data: { message: 'Success' } });
    });

    it('should handle registration successfully', async () => {
      const userData = {
        displayName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await api.register(userData);

      expect(fetch).toHaveBeenCalledWith(
        `${BASE}/api/auth/register`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(userData),
        })
      );
      expect(response).toEqual({ status: 'success', data: { message: 'Success' } });
    });
  });

  describe('User Profile', () => {
    it('should fetch user profile with the stored token', async () => {
      localStorage.setItem('firebaseToken', 'test-token');

      const response = await api.getUserProfile();

      expect(fetch).toHaveBeenCalledWith(
        `${BASE}/api/user/profile`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(response).toEqual({ status: 'success', data: { message: 'Success' } });
    });

    it('should not expose a dead PUT profile method (VRQ-014)', () => {
      expect(api.updateUserProfile).toBeUndefined();
    });
  });

  describe('Interviews', () => {
    it('should fetch interviews from the singular route', async () => {
      localStorage.setItem('firebaseToken', 'test-token');

      const response = await api.getInterviews();

      expect(fetch).toHaveBeenCalledWith(
        `${BASE}/api/interview`,
        expect.any(Object)
      );
      expect(response).toEqual({ status: 'success', data: { message: 'Success' } });
    });

    it('should fetch an interview by id', async () => {
      localStorage.setItem('firebaseToken', 'test-token');

      await api.getInterviewById('abc123');

      expect(fetch).toHaveBeenCalledWith(
        `${BASE}/api/interview/abc123`,
        expect.any(Object)
      );
    });

    it('should not expose a dead generateQuestion method (VRQ-013)', () => {
      expect(api.generateQuestion).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw when the server returns a 400 message', async () => {
      localStorage.setItem('firebaseToken', 'test-token');
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: 'Error occurred' }),
        })
      );

      await expect(api.getUserProfile()).rejects.toThrow('Error occurred');
    });

    it('should throw when no token is present', async () => {
      await expect(api.getUserProfile()).rejects.toThrow('No token provided');
      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
