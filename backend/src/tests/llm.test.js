const test = require('node:test');
const assert = require('node:assert');
const axios = require('axios');

/**
 * Proves the LLM provider orchestration (VerQ): the primary Merge Gateway
 * (DeepSeek V4.1 Flash) is tried first, and only on failure does it fall back
 * to OpenRouter/Nemotron. HTTP is fully mocked — no keys, no open sockets.
 */

const completion = (text) => ({ data: { choices: [{ message: { content: text } }] } });

const loadLLM = () => {
  delete require.cache[require.resolve('../services/llmService')];
  return require('../services/llmService');
};

const setPrimary = () => {
  process.env.MERGE_GATEWAY_API_KEY = 'test';
  process.env.MERGE_GATEWAY_BASE_URL = 'https://primary.test/v1/openai';
  process.env.MERGE_GATEWAY_MODEL = 'deepseek/deepseek-v4.1-flash';
};
const setFallbackOnly = () => {
  delete process.env.MERGE_GATEWAY_API_KEY;
  process.env.OPENROUTER_API_KEY = 'test';
};

test('LLM: uses the primary (Merge Gateway) when it succeeds', async () => {
  setPrimary();
  process.env.OPENROUTER_API_KEY = 'test';
  const calls = [];
  const orig = axios.post;
  axios.post = async (url, body, cfg) => {
    calls.push({ url, model: body.model, json: cfg.headers['Content-Type'] });
    return completion('PRIMARY_OK');
  };

  try {
    const { callLLM } = loadLLM();
    const out = await callLLM([{ role: 'user', content: 'hi' }]);
    assert.strictEqual(out, 'PRIMARY_OK');
    assert.strictEqual(calls.length, 1, 'only the primary should be called');
    assert.match(calls[0].url, /primary\.test/);
    assert.strictEqual(calls[0].model, 'deepseek/deepseek-v4.1-flash');
  } finally {
    axios.post = orig;
    delete process.env.OPENROUTER_API_KEY;
  }
});

test('LLM: falls back to Nemotron when the primary fails', async () => {
  setPrimary();
  process.env.OPENROUTER_API_KEY = 'test';
  const calls = [];
  const orig = axios.post;
  axios.post = async (url, body) => {
    calls.push(url);
    if (url.includes('primary.test')) {
      const err = new Error('primary down');
      err.response = { data: { error: { message: 'boom' } } };
      throw err;
    }
    calls.pushModel = body.model;
    return completion('FALLBACK_OK');
  };

  try {
    const { callLLM } = loadLLM();
    const out = await callLLM([{ role: 'user', content: 'hi' }]);
    assert.strictEqual(out, 'FALLBACK_OK');
    assert.strictEqual(calls.length, 2, 'primary then fallback');
    assert.match(calls[0], /primary\.test/);
    assert.match(calls[1], /openrouter\.ai/);
  } finally {
    axios.post = orig;
    delete process.env.OPENROUTER_API_KEY;
  }
});

test('LLM: passes JSON mode through to the provider', async () => {
  setPrimary();
  let sawJson = false;
  const orig = axios.post;
  axios.post = async (url, body) => {
    sawJson = body.response_format?.type === 'json_object';
    return completion('{}');
  };
  try {
    const { callLLM } = loadLLM();
    await callLLM([{ role: 'user', content: 'hi' }], true);
    assert.strictEqual(sawJson, true);
  } finally {
    axios.post = orig;
  }
});

test('LLM: throws a clear error when no provider is configured', async () => {
  delete process.env.MERGE_GATEWAY_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  const { callLLM } = loadLLM();
  await assert.rejects(() => callLLM([{ role: 'user', content: 'hi' }]), /No LLM provider configured/);
});
