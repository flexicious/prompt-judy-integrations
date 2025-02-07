import OpenAI from 'openai';
import { getEnv, retryWithExponentialBackoff } from './llmProxy';
import { TokenUsage, LLMPromptParams } from './types';
export const isRateLimitedError = (error: unknown) => error instanceof OpenAI.APIError && error.status === 429;

export const callOpenAi = async (
  { modelName, prompt, systemPrompt, llmConfig = {}, images }: LLMPromptParams,
  apiKey?: string,
  baseURL?: string
): Promise<{ content: string; tokenUsage: TokenUsage; duration: number }> => {
  if (!apiKey) {
    apiKey = getEnv(`OPENAI_API_KEY`);
  }
  const client = new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: true,
  });

  return runOpenAi(client, { modelName, prompt, systemPrompt, llmConfig, images });
};

export const runOpenAi = async (
  client: OpenAI,
  { modelName, prompt, systemPrompt, llmConfig, images }: Pick<LLMPromptParams, 'modelName' | 'prompt' | 'systemPrompt' | 'llmConfig' | 'images'>
) => {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system' as const, content: systemPrompt });
  }
  if (prompt || images?.length) {
    const userMessage: OpenAI.Chat.ChatCompletionUserMessageParam = {
      role: 'user' as const,
      content: [
        {
          type: 'text' as const,
          text: prompt || '',
        },
        ...(images?.map((image) => ({
          type: 'image_url' as const,
          image_url: { url: `data:${image.type};base64,${image.imageBinary}` },
        })) || []),
      ],
    };
    messages.push(userMessage);
  }

  const isReasoningModel = modelName.startsWith('o');
  const [response, duration] = await retryWithExponentialBackoff(
    async () =>
      client.chat.completions.create({
        messages,
        model: modelName,
        ...(!isReasoningModel
          ? {
              temperature: llmConfig.temperature,
              max_tokens: llmConfig.maxTokens,
              top_p: llmConfig.topP,
              frequency_penalty: llmConfig.frequencyPenalty,
              presence_penalty: llmConfig.presencePenalty,
            }
          : {}),
      }),
    isRateLimitedError
  );
  const tokenUsageResponse = response.usage;
  const tokenUsage = {
    inputTokens: tokenUsageResponse?.prompt_tokens || 0,
    outputTokens: tokenUsageResponse?.completion_tokens || 0,
    totalTokens: tokenUsageResponse?.total_tokens || 0,
    cacheReadInputTokens: tokenUsageResponse?.prompt_tokens_details?.cached_tokens,
    reasoningTokens: tokenUsageResponse?.completion_tokens_details?.reasoning_tokens,
  };

  return { content: response.choices[0].message.content || '', tokenUsage, duration };
};
