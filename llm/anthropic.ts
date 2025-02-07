import Anthropic from '@anthropic-ai/sdk';
import { getEnv, retryWithExponentialBackoff } from './llmProxy';
import { TokenUsage, LLMPromptParams } from './types';

export const callAnthropic = async ({
  modelName,
  prompt,
  promptParts,
  systemPrompt,
  llmConfig = {},
  images,
}: LLMPromptParams): Promise<{ content: string; tokenUsage: TokenUsage; duration: number }> => {
  const { staticPart, dynamicPart } = promptParts || { staticPart: '', dynamicPart: '' };

  const client = new Anthropic({
    dangerouslyAllowBrowser: true,
    apiKey: getEnv('ANTHROPIC_API_KEY'),
  });

  const messages: Anthropic.Messages.MessageParam[] = [];
  const imageMessages: Anthropic.Messages.ImageBlockParam[] =
    images?.map((image) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: image.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: image.imageBinary || '',
      },
      cache_control: { type: 'ephemeral' },
    })) || [];
  if (staticPart && dynamicPart) {
    messages.push({
      role: 'user' as const,
      content: [{ type: 'text', text: staticPart, cache_control: { type: 'ephemeral' } }],
    });
    imageMessages.forEach((imageMessage) => {
      messages.push({
        role: 'user' as const,
        content: [imageMessage],
      });
    });

    const dynamicContent = Array.isArray(dynamicPart) ? dynamicPart.map((item) => item.text || item).join('\n') : dynamicPart;

    messages.push({
      role: 'user' as const,
      content: [{ type: 'text' as const, text: dynamicContent }],
    });
  } else {
    const promptContent = Array.isArray(prompt) ? prompt.map((item) => item.text || item).join('\n') : prompt;

    messages.push({
      role: 'user' as const,
      content: [{ type: 'text', text: promptContent }],
    });
    imageMessages.forEach((imageMessage) => {
      messages.push({
        role: 'user' as const,
        content: [imageMessage],
      });
    });
  }

  const isRateLimitedError = (error: unknown) => error instanceof Anthropic.RateLimitError;
  const [response, duration] = await retryWithExponentialBackoff(
    async () =>
      client.messages.create({
        system: systemPrompt,
        messages,
        model: modelName,
        max_tokens: llmConfig.maxTokens || 4096,
        temperature: llmConfig.temperature || 0,
      }),
    isRateLimitedError
  );

  const tokenUsage: TokenUsage = {
    inputTokens: response.usage?.input_tokens || 0,
    outputTokens: response.usage?.output_tokens || 0,
    totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
    cacheReadInputTokens: response.usage?.cache_read_input_tokens || 0,
    cacheCreationInputTokens: response.usage?.cache_creation_input_tokens || 0,
  };

  return {
    content: 'text' in response.content[0] ? response.content[0].text : 'No content',
    tokenUsage,
    duration,
  };
};
