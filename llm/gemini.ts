import { type CachedContent, GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai';
import { getEnv, retryWithExponentialBackoff } from './llmProxy';
import { LLMPromptParams, TokenUsage } from './types';

const googleGeminiCachedItems = new Map<string, [CachedContent, Date]>();
const modelSupportsCache: Record<string, boolean> = {};
const isRateLimitedError = (error: unknown) =>
  error instanceof GoogleGenerativeAIFetchError && (error.status === 429 || error.message.includes('The model is overloaded'));
export const callGemini = async ({
  modelName,
  prompt,
  promptParts,
  systemPrompt,
  llmConfig = {},
  images,
}: LLMPromptParams): Promise<{ content: string; tokenUsage: TokenUsage; duration: number }> => {
  const { staticPart, dynamicPart } = promptParts || { staticPart: '', dynamicPart: '' };
  const apiKey = getEnv(`GEMINI_API_KEY`);
  const maxOutputTokens = llmConfig.maxTokens || 4096;
  const temperature = llmConfig.temperature || 0;
  const generationConfig = {
    temperature,
    maxOutputTokens,
  };
  const ttlSeconds = 60;
  let result;
  modelName = modelName.replace('gemini/', '');
  const callUsingGemini = async () => {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: modelName, systemInstruction: systemPrompt });
    const [response, generatedDuration] = await retryWithExponentialBackoff(
      async () =>
        model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                ...(images?.map((image) => ({
                  inlineData: {
                    mimeType: image.type || 'image/jpeg',
                    data: image.imageBinary || '',
                  },
                })) || []),
              ],
            },
          ],
          generationConfig,
        }),
      isRateLimitedError
    );
    duration = generatedDuration;
    return await response.response;
  };
  let duration = 0;
  let cacheCreationTokens = 0;
  if (((staticPart && dynamicPart) || images?.length) && modelSupportsCache[modelName] !== false) {
    try {
      const cacheKey = `${modelName}-${staticPart}-${images?.map((img) => img.path).join('-') || ''}`;
      let [cachedContent, expirationDate] = googleGeminiCachedItems.get(cacheKey) || [null, null];
      if (!cachedContent || (expirationDate && expirationDate < new Date())) {
        const cacheResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: `models/${modelName}`,
            contents: [
              {
                parts: [
                  ...(staticPart
                    ? [
                        {
                          inline_data: {
                            mime_type: 'text/plain',
                            data: Buffer.from(staticPart).toString('base64'),
                          },
                        },
                      ]
                    : []),
                  ...(images?.map((image) => ({
                    inline_data: {
                      mime_type: image.type,
                      data: image.imageBinary,
                    },
                  })) || []),
                ],
                role: 'user',
              },
            ],
            systemInstruction: systemPrompt
              ? {
                  parts: [{ text: systemPrompt }],
                }
              : undefined,
            ttl: `${ttlSeconds}s`,
          }),
        });
        if (!cacheResponse.ok) {
          const error = await cacheResponse.json();
          throw new GoogleGenerativeAIFetchError(error.error.message, cacheResponse.status, cacheResponse.statusText, error.error.details);
        }
        const cacheData = await cacheResponse.json();
        cachedContent = cacheData;
        expirationDate = new Date(Date.now() + ttlSeconds * 1000);
        if (cacheData.error) {
          console.error(cacheData.error.message);
          throw new Error(cacheData.error.message);
        }
        if (cachedContent) {
          googleGeminiCachedItems.set(cacheKey, [cachedContent, expirationDate]);
          cacheCreationTokens = cacheData.usageMetadata.totalTokenCount;
        }
      }
      const [generateResponse, generatedDuration] = await retryWithExponentialBackoff(async () => {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: staticPart ? [{ text: dynamicPart }] : [{ text: prompt }],
                role: 'user',
              },
            ],
            cachedContent: cachedContent?.name,
            generationConfig,
          }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new GoogleGenerativeAIFetchError(error.error.message, response.status, response.statusText, error.error.details);
        }
        return await response.json();
      }, isRateLimitedError);
      duration = generatedDuration;
      result = generateResponse;
    } catch (error) {
      modelSupportsCache[modelName] = false;
      console.error(error as Error, 'Unable to use cached gemini content');
      result = await callUsingGemini();
    }
  } else {
    result = await callUsingGemini();
  }
  const usage = result?.usageMetadata;
  const text = result?.candidates[0].content?.parts?.[0]?.text || '';

  const tokenUsage: TokenUsage = {
    inputTokens: usage?.promptTokenCount || 0,
    outputTokens: usage?.candidatesTokenCount || 0,
    totalTokens: usage?.totalTokenCount || 0,
    cacheReadInputTokens: usage?.cachedContentTokenCount || 0,
    cacheCreationInputTokens: cacheCreationTokens,
  };

  return { content: text || '', tokenUsage, duration };
};
