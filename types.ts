
export interface PromptTemplate {
    name: string;
    description?: string;
    code: string;
}

export interface PromptTemplateVersion {
    promptTemplateId: string;
    version: number;
    prompt: string;
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

export interface EvaluationRunResultWithoutScore extends Omit<EvaluationRunResult, "score" | "scoreDetails"> { }

export interface EvaluationRequest {
    prompt: string,
    model: string,
    evaluationDataSetRow: EvaluationDataSetRow,
    promptTemplateVersion: PromptTemplateVersion,
    promptTemplate: PromptTemplate,
    evaluationDataSet: EvaluationDataSet
}