import { HumanMessage } from "@langchain/core/messages";
import { BedrockChat } from "@langchain/community/chat_models/bedrock";

import * as express from 'express';

export const callLLMRouter = express.Router();

callLLMRouter.post('/', async (req, res) => {
    const response = await callLLM(req.body);
    res.send(response);
});



export interface CallLLMRequest {
    messages: HumanMessage[];
    model: string;
    temperature: number;
    maxTokens: number;
    frequencyPenalty: number;
    presencePenalty: number;
}
const callLLM = async (requestBody: string) => {
    try {
        const {
            messages,
            model,
            temperature,
            maxTokens,
            frequencyPenalty,
            presencePenalty,
        } = JSON.parse(requestBody) as CallLLMRequest;

        const chat = new BedrockChat({
            model: model || "anthropic.claude-3-5-sonnet-20241022-v2:0", // Default to Claude v2
            region: process.env.AWS_REGION || "us-east-1",
            // credentials: {
            //     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            // }, // Uncomment this if you want to use AWS credentials from environment variables 
            // otherwise it will use credentials from the ~/.aws/credentials file
            temperature: temperature,
            maxTokens: maxTokens,
            modelKwargs: {
                frequency_penalty: frequencyPenalty,
                presence_penalty: presencePenalty,
            },
        });

        const response = await chat.invoke(messages);

        return JSON.stringify({ response });
    } catch (error) {
        console.error("Error calling LLM:", error);
        return JSON.stringify({ error: "Failed to call LLM" });
    }
} 