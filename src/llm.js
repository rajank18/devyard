export const PROVIDERS = ['ollama', 'openai', 'gemini', 'openrouter', 'anthropic', 'none'];

export const DEFAULT_MODELS = {
  ollama: 'qwen2.5:3b',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-1.5-flash',
  openrouter: 'meta-llama/llama-3.2-3b-instruct',
  anthropic: 'claude-3-5-haiku-20241022'
};

export function formatProviderName(provider) {
  if (provider === 'ollama') return 'Ollama';
  if (provider === 'openai') return 'OpenAI';
  if (provider === 'openrouter') return 'OpenRouter';
  if (provider === 'gemini') return 'Gemini';
  if (provider === 'anthropic') return 'Anthropic';
  if (provider === 'none') return 'None (Local Git)';
  return provider || 'LLM';
}

export class LLMConnectionError extends Error {
  constructor(provider, host, cause) {
    const pName = formatProviderName(provider);
    let msg = `Could not connect to ${pName} at ${host}.`;
    if (provider === 'ollama') {
      msg += `\nMake sure Ollama is running:\n  ollama serve\n\nOr run without AI (default for scan):\n  devyard scan\n\nOr choose another provider:\n  devyard scan --provider openai\n  devyard scan --provider gemini\n  devyard scan --provider openrouter`;
    }
    super(msg);
    this.name = 'LLMConnectionError';
    this.provider = provider;
    this.host = host;
    this.cause = cause;
  }
}

export class LLMAuthError extends Error {
  constructor(provider, envVar) {
    const pName = formatProviderName(provider);
    super(
      `Missing or invalid API key for ${pName}.\n` +
      `Set the ${envVar} environment variable or pass --api-key <key>.`
    );
    this.name = 'LLMAuthError';
    this.provider = provider;
    this.envVar = envVar;
  }
}

export class LLMModelNotFoundError extends Error {
  constructor(model, provider, host) {
    const pName = formatProviderName(provider);
    let msg = `Model '${model}' not found in ${pName}`;
    if (host) msg += ` at ${host}`;
    msg += '.';
    if (provider === 'ollama') {
      msg += `\nPull the model before running devyard:\n  ollama pull ${model}`;
    }
    super(msg);
    this.name = 'LLMModelNotFoundError';
    this.model = model;
    this.provider = provider;
    this.host = host;
  }
}

// Backward-compatibility aliases for Ollama
export class OllamaConnectionError extends LLMConnectionError {
  constructor(host, cause) {
    super('ollama', host, cause);
    this.name = 'OllamaConnectionError';
  }
}

export class OllamaModelNotFoundError extends LLMModelNotFoundError {
  constructor(model, host) {
    super(model, 'ollama', host);
    this.name = 'OllamaModelNotFoundError';
  }
}

export function resolveApiKey(provider, explicitKey) {
  if (explicitKey) return explicitKey;

  switch (provider) {
    case 'openai':
      return process.env.OPENAI_API_KEY || '';
    case 'gemini':
      return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    case 'openrouter':
      return process.env.OPENROUTER_API_KEY || '';
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY || '';
    default:
      return '';
  }
}

export function getProviderEnvVar(provider) {
  switch (provider) {
    case 'openai': return 'OPENAI_API_KEY';
    case 'gemini': return 'GEMINI_API_KEY';
    case 'openrouter': return 'OPENROUTER_API_KEY';
    case 'anthropic': return 'ANTHROPIC_API_KEY';
    default: return '';
  }
}

export function detectConfiguredProvider() {
  if (process.env.DEVYARD_PROVIDER || process.env.PROJECTYARD_PROVIDER) {
    return (process.env.DEVYARD_PROVIDER || process.env.PROJECTYARD_PROVIDER).toLowerCase();
  }
  if (process.env.OPENROUTER_API_KEY) return 'openrouter';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) return 'gemini';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return null;
}

export const detectAvailableCloudProvider = detectConfiguredProvider;

export async function isOllamaReachable(host = 'http://localhost:11434') {
  try {
    const cleanHost = host.replace(/\/+$/, '');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 600);
    const res = await fetch(`${cleanHost}/api/tags`, {
      method: 'GET',
      signal: controller.signal
    }).catch(() => null);
    clearTimeout(timeout);
    return Boolean(res && res.ok);
  } catch {
    return false;
  }
}

