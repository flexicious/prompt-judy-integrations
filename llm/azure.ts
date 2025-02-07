import { AzureOpenAI } from "openai";
import { getEnv } from './llmProxy';
import { runOpenAi } from "./openAi";
import { LLMPromptParams, TokenUsage } from './types';


export const callAzureOpenAi = async (
    { modelName, prompt, systemPrompt, llmConfig = {} }: LLMPromptParams,
): Promise<{ content: string; tokenUsage: TokenUsage; duration: number }> => {

    const endpoint = getEnv('AZURE_OPENAI_ENDPOINT');
    const apiKey = getEnv('AZURE_OPENAI_API_KEY');
    const deployment = getEnv('DEPLOYMENT_NAME');
    const apiVersion = getEnv('API_VERSION');

    const client = new AzureOpenAI({
        apiKey,
        endpoint,
        apiVersion,
        deployment,
        dangerouslyAllowBrowser: true,
    });

    return runOpenAi(client, { modelName, prompt, systemPrompt, llmConfig });
};
