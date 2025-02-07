import { LLMModels, LLMPromptParams, LLMProviderEnum, TokenUsage } from "./types";
import { callAnthropic } from "./anthropic";
import { callOpenAi } from "./openAi";
import { callGemini } from "./gemini";
import { callTogether } from "./together";
import { callGroq } from "./groq";
import { callOpenRouter } from "./openRouter";
import { callBedrock } from "./bedrock";
import { callAzureOpenAi } from "./azure";
export const getEnv = (key: string) => {
    if (!process.env[key]) {
        throw new Error(`${key} is not available`);
    }
    return process.env[key];
}

export async function callLlmPrompt(provider: LLMProviderEnum, params: LLMPromptParams): Promise<{ content: string, tokenUsage: TokenUsage, duration: number }> {
    if (provider === LLMProviderEnum.OpenAI) {
        return await callOpenAi(params);
    } else if (provider === LLMProviderEnum.Anthropic) {
        return await callAnthropic(params);
    } else if (provider === LLMProviderEnum.GoogleGemini) {
        return await callGemini(params);
    } else if (provider === LLMProviderEnum.AzureOpenAi) {
        return await callAzureOpenAi(params);
    } else if (provider === LLMProviderEnum.Together) {
        return await callTogether(params);
    } else if (provider === LLMProviderEnum.Groq) {
        return await callGroq(params);
    } else if (provider === LLMProviderEnum.OpenRouter) {
        return await callOpenRouter(params);
    } else if (provider === LLMProviderEnum.AwsBedrock) {
        return await callBedrock(params);
    } else {
        throw new Error(`Unsupported provider: ${provider}`);
    }
}
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const retryWithExponentialBackoff = async <T>(
    func: () => Promise<T>,
    isRateLimitedError: (error: unknown) => boolean,
    {
        initialDelay = 1000,
        exponentialBase = 2,
        jitter = true,
        maxRetries = 3,
    } = {},
): Promise<[T, number]> => {
    let numRetries = 0;
    let delay = initialDelay;

    while (true) {
        try {
            const start = performance.now();
            const result = await func();
            const duration = performance.now() - start;
            return [result, duration];
        } catch (error) {
            numRetries++;
            if (numRetries > maxRetries) {
                throw new Error(`Maximum number of retries (${maxRetries}) exceeded.`);
            }
            console.error("Error in retryWithExponentialBackoff, retry at", numRetries, error);
            if (isRateLimitedError(error)) {
                const jitterValue = jitter ? (1 + Math.random()) : 1;
                delay *= exponentialBase * jitterValue;
                await sleep(delay);
                continue;
            }
            throw error;
        }
    }
}

export const getAllModelIdentifiers = () => {
    const allProviders = Object.values(LLMProviderEnum);
    const allModels = allProviders.map(provider => {
        const models = LLMModels[provider];
        return models.map(modelName => `${provider}/${modelName}`);
    }).flat();
    return allModels.join(",");
}