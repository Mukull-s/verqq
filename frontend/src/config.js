// API Configuration — works in Vite browser + Jest Node (no import.meta syntax).
// Vite injects process.env.VITE_API_URL via define; fallback keeps local dev working.
const getEnvApiUrl = () => {
  if (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  return 'http://localhost:3000';
};
export const API_BASE_URL = getEnvApiUrl(); 