import { callLLM } from './call-llm';
import { evaluateResponse } from './evaluate-response';
import { EvaluationRunResult, EvaluationRunResultWithoutScore, PrivateLLMEvaluationRequest } from './types';

export const runEvaluation = async (body: PrivateLLMEvaluationRequest) => {
  const response = await callLLM({
    prompt: body.prompt,
    model: body.model,
    configuration: {
      temperature: body.configuration?.temperature,
      maxTokens: body.configuration?.maxTokens || 1024,
      frequencyPenalty: body.configuration?.frequencyPenalty,
      presencePenalty: body.configuration?.presencePenalty,
    },
  });
  const evaluationResult = await evaluateResponse({
    actualResponse: response.content as string,
    expectedResponse: body.evaluationDataSetRow.expectedResponse,
  });
  const evaluationRunResult: EvaluationRunResult | EvaluationRunResultWithoutScore = {
    score: evaluationResult.score || 0,
    scoreDetails: evaluationResult.scoreDetails,
    content: response.content as string,
    duration: response.duration,
    tokenUsage: response.tokenUsage,
  };
  return evaluationRunResult;
};
