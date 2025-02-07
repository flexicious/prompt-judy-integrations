import { ImageInfo } from "llm/types";

export interface PromptTemplate {
  name: string;
  description?: string;
  code: string;
}

export interface PromptTemplateVersion {
  promptTemplateId: string;
  version: number;
  prompt: string;
  systemPrompt?: string;
  tags?: string;
}
export interface EvaluationDataSet {
  name: string;
  description?: string;
}

export interface EvaluationDataSetRow {
  promptTemplateAttributeJson?: Record<string, unknown>;
  expectedResponse?: string;
  images?: string;
}

export interface EvaluationRunResult {
  score: number;
  scoreDetails: string;
  content: string;
  duration: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface EvaluationRunResultWithoutScore
  extends Omit<EvaluationRunResult, "score" | "scoreDetails"> { }

export interface PrivateLLMRequest {
  systemPrompt?: string;
  prompt: string;
  promptParts?: {
    staticPart: string;
    dynamicPart: string;
  };
  model: string;
  configuration?: {
    temperature: number;
    maxTokens: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  images?: ImageInfo[];
}

export interface PrivateLLMEvaluationRequest extends PrivateLLMRequest {
  evaluationDataSetRow: EvaluationDataSetRow;
  promptTemplateVersion: PromptTemplateVersion;
  promptTemplate: PromptTemplate;
  evaluationDataSet: EvaluationDataSet
  expectedResponse: string;
  actualResponse: string;
}
