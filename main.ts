import * as cors from "cors";
import * as express from "express";
import * as fileUpload from "express-fileupload";
import { createServer } from "http";
import * as path from "path";
import * as dotenv from 'dotenv';
import {
    PrivateLLMRequest,
    EvaluationRequest,
    EvaluationRunResult,
    EvaluationRunResultWithoutScore,
} from "types";
import { runEvaluation } from "./utils";
import { evaluateResponse } from "./evaluate-response";
import { callLLM } from "./call-llm";
import { getAllModelIdentifiers } from "./llm/langchain";

// Load environment variables
dotenv.config();

const app = express();

app.use(express.json());
app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "https://promptjudy.com",
            "https://promptjudy.lambdagenie.com",
        ],
        methods: ["GET", "POST"],
    })
);

app.use(fileUpload());

const httpServer = createServer(app);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/assets/index.html"));
});
app.post("/call-llm", async (req, res) => {
    try {
        const body: PrivateLLMRequest = req.body;
        const evaluationRunResult = await callLLM(body);
        res.send(evaluationRunResult);
    } catch (error) {
        res.status(500).send({ error: "Failed to process request" });
    }
});
app.post("/sample-post", (req, res) => {
    res.send({
        message: "Hello World",
    });
});
app.post("/evaluate-response", async (req, res) => {
    const body: {
        expectedResponse: string;
        actualResponse: string;
    } = req.body as EvaluationRequest;
    try {
        const { score, scoreDetails } = await evaluateResponse(body);
        res.send({ score, scoreDetails });
    } catch (error) {
        res.status(500).send({ error: "Failed to process request" });
    }
});

app.post("/process-upload", async (req, res) => {
    if (!req.files || !req.files.file) {
        res.status(400).send("No file uploaded");
        return;
    }
    const fileContent = req.files.file as fileUpload.UploadedFile;
    const json = fileContent.data.toString("utf-8");
    const data = JSON.parse(json) as EvaluationRequest[];
    if (!Array.isArray(data)) {
        res.status(400).send("Invalid file format");
        return;
    }
    const evaluationRunResults: (
        | EvaluationRunResult
        | EvaluationRunResultWithoutScore
    )[] = [];
    const requiredFields = [
        "prompt",
        "model",
        "evaluationDataSetRow",
        "promptTemplateVersion",
        "promptTemplate",
        "evaluationDataSet",
    ];
    for (const item of data) {
        if (!requiredFields.every((field) => field in item)) {
            res.status(400).send("Invalid file format");
            return;
        }
        const result = await runEvaluation(item);
        evaluationRunResults.push(result);
    }
    res.send(evaluationRunResults);
});

app.get("/models", (req, res) => {
    res.send(getAllModelIdentifiers());
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on("SIGTERM", () => {
    console.log("Shutting down...");
    httpServer.close(() => {
        console.log("Server shutdown complete");
        process.exit(0);
    });
});
