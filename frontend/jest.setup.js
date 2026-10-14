import '@testing-library/jest-dom';

// Ensure the shared API config resolves in Jest (Vite injects this in the browser).
process.env.VITE_API_URL = process.env.VITE_API_URL || 'http://localhost:3000';

// Functional in-memory localStorage mock (the previous jest.fn() stubs did not
// persist values, so token-based requests always threw "No token provided").
const createStorage = () => {
  let store = {};
  return {
    getItem: jest.fn((key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null)),
    setItem: jest.fn((key, value) => { store[key] = String(value); }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    key: jest.fn((i) => Object.keys(store)[i] || null),
    get length() { return Object.keys(store).length; },
  };
};

Object.defineProperty(global, 'localStorage', {
  value: createStorage(),
  writable: true,
}); 