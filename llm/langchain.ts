import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { ChatTogetherAI } from "@langchain/community/chat_models/togetherai";
import { ChatBedrockConverse } from "@langchain/aws";
import { LLMModels, LLMProviderEnum, } from "./types";
import { HumanMessage } from "@langchain/core/messages";
interface LLMConfig {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
}
const getEnv = (key: string) => {
    if (!process.env[key]) {
        throw new Error(`${key} is not available`);
    }
    return process.env[key];
}

export async function createLangChainModel(
    modelIdentifier: string,
    llmConfig: LLMConfig = {
        temperature: 0,
        maxTokens: 1000,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
    }
) {
    const allProviders = Object.values(LLMProviderEnum);
    const allModels = allProviders.flatMap(provider =>
        LLMModels[provider].map(modelName => [provider, modelName])
    );
    const model = allModels.find(([provider, modelName]) => `${provider}/${modelName}` === modelIdentifier);
    if (!model) {
        throw new Error(`Model ${modelIdentifier} not found`);
    }

    const [provider, modelName] = model;
    switch (provider) {
        case LLMProviderEnum.OpenAI:
            return new ChatOpenAI({
                openAIApiKey: getEnv(`OPENAI_API_KEY`),
                model: modelName,
                temperature: llmConfig.temperature,
                maxTokens: llmConfig.maxTokens,
                topP: llmConfig.topP,
                frequencyPenalty: llmConfig.frequencyPenalty,
                presencePenalty: llmConfig.presencePenalty,
            });

        case LLMProviderEnum.Anthropic:
            return new ChatAnthropic({
                anthropicApiKey: getEnv(`ANTHROPIC_API_KEY`),
                model: modelName,
                temperature: llmConfig.temperature,
                maxTokens: llmConfig.maxTokens,
                topP: llmConfig.topP,
            });

        case LLMProviderEnum.GoogleGemini:
            return new ChatGoogleGenerativeAI({
                apiKey: getEnv(`GEMINI_API_KEY`),
                model: modelName.replace('gemini/', ''), // Remove 'gemini/' prefix
                temperature: llmConfig.temperature,
                maxOutputTokens: llmConfig.maxTokens,
                topP: llmConfig.topP,
            });

        case LLMProviderEnum.AwsBedrock:
            return new ChatBedrockConverse({
                credentials: {
                    accessKeyId: getEnv(`AWS_ACCESS_KEY_ID`),
                    secretAccessKey: getEnv(`AWS_SECRET_ACCESS_KEY`),
                },
                region: getEnv(`AWS_REGION`),
                model: modelName.replace('bedrock/', ''), // Remove 'bedrock/' prefix
                temperature: llmConfig.temperature,
                maxTokens: llmConfig.maxTokens,
                topP: llmConfig.topP,
            });

        case LLMProviderEnum.Together:
            return new ChatTogetherAI({
                model: modelName,
                temperature: llmConfig.temperature,
                maxTokens: llmConfig.maxTokens,
                topP: llmConfig.topP,
                apiKey: getEnv(`TOGETHER_API_KEY`),
            });

        case LLMProviderEnum.Groq:
            return new ChatGroq({
                model: modelName,
                temperature: llmConfig.temperature,
                maxTokens: llmConfig.maxTokens,
                apiKey: getEnv(`GROQ_API_KEY`),
            });
        default:
            throw new Error(`Unsupported LLM provider: ${provider}`);
    }
}

export interface LangChainPromptParams {
    modelName: string;
    prompt: string;
    llmConfig: LLMConfig;
}

interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
}

export async function callLangChainPrompt({
    modelName,
    prompt,
    llmConfig = {}
}: LangChainPromptParams): Promise<{ content: string, tokenUsage: TokenUsage, duration: number }> {
    const model = await createLangChainModel(modelName, llmConfig);
    const startTime = performance.now();

    const response = await (model.invoke([new HumanMessage(prompt)]));
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Extract and normalize token usage based on provider format
    let tokenUsage: TokenUsage;
    const metadata = response.response_metadata;
    if (response.usage_metadata && response.usage_metadata.input_tokens) {
        tokenUsage = {
            inputTokens: response.usage_metadata.input_tokens,
            outputTokens: response.usage_metadata.output_tokens,
            totalTokens: response.usage_metadata.total_tokens
        };
    } else if (metadata?.["tokenUsage"]) {
        const usage = metadata["tokenUsage"];
        tokenUsage = {
            inputTokens: usage.promptTokens,
            outputTokens: usage.completionTokens,
            totalTokens: usage.totalTokens
        };
    } else if (metadata?.["token_usage"]) {  // OpenAI format
        const usage = metadata["token_usage"];
        tokenUsage = {
            inputTokens: usage.prompt_tokens,
            outputTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens
        };
    } else if (metadata?.["usage"]) {  // Anthropic format
        const usage = metadata["usage"];
        tokenUsage = {
            inputTokens: usage.input_tokens,
            outputTokens: usage.output_tokens,
            totalTokens: usage.input_tokens + usage.output_tokens
        };
    } else {
        tokenUsage = {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0
        };
    }

    return {
        content: response.content as string,
        tokenUsage,
        duration
    };
}

export const getAllModelIdentifiers = () => {
    const allProviders = Object.values(LLMProviderEnum);
    const allModels = allProviders.map(provider => {
        const models = LLMModels[provider];
        return models.map(modelName => `${provider}/${modelName}`);
    }).flat();
    return allModels.join(",");
}