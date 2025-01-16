import { EvaluationRequest, EvaluationRunResult } from "types";

export const processUploadedItem = async (item: EvaluationRequest): Promise<EvaluationRunResult> => {
    return {
        score: 100,
        scoreDetails: "Perfect score",
        content: "This is a test response",
        duration: 1000,
        tokenUsage: {
            inputTokens: 100,
            outputTokens: 100,
            totalTokens: 200,
        },
    }
};
