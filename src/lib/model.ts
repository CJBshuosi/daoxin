import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const qwen = createOpenAICompatible({
  name: 'qwen',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  headers: {
    Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY ?? ''}`,
  },
});

export type ModelId = 'claude' | 'qwen' | 'gemini' | 'gpt4';

export function resolveModel(modelId?: string) {
  switch (modelId) {
    case 'qwen':
      return qwen.chatModel('qwen-max');
    case 'gemini':
      return google('gemini-2.5-pro-preview-05-06');
    case 'gpt4':
      return openai('gpt-4o');
    case 'claude':
    default:
      return anthropic('claude-sonnet-4-20250514');
  }
}
