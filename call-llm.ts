import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

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


    const llm = new ChatGoogleGenerativeAI({
      model,
      temperature: temperature || 0,
      maxRetries: 2,
      apiKey: process.env.GEMINI_API_KEY,
    });

    const startTime = new Date();
    const result = await llm.invoke(["human", prompt]);
    const resultText = result.content;

    const duration = new Date().getTime() - startTime.getTime();

    return {
      content: resultText,
      duration: duration,
      tokenUsage: {
        inputTokens: result.usage_metadata?.input_tokens,
        outputTokens: result.usage_metadata?.output_tokens,
        totalTokens: result.usage_metadata?.total_tokens,
      },
    };
  } catch (error) {
    console.error("Error calling LLM:", error);
    throw new Error("Error calling LLM");
  }
};
