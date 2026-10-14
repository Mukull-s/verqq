import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'http://localhost:3000';
  return {
    plugins: [react()],
    // Expose API URL via process.env too so Jest (CJS, no import.meta) and
    // browser code share one accessor without import.meta syntax.
    define: {
      'process.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
  };
})