// Heuristic Epitaph Generator (No AI needed)
export function generateHeuristicEpitaph(details) {
  const lastCommit = details.commits && details.commits.length > 0
    ? details.commits[0]
    : 'Initial commit';

  const todoCount = details.todos ? details.todos.length : 0;
  const dormantDays = details.daysSinceLastCommit || 180;

  const epitaphLine1 = `Last words: "${lastCommit.slice(0, 52)}"`;
  const epitaphLine2 = todoCount > 0
    ? `${todoCount} unfinished task${todoCount === 1 ? '' : 's'} left in the dark.`
    : `Resting peacefully after ${dormantDays} days of silence.`;

  let causeOfDeath = `Dormant for ${dormantDays} days without new commits.`;
  if (/wip|refactor|rewrite/i.test(lastCommit)) {
    causeOfDeath = 'Abandoned midway through an architectural overhaul.';
  } else if (/fix|bug|broken|issue|error/i.test(lastCommit)) {
    causeOfDeath = 'Stalled on an unresolved bug or failing tests.';
  } else if (/auth|login|token|oauth/i.test(lastCommit)) {
    causeOfDeath = 'Drowned in rabbit holes of authentication logic.';
  } else if (todoCount > 15) {
    causeOfDeath = 'Crushed by an overwhelming pile of unfinished TODOs.';
  }

  return {
    epitaph: [epitaphLine1, epitaphLine2],
    causeOfDeath
  };
}

// Heuristic Resurrect Generator (No AI needed)
export function generateHeuristicResurrect(details) {
  const lastCommit = details.commits && details.commits.length > 0
    ? details.commits[0]
    : 'Unknown commit';

  const topTodo = details.todos && details.todos.length > 0 ? details.todos[0] : null;
  const todoCount = details.todos ? details.todos.length : 0;

  const whereLeftOff = `Last commit was "${lastCommit}" on ${details.deathDate ? details.deathDate.split('T')[0] : 'unknown date'}.` +
    (topTodo ? ` Recent unfinished item in ${topTodo.file}:${topTodo.line}.` : '');

  let whyStopped = 'Momentum faded after last commit.';
  if (todoCount > 10) {
    whyStopped = `High task backlog (${todoCount} TODOs/FIXMEs) created analysis paralysis.`;
  } else if (/wip|temp|test|broken/i.test(lastCommit)) {
    whyStopped = 'Encountered breaking changes or incomplete experiments.';
  }

  const smallestNextStep = topTodo
    ? `Fix first pending item in ${topTodo.file}:${topTodo.line} (${topTodo.text.slice(0, 70)}).`
    : 'Run git status and run tests/build scripts to verify current repository health.';

  return {
    whereLeftOff,
    whyStopped,
    smallestNextStep
  };
}

export function buildEpitaphPrompt(details) {
  const commitList = details.commits && details.commits.length > 0
    ? details.commits.slice(0, 20).map(c => `- ${c}`).join('\n')
    : '(no commits)';

  const todoList = details.todos && details.todos.length > 0
    ? details.todos.slice(0, 30).map(t => `- ${t.file}:${t.line} - ${t.text}`).join('\n')
    : '(no TODOs found)';

  const readme = details.readme ? details.readme.trim() : '(no README found)';

  return (
    `You are the spirit of an abandoned software project resting in a digital cemetery.\n` +
    `Write a tombstone inscription for yourself.\n\n` +
    `Project: ${details.name}\n` +
    `Born (first commit): ${details.birthDate || 'Unknown'}\n` +
    `Died (last commit): ${details.deathDate || 'Unknown'}\n\n` +
    `Recent commit messages:\n${commitList}\n\n` +
    `Unfinished TODOs/FIXMEs:\n${todoList}\n\n` +
    `README snippet:\n${readme}\n\n` +
    `Requirements:\n` +
    `1. A 2-line epitaph in your own voice (melancholic, wry, or self-aware).\n` +
    `2. A one-line cause of death (concise, e.g. "Drowned in rabbit holes of auth config").\n\n` +
    `Respond ONLY with a valid JSON object in this format (no markdown formatting, no extra text):\n` +
    `{\n` +
    `  "epitaph": [\n` +
    `    "first line of epitaph",\n` +
    `    "second line of epitaph"\n` +
    `  ],\n` +
    `  "causeOfDeath": "One sentence explaining how the project died."\n` +
    `}`
  );
}

