# VerQ 

VerQ is a premium, minimal AI-powered technical mock interviewing platform designed for software engineers. It generates dynamic, follow-up interview questions tailored to specific companies, candidates' resumes, and technical domains, featuring voice-to-text transcriptions and live feedback scorecards.

---

## Technical Stack

* **Frontend**: React.js, Vite, Tailwind CSS, Framer Motion
* **Backend**: Node.js, Express, Mongoose / MongoDB Atlas
* **AI & Media Services**: 
  * LLM reasoning via **Gemini** & **OpenRouter**
  * Speech-to-text audio transcriptions via **Deepgram**
  * Speech synthesis via Web Speech API

---

## Quick Start Guide

### 1. Environment Setup
Run the setup batch script in the root directory to generate configuration files:
```bash
# Double-click setup.bat or run via terminal:
./setup.bat
```

### 2. Configure Environment Keys
Add your database and API credentials to the backend configuration file:
* **Backend (`/backend/.env`)**:
  * `MONGODB_URI`: MongoDB connection string.
  * `DEEPGRAM_API_KEY`: API Key for audio speech-to-text conversion.
  * `OPENROUTER_API_KEY`: API Key for generative LLM interview agents.

### 3. Run the Servers

#### Run the Backend API:
```bash
cd backend
npm install
npm run dev # Starts express server on http://localhost:3000
```

#### Run the Frontend Web Application:
```bash
cd frontend
npm install
npm run dev # Starts Vite server on http://localhost:5173
```

---

## Seeding Default Candidate
The backend automatically seeds a default candidate account for easy local evaluation.
* **Email**: `candidate@verq.com`
* **Password**: `password123`