import { ChatOpenAI, ChatOpenAICallOptions } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { ChatTogetherAI } from "@langchain/community/chat_models/togetherai";
import { ChatBedrockConverse } from "@langchain/aws";
import { LLMModels, LLMProviderEnum, } from "./types";
import { BaseMessageLike, HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
    GoogleAICacheManager,
} from "@google/generative-ai/server";
import { CachedContent } from "@google/generative-ai";
import { GoogleGenerativeAI } from '@google/generative-ai';
let googleAICacheManager: GoogleAICacheManager | null = null;
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
    modelIdentifier: string;
    prompt: string;
    systemPrompt?: string;
    promptParts?: {
        staticPart?: string;
        dynamicPart?: string;
    };
    llmConfig: LLMConfig;
}

interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cacheReadInputTokens?: number;
    cacheCreationInputTokens?: number;
}
export async function callLangChainPrompt({
    modelIdentifier,
    prompt,
    systemPrompt,
    promptParts,
    llmConfig = {}
}: LangChainPromptParams): Promise<{ content: string, tokenUsage: TokenUsage, duration: number }> {
    const model = await createLangChainModel(modelIdentifier, llmConfig);
    const startTime = performance.now();

    const response = await invokeModel({
        provider: modelIdentifier.split('/')[0] as LLMProviderEnum,
        model,
        modelIdentifier,
        prompt,
        promptParts,
        systemPrompt
    });
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Extract and normalize token usage based on provider format
    //unfortunately, all model providers have different token usage formats - so this is a bit of a mess
    let tokenUsage: TokenUsage;
    const metadata = "response_metadata" in response ? response.response_metadata : null;
    if ("tokenUsage" in response) {
        tokenUsage = response.tokenUsage;
    } else if ("usage_metadata" in response && response.usage_metadata && response.usage_metadata.input_tokens) {
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
            totalTokens: usage.input_tokens + usage.output_tokens,
            cacheCreationInputTokens: usage.cache_creation_input_tokens,
            cacheReadInputTokens: usage.cache_read_input_tokens
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
const googleGeminiCachedItems = new Map<string, [CachedContent, Date]>();
export const invokeModel = async (
    {
        provider,
        model,
        modelIdentifier,
        prompt,
        promptParts,
        systemPrompt
    }: {
        provider: LLMProviderEnum,
        model: ChatBedrockConverse | ChatTogetherAI | ChatGroq | ChatOpenAI<ChatOpenAICallOptions> | ChatAnthropic | ChatGoogleGenerativeAI,
        modelIdentifier: string,
        prompt: string,
        promptParts?: {
            staticPart?: string;
            dynamicPart?: string;
        },
        systemPrompt?: string
    }
) => {

    const { staticPart, dynamicPart } = promptParts || { staticPart: "", dynamicPart: "" };
    if (staticPart && dynamicPart) {
        const isAnthropic = provider === LLMProviderEnum.Anthropic || (
            provider === LLMProviderEnum.AwsBedrock && modelIdentifier.includes('claude')
        )
        if (isAnthropic) {
            const { staticPart, dynamicPart } = promptParts || { staticPart: "", dynamicPart: "" };
            const messages = [];
            if (systemPrompt) {
                messages.push(new SystemMessage({
                    content: [
                        {
                            type: "text",
                            text: systemPrompt,
                            cache_control: { type: "ephemeral" },
                        },
                    ],
                }));
            }
            if (staticPart && dynamicPart) {
                messages.push(
                    new HumanMessage({
                        content: [
                            {
                                type: "text",
                                text: staticPart,
                                cache_control: { type: "ephemeral" },
                            },
                        ],
                    }),
                    new HumanMessage(dynamicPart)
                )
            } else {
                messages.push(new HumanMessage(prompt))
            }
            return await model.invoke(messages);
        } else if (provider === LLMProviderEnum.GoogleGemini) {
            // Unfortunately, calling langchain does not seem to give us cached content usage
            // (model as ChatGoogleGenerativeAI).useCachedContent(cachedContent);
            // return model.invoke([new HumanMessage(dynamicPart)]);
            // So we need to use the google gemini api directly
            try {
                if (!googleAICacheManager) {
                    googleAICacheManager = new GoogleAICacheManager(getEnv(`GEMINI_API_KEY`));
                }
                let [cachedContent, expirationDate] = googleGeminiCachedItems.get(`${systemPrompt}-${staticPart}`) || [null, null];
                if (!cachedContent || expirationDate < new Date()) {
                    const ttlSeconds = 60;
                    const modelId = modelIdentifier.replace('google-gemini/', 'models/');
                    //should be something like "models/gemini-1.5-flash-001" - gemini-1.5-flash wont work.
                    cachedContent = await googleAICacheManager.create({
                        model: modelId,
                        displayName: staticPart.slice(0, 100),
                        systemInstruction: systemPrompt,
                        contents: [
                            {
                                role: "user",
                                parts: [
                                    {
                                        text: staticPart,
                                    },
                                ],
                            },
                        ],
                        ttlSeconds,
                    });
                    googleGeminiCachedItems.set(`${systemPrompt}-${staticPart}`, [cachedContent, new Date(Date.now() + ttlSeconds * 1000)]);
                }
                const genAI = new GoogleGenerativeAI(getEnv(`GEMINI_API_KEY`));
                const genModel = genAI.getGenerativeModelFromCachedContent(cachedContent);
                const result = await genModel.generateContent({
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                {
                                    text: dynamicPart,
                                },
                            ],
                        },
                    ],
                });
                const content = result.response.text();
                const metadata = result.response.usageMetadata;
                return {
                    content,
                    tokenUsage: {
                        inputTokens: metadata.promptTokenCount,
                        outputTokens: metadata.candidatesTokenCount,
                        totalTokens: metadata.totalTokenCount,
                        cacheReadInputTokens: metadata.cachedContentTokenCount
                    },
                    duration: 0
                };

            } catch (error) {
                console.error("Error using cached content, using fallback", error);
                return await model.invoke([systemPrompt ? new SystemMessage(systemPrompt) : null, new HumanMessage(prompt)].filter(Boolean) as BaseMessageLike[]);
            }
        }
    }

    return await model.invoke([systemPrompt ? new SystemMessage(systemPrompt) : null, new HumanMessage(prompt)].filter(Boolean) as BaseMessageLike[]);
}

export const getAllModelIdentifiers = () => {
    const allProviders = Object.values(LLMProviderEnum);
    const allModels = allProviders.map(provider => {
        const models = LLMModels[provider];
        return models.map(modelName => `${provider}/${modelName}`);
    }).flat();
    return allModels.join(",");
}