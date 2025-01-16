import { BedrockEmbeddings } from "@langchain/aws";
import { cosineSimilarity } from "@langchain/core/utils/math";
import * as express from 'express';

interface EvaluationRequest {
    prompt: string;
    expectedResponse: string;
    actualResponse: string;
}

export const evaluatePromptRouter = express.Router();

evaluatePromptRouter.post('/', async (req, res) => {
    const response = await evaluatePrompt(req.body);
    res.send(response);
});




const evaluatePrompt = async (requestBody: string) => {
    try {
        const { expectedResponse, actualResponse }: EvaluationRequest =
            JSON.parse(requestBody);


        const embeddings = new BedrockEmbeddings({
            region: process.env.AWS_REGION || "us-east-1",
            // credentials: {
            //     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            // }, // Uncomment this if you want to use AWS credentials from environment variables
            // otherwise it will use credentials from the ~/.aws/credentials file
            model: "amazon.titan-embed-text-v1",


        });
        const expectedEmbedding = await embeddings.embedQuery(expectedResponse);
        const actualEmbedding = await embeddings.embedQuery(actualResponse);

        const similarity = cosineSimilarity([expectedEmbedding], [actualEmbedding]);
        return JSON.stringify({
            score: similarity[0],
            scoreDetails: "Cosine similarity between the expected and actual responses",
        });
    } catch (error) {
        console.error("Error evaluating prompt:", error);
        return JSON.stringify({ error: "Failed to evaluate prompt" });
    }
}

