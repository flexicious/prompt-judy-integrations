import { getEnv } from "./llmProxy";
import { callOpenAi } from "./openAi"
import { TokenUsage, LLMPromptParams } from "./types";

export const callTogether = async (params: LLMPromptParams): Promise<{ content: string, tokenUsage: TokenUsage, duration: number }> => {
    const baseURL = "https://api.together.xyz/v1";
    const apiKey = getEnv(`TOGETHER_API_KEY`);
    return await callOpenAi(params, apiKey, baseURL);
}