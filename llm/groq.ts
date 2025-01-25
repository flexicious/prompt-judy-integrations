import { getEnv } from "./llmProxy";
import { callOpenAi } from "./openAi"
import { TokenUsage, LLMPromptParams } from "./types";

export const callGroq = async (params: LLMPromptParams): Promise<{ content: string, tokenUsage: TokenUsage, duration: number }> => {
    const baseURL = "https://api.groq.com/openai/v1"
    const apiKey = getEnv(`GROQ_API_KEY`);
    return await callOpenAi(params, apiKey, baseURL);
}