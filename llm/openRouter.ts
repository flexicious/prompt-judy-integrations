import { getEnv } from './llmProxy';
import { LLMPromptParams } from './types';
import { callOpenAi } from './openAi';
import { TokenUsage } from './types';

export const callOpenRouter = async (params: LLMPromptParams): Promise<{ content: string; tokenUsage: TokenUsage; duration: number }> => {
  const baseURL = 'https://openrouter.ai/api/v1';
  const apiKey = getEnv(`OPENROUTER_API_KEY`);
  return await callOpenAi(params, apiKey, baseURL);
};
