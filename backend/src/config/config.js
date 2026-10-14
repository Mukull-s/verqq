require('dotenv').config();

const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  deepgram: {
    apiKey: process.env.DEEPGRAM_API_KEY,
  },
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  upload: {
    directory: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB default
  },
  // Database configuration (commented out for future use)
  /*
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  */
  // JWT configuration (commented out for future use)
  /*
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  */
};

// Validate required environment variables
// Primary LLM = Merge Gateway (DeepSeek V4.1 Flash); fallback = OpenRouter/Nemotron.
// At least one LLM key must be present. STT (Deepgram) is required.
function validateConfig() {
  const hasMerge = !!process.env.MERGE_GATEWAY_API_KEY;
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;

  const requiredEnvVars = ['DEEPGRAM_API_KEY'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (!hasMerge && !hasOpenRouter) {
    missingEnvVars.push('MERGE_GATEWAY_API_KEY (or OPENROUTER_API_KEY as fallback)');
  }

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }
}

// Export configuration and validation function
module.exports = {
  config,
  validateConfig,
}; 