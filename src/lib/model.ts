import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export type ModelId = 'claude' | 'qwen' | 'gemini' | 'gpt4';

/** Qwen doesn't support JSON Schema responseFormat, needs mode: 'json' for generateObject */
export function needsJsonMode(modelId?: string): boolean {
  return modelId === 'qwen';
}

export function resolveModel(modelId?: string, apiKey?: string) {
  switch (modelId) {
    case 'qwen': {
      const key = apiKey || process.env.DASHSCOPE_API_KEY || '';
      const qwen = createOpenAICompatible({
        name: 'qwen',
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        headers: { Authorization: `Bearer ${key}` },
      });
      return qwen.chatModel('qwen-max');
    }
    case 'gemini': {
      const google = createGoogleGenerativeAI({ apiKey: apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '' });
      return google('gemini-2.5-pro-preview-05-06');
    }
    case 'gpt4': {
      const openai = createOpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY || '' });
      return openai('gpt-4o');
    }
    case 'claude':
    default: {
      const anthropic = createAnthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY || '' });
      return anthropic('claude-sonnet-4-20250514');
    }
  }
}
