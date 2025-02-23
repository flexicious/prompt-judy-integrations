import {
  BedrockRuntimeClient,
  ContentBlock,
  ConverseCommand,
  ConverseCommandInput,
  ImageFormat,
  SystemContentBlock,
  ThrottlingException,
} from '@aws-sdk/client-bedrock-runtime';
import { getEnv, retryWithExponentialBackoff } from './llmProxy';
import { TokenUsage, LLMPromptParams, ImageInfo } from './types';

export const callBedrock = async ({
  modelName,
  prompt,
  promptParts,
  systemPrompt,
  images,
  llmConfig = {},
}: LLMPromptParams): Promise<{ content: string; tokenUsage: TokenUsage; duration: number }> => {
  const isClaude = modelName.includes('claude');
  const client = new BedrockRuntimeClient({
    region: getEnv('AWS_REGION'),
    // credentials: {
    //     accessKeyId: getEnv('AWS_ACCESS_KEY_ID'),
    //     secretAccessKey: getEnv('AWS_SECRET_ACCESS_KEY')
    // }
  });
  const nonNullImages: ImageInfo[] = images?.filter((image) => image.imageBinary) || [];
  const getImageFormat = (image: ImageInfo) => {
    if (image.type?.includes('png')) return ImageFormat.PNG;
    if (image.type?.includes('jpeg')) return ImageFormat.JPEG;
    if (image.type?.includes('gif')) return ImageFormat.GIF;
    if (image.type?.includes('webp')) return ImageFormat.WEBP;
    return ImageFormat.PNG;
  };

  const imageBlocks: ContentBlock.ImageMember[] = nonNullImages.map((image) => ({
    image: {
      format: getImageFormat(image),
      source: {
        bytes: Buffer.from(image.imageBinary || '', 'base64'),
      },
    },
  }));

  const messages: ConverseCommandInput['messages'] = [];

  if (promptParts?.staticPart && promptParts?.dynamicPart) {
    messages.push({
      role: 'user',
      content: [
        {
          text: promptParts.staticPart,
        },
        ...(imageBlocks || []),
        // { "cachePoint": { "type": "default" } }, It does not appear this is supported just yet.
        { text: promptParts.dynamicPart },
      ],
    });
  } else {
    messages.push({
      role: 'user',
      content: [{ text: prompt }, ...(imageBlocks || [])],
    });
  }

  const isRateLimitedError = (error: unknown) => error instanceof ThrottlingException;

  const [response, duration] = await retryWithExponentialBackoff(
    async () =>
      client.send(
        new ConverseCommand({
          modelId: modelName,
          messages,
          system: systemPrompt ? [{ text: systemPrompt }] : [],
          inferenceConfig: {
            maxTokens: llmConfig.maxTokens || 4096,
            temperature: llmConfig.temperature || 0,
          },
        })
      ),
    isRateLimitedError
  );

  const responseContent = response.output?.message?.content?.[0]?.text || 'No content';
  const usage = response.usage as any;
  const tokenUsage: TokenUsage = usage
    ? {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
        totalTokens: (usage.inputTokens || 0) + (usage.outputTokens || 0),
        cacheReadInputTokens: 'cacheReadInputTokens' in usage ? (usage.cacheReadInputTokens as number) : 0,
        cacheCreationInputTokens: 'cacheCreationInputTokens' in usage ? (usage.cacheCreationInputTokens as number) : 0,
      }
    : {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        cacheReadInputTokens: 0,
        cacheCreationInputTokens: 0,
      };

  return {
    content: responseContent,
    tokenUsage,
    duration,
  };
};
