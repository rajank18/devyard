// Backward-compatibility wrapper for src/llm.js
export {
  PROVIDERS,
  DEFAULT_MODELS,
  OllamaConnectionError,
  OllamaModelNotFoundError,
  LLMConnectionError,
  LLMAuthError,
  LLMModelNotFoundError,
  buildEpitaphPrompt,
  buildResurrectPrompt,
  callOllama,
  generateLLMCompletion,
  parseEpitaphResponse,
  parseResurrectResponse,
  resolveApiKey,
  detectAvailableCloudProvider
} from './llm.js';