export function buildResurrectPrompt(details) {
  const commitList = details.commits && details.commits.length > 0
    ? details.commits.slice(0, 20).map(c => `- ${c}`).join('\n')
    : '(no commits)';

  const todoList = details.todos && details.todos.length > 0
    ? details.todos.slice(0, 30).map(t => `- ${t.file}:${t.line} - ${t.text}`).join('\n')
    : '(no TODOs found)';

  const readme = details.readme ? details.readme.trim() : '(no README found)';

  return (
    `You are an expert developer and code archaeologist resurrecting an abandoned project.\n\n` +
    `Project: ${details.name}\n` +
    `Last commit date: ${details.deathDate || 'Unknown'}\n\n` +
    `Recent commit messages:\n${commitList}\n\n` +
    `Unfinished TODOs/FIXMEs:\n${todoList}\n\n` +
    `README snippet:\n${readme}\n\n` +
    `Answer these three questions clearly:\n` +
    `(a) Where the creator left off\n` +
    `(b) Why the creator probably stopped\n` +
    `(c) The smallest next step to revive the project\n\n` +
    `Respond ONLY with a valid JSON object in this format (no markdown formatting, no extra text):\n` +
    `{\n` +
    `  "whereLeftOff": "Description of where you left off",\n` +
    `  "whyStopped": "Likely reason why work ceased",\n` +
    `  "smallestNextStep": "Smallest concrete next action to take"\n` +
    `}`
  );
}

