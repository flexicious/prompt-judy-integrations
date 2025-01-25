import OpenAI from 'openai';
import { getEnv, retryWithExponentialBackoff } from './llmProxy';
import { TokenUsage, LLMPromptParams } from './types';

export const isRateLimitedError = (error: unknown) => error instanceof OpenAI.APIError && error.status === 429;

export const callOpenAi = async ({
    modelName,
    prompt,
    systemPrompt,
    llmConfig = {},
}: LLMPromptParams, apiKey?: string, baseURL?: string): Promise<{ content: string, tokenUsage: TokenUsage, duration: number }> => {
    if (!apiKey) {
        apiKey = getEnv(`OPENAI_API_KEY`);
    }
    const client = new OpenAI({
        apiKey,
        baseURL,
        dangerouslyAllowBrowser: true
    });
    const messages: { role: 'system' | 'user', content: string }[] = [];
    if (systemPrompt) {
        messages.push({ role: 'system' as const, content: systemPrompt });
    }
    if (prompt) {
        messages.push({ role: 'user' as const, content: prompt });
    }

    const [response, duration] = await retryWithExponentialBackoff(async () =>
        client.chat.completions.create({
            messages,
            model: modelName,
            temperature: llmConfig.temperature,
            max_tokens: llmConfig.maxTokens,
            top_p: llmConfig.topP,
            frequency_penalty: llmConfig.frequencyPenalty,
            presence_penalty: llmConfig.presencePenalty,
        }),
        isRateLimitedError
    );
    const tokenUsageResponse = response.usage;
    const tokenUsage = {
        inputTokens: tokenUsageResponse?.prompt_tokens || 0,
        outputTokens: tokenUsageResponse?.completion_tokens || 0,
        totalTokens: tokenUsageResponse?.total_tokens || 0,
        cacheReadInputTokens: tokenUsageResponse?.prompt_tokens_details?.cached_tokens || 0,
        cacheCreationInputTokens: 0,
    };

    return { content: response.choices[0].message.content || '', tokenUsage, duration };
}
