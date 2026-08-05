/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'heading': ['Inter', 'system-ui', 'sans-serif'],
        'lato': ['Inter', 'system-ui', 'sans-serif'],
        'montserrat': ['Inter', 'system-ui', 'sans-serif'],
        'chakra': ['Inter', 'system-ui', 'sans-serif'],
        'bruno': ['Inter', 'system-ui', 'sans-serif'],
        'zen': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'background': '#09090B',
        'heading': '#E9EAEA',
        'paragraph': '#A1A1AA',
      },
    },
  },
  plugins: [],
} 