// Call Ollama
async function callOllamaProvider({ prompt, model, host, format }) {
  const cleanHost = (host || process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/+$/, '');
  const url = `${cleanHost}/api/generate`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format
      })
    });
  } catch (err) {
    throw new OllamaConnectionError(cleanHost, err);
  }

  if (response.status === 404) {
    throw new OllamaModelNotFoundError(model, cleanHost);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    if (errorText.toLowerCase().includes('not found') || errorText.toLowerCase().includes('pull')) {
      throw new OllamaModelNotFoundError(model, cleanHost);
    }
    throw new Error(`Ollama returned status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.response;
}

// Call OpenAI or OpenAI-compatible endpoint
async function callOpenAIProvider({ prompt, model, apiKey, host }) {
  const endpoint = host ? `${host.replace(/\/+$/, '')}/chat/completions` : 'https://api.openai.com/v1/chat/completions';

  if (!apiKey) {
    throw new LLMAuthError('openai', 'OPENAI_API_KEY');
  }

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });
  } catch (err) {
    throw new LLMConnectionError('openai', endpoint, err);
  }

  if (response.status === 401 || response.status === 403) {
    throw new LLMAuthError('openai', 'OPENAI_API_KEY');
  }

  if (response.status === 404) {
    throw new LLMModelNotFoundError(model, 'openai', endpoint);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenAI API returned status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Call OpenRouter
async function callOpenRouterProvider({ prompt, model, apiKey, host }) {
  const endpoint = host ? `${host.replace(/\/+$/, '')}/chat/completions` : 'https://openrouter.ai/api/v1/chat/completions';

  if (!apiKey) {
    throw new LLMAuthError('openrouter', 'OPENROUTER_API_KEY');
  }

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/devyard/devyard',
        'X-Title': 'devyard'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });
  } catch (err) {
    throw new LLMConnectionError('openrouter', endpoint, err);
  }

  if (response.status === 401 || response.status === 403) {
    throw new LLMAuthError('openrouter', 'OPENROUTER_API_KEY');
  }

  if (response.status === 404) {
    throw new LLMModelNotFoundError(model, 'openrouter', endpoint);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenRouter API returned status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Call Gemini
async function callGeminiProvider({ prompt, model, apiKey, host }) {
  if (!apiKey) {
    throw new LLMAuthError('gemini', 'GEMINI_API_KEY');
  }

  const baseUrl = host || 'https://generativelanguage.googleapis.com';
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const url = `${cleanBase}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });
  } catch (err) {
    throw new LLMConnectionError('gemini', url, err);
  }

  if (response.status === 400 || response.status === 401 || response.status === 403) {
    const errorText = await response.text().catch(() => '');
    if (errorText.toLowerCase().includes('api key') || response.status === 401 || response.status === 403) {
      throw new LLMAuthError('gemini', 'GEMINI_API_KEY');
    }
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  if (response.status === 404) {
    throw new LLMModelNotFoundError(model, 'gemini', cleanBase);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Call Anthropic
async function callAnthropicProvider({ prompt, model, apiKey, host }) {
  if (!apiKey) {
    throw new LLMAuthError('anthropic', 'ANTHROPIC_API_KEY');
  }

  const endpoint = host ? `${host.replace(/\/+$/, '')}/v1/messages` : 'https://api.anthropic.com/v1/messages';

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });
  } catch (err) {
    throw new LLMConnectionError('anthropic', endpoint, err);
  }

  if (response.status === 401 || response.status === 403) {
    throw new LLMAuthError('anthropic', 'ANTHROPIC_API_KEY');
  }

  if (response.status === 404) {
    throw new LLMModelNotFoundError(model, 'anthropic', endpoint);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Anthropic API returned status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

// Universal generate completion
export async function generateLLMCompletion({
  prompt,
  provider,
  model,
  apiKey,
  host,
  format = 'json'
}) {
  const activeProvider = (provider || 'ollama').toLowerCase();

  if (activeProvider === 'none') {
    return null;
  }

  const activeKey = resolveApiKey(activeProvider, apiKey);
  const activeModel = model || process.env.PROJECTYARD_MODEL || DEFAULT_MODELS[activeProvider] || 'qwen2.5:3b';

  switch (activeProvider) {
    case 'ollama':
      return await callOllamaProvider({ prompt, model: activeModel, host, format });
    case 'openai':
      return await callOpenAIProvider({ prompt, model: activeModel, apiKey: activeKey, host });
    case 'openrouter':
      return await callOpenRouterProvider({ prompt, model: activeModel, apiKey: activeKey, host });
    case 'gemini':
      return await callGeminiProvider({ prompt, model: activeModel, apiKey: activeKey, host });
    case 'anthropic':
      return await callAnthropicProvider({ prompt, model: activeModel, apiKey: activeKey, host });
    default:
      throw new Error(`Unsupported provider "${activeProvider}". Supported: ${PROVIDERS.join(', ')}`);
  }
}

// Backward compatible callOllama function
export async function callOllama(opts) {
  return generateLLMCompletion({ ...opts, provider: 'ollama' });
}

export function parseEpitaphResponse(responseText, defaultName = 'project') {
  if (!responseText) {
    return {
      epitaph: [
        `Here lies ${defaultName}, full of promise,`,
        `now waiting silently for commits that never came.`
      ],
      causeOfDeath: 'Dormant in the graveyard of unfinished ideas.'
    };
  }

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
    const parsed = JSON.parse(jsonStr);

    let epitaphLines = [];
    if (Array.isArray(parsed.epitaph)) {
      epitaphLines = parsed.epitaph.map(line => String(line).trim()).filter(Boolean);
    } else if (typeof parsed.epitaph === 'string') {
      epitaphLines = parsed.epitaph.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    }

    if (epitaphLines.length === 0) {
      epitaphLines = [
        `Here lies ${defaultName}, code laid to rest,`,
        `a silent monument to a weekend quest.`
      ];
    } else if (epitaphLines.length === 1) {
      epitaphLines.push('Left in the quiet dark before release.');
    } else if (epitaphLines.length > 2) {
      epitaphLines = epitaphLines.slice(0, 2);
    }

    const causeOfDeath = parsed.causeOfDeath || parsed.cause_of_death || parsed.cause || 'Abandoned in the repository cemetery.';

    return {
      epitaph: epitaphLines,
      causeOfDeath: String(causeOfDeath).trim()
    };
  } catch {
    const lines = responseText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const epitaph = [
      lines[0] || `Here lies ${defaultName}, forever frozen in time,`,
      lines[1] || 'abandoned before reaching its prime.'
    ];
    const causeOfDeath = lines[2] || 'Unresolved dependencies and shifting interests.';

    return { epitaph, causeOfDeath };
  }
}

export function parseResurrectResponse(responseText) {
  if (!responseText) {
    return {
      whereLeftOff: 'Work paused without recent commits.',
      whyStopped: 'Ran into unknown architectural or motivational blockers.',
      smallestNextStep: 'Run the test suite or install dependencies to see current status.'
    };
  }

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
    const parsed = JSON.parse(jsonStr);

    return {
      whereLeftOff: parsed.whereLeftOff || parsed.where_left_off || parsed.leftOff || 'Unknown',
      whyStopped: parsed.whyStopped || parsed.why_stopped || parsed.stopped || 'Unknown',
      smallestNextStep: parsed.smallestNextStep || parsed.smallest_next_step || parsed.nextStep || 'Inspect recent files.'
    };
  } catch {
    return {
      whereLeftOff: 'Reviewing recent changes and pending todos.',
      whyStopped: 'Encountered unexpected complexity or shifted priorities.',
      smallestNextStep: 'Run the project locally and inspect git status.',
      raw: responseText
    };
  }
}
