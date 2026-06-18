import * as dotenv from 'dotenv';
dotenv.config();

export const LLM_CONFIG = {
  provider: process.env.LLM_PROVIDER || 'tongyi',
  apiKey: process.env.LLM_API_KEY || '',
  model: process.env.LLM_MODEL || 'qwen-plus',
  temperature: 0.1,
  maxTokens: 8192,
  baseUrl: process.env.LLM_BASE_URL || '',
};

export const PROVIDER_CONFIGS: Record<string, { baseUrl: string; models: string[] }> = {
  tongyi: {
    baseUrl: 'https://dashscope.aliyuncs.com/api/text-generation/v1',
    models: ['qwen-plus', 'qwen-turbo', 'qwen-max'],
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'],
  },
  claude: {
    baseUrl: 'https://api.anthropic.com/v1/messages',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/chat/completions',
    models: ['deepseek-chat', 'deepseek-coder'],
  },
};
