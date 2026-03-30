import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export type ModelId = 'claude' | 'gemini' | 'gpt4';

export function resolveModel(modelId?: string, apiKey?: string, baseUrl?: string) {
  switch (modelId) {
    case 'gemini': {
      const google = createGoogleGenerativeAI({
        apiKey: apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
        ...(baseUrl && { baseURL: baseUrl }),
      });
      return google('gemini-2.5-pro-preview-05-06');
    }
    case 'gpt4': {
      const openai = createOpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY || '',
        ...(baseUrl && { baseURL: baseUrl }),
      });
      return openai('gpt-4o');
    }
    case 'claude':
    default: {
      const anthropic = createAnthropic({
        apiKey: apiKey || process.env.ANTHROPIC_API_KEY || '',
        ...(baseUrl && { baseURL: baseUrl }),
      });
      return anthropic('claude-sonnet-4-20250514');
    }
  }
}
