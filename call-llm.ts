import { LLMProviderEnum } from "./llm/types";
import { callLlmPrompt } from "./llm/llmProxy";

export const callLLM = async ({
  prompt,
  model,
  systemPrompt,
  promptParts,
  configuration,
}: {
  prompt: string;
  model: string;
  systemPrompt?: string;
  promptParts?: {
    staticPart: string;
    dynamicPart: string;
  };
  configuration?: {
    temperature?: number;
    maxTokens?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
}) => {
  const { temperature, maxTokens, frequencyPenalty, presencePenalty } = configuration || {};
  try {


    if (!model) {
      throw new Error("Model is required");
    }
    const provider = model.split('/')[0];
    const modelIdentifier = model.split('/')[1];
    const result = await callLlmPrompt(provider as LLMProviderEnum, {
      modelName: modelIdentifier,
      systemPrompt,
      promptParts,
      prompt,
      llmConfig: {
        temperature: temperature || 0,
        maxTokens: maxTokens || 1000,
        frequencyPenalty: frequencyPenalty || 0,
        presencePenalty: presencePenalty || 0,
      },
    });
    return result;
  } catch (error) {
    console.error("Error calling LLM:", error);
    throw new Error("Error calling LLM");
  }
};
