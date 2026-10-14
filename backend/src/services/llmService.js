const axios = require('axios');

/**
 * Unified LLM caller with provider fallback.
 *
 * Primary:  Merge Gateway — DeepSeek V4.1 Flash (OpenAI-compatible).
 * Fallback: OpenRouter — Nemotron (OpenAI-compatible).
 *
 * Every call (questions, answer evaluation, follow-ups, overall report/summary)
 * goes through here so the primary model is always tried first and the fallback
 * only kicks in when the primary fails (network, auth, rate limit, 5xx).
 */

const MERGE_GATEWAY_DEFAULT_BASE = 'https://api-gateway.merge.dev/v1/openai';
const MERGE_GATEWAY_DEFAULT_MODEL = 'deepseek/deepseek-v4.1-flash';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const OPENROUTER_DEFAULT_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';

const trimSlash = (url) => (url || '').replace(/\/+$/, '');

const buildProviders = () => {
  const providers = [];

  const mergeKey = process.env.MERGE_GATEWAY_API_KEY;
  if (mergeKey) {
    providers.push({
      name: 'merge-gateway/deepseek-v4.1-flash',
      baseURL: trimSlash(process.env.MERGE_GATEWAY_BASE_URL || MERGE_GATEWAY_DEFAULT_BASE),
      apiKey: mergeKey,
      model: process.env.MERGE_GATEWAY_MODEL || MERGE_GATEWAY_DEFAULT_MODEL,
      headers: {},
    });
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    providers.push({
      name: 'openrouter/nemotron',
      baseURL: OPENROUTER_BASE,
      apiKey: openRouterKey,
      model: process.env.OPENROUTER_MODEL || OPENROUTER_DEFAULT_MODEL,
      headers: { 'HTTP-Referer': 'https://verq.ai', 'X-Title': 'VerQ Mock Interviewer' },
    });
  }

  return providers;
};

const callProvider = async (provider, messages, isJson, timeout) => {
  const body = { model: provider.model, messages };
  if (isJson) body.response_format = { type: 'json_object' };

  const res = await axios.post(`${provider.baseURL}/chat/completions`, body, {
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
      ...provider.headers,
    },
    timeout,
  });

  if (!res.data || !res.data.choices || !res.data.choices[0] || res.data.choices[0].message == null) {
    throw new Error('Invalid response structure from provider');
  }
  const content = res.data.choices[0].message.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Empty completion from provider');
  }
  return content;
};

/**
 * @param {Array} messages - Chat messages ({role, content}).
 * @param {boolean} isJson - Request a JSON object response.
 * @param {Object} [opts] - { timeout }
 * @returns {Promise<string>} Model output.
 */
const callLLM = async (messages, isJson = false, opts = {}) => {
  const providers = buildProviders();
  if (providers.length === 0) {
    throw new Error('No LLM provider configured. Set MERGE_GATEWAY_API_KEY (or OPENROUTER_API_KEY).');
  }

  const timeout = opts.timeout || Number(process.env.LLM_TIMEOUT_MS) || 45000;
  let lastError;

  for (const provider of providers) {
    try {
      console.log(`[LLM] → ${provider.name} (model=${provider.model}, json=${isJson})`);
      const content = await callProvider(provider, messages, isJson, timeout);
      return content;
    } catch (error) {
      const detail = error.response?.data?.error?.message || error.response?.data?.message || error.message;
      console.warn(`[LLM] ✗ ${provider.name} failed: ${detail}`);
      lastError = new Error(`${provider.name}: ${detail}`);
    }
  }

  throw new Error(`All LLM providers failed. Last error → ${lastError?.message}`);
};

module.exports = { callLLM };
