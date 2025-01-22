import { callLangChainPrompt } from "./llm/langchain";

export const callLLM = async ({
  prompt,
  model,
  configuration,
}: {
  prompt: string;
  model: string;
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
    const result = await callLangChainPrompt({
      modelName: model,
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
