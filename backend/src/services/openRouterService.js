const axios = require('axios');

/**
 * Call OpenRouter API with Nvidia Nemotron or similar models
 * @param {Array} messages - Chat completion messages
 * @param {boolean} isJson - Whether to enforce JSON mode
 * @returns {Promise<string>} - Model output string
 */
const callOpenRouter = async (messages, isJson = false) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const modelName = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free';

  console.log(`[OpenRouter] Sending request to model: ${modelName} (JSON Mode: ${isJson})`);

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://verq.ai',
    'X-Title': 'VerQ 2.0 Mock Interviewer'
  };

  const body = {
    model: modelName,
    messages: messages
  };

  if (isJson) {
    body.response_format = { type: 'json_object' };
  }

  try {
    const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', body, { headers, timeout: 45000 });
    if (!res.data || !res.data.choices || !res.data.choices[0]) {
      throw new Error('Invalid response structure from OpenRouter');
    }
    const content = res.data.choices[0].message.content;
    return content;
  } catch (error) {
    console.error('OpenRouter call error:', error.response?.data || error.message);
    throw new Error(`OpenRouter API error: ${error.response?.data?.error?.message || error.message}`);
  }
};

module.exports = {
  callOpenRouter
};
