import * as express from 'express';
import { createServer } from 'http';
import * as path from 'path';
import { processUploadedItem } from './file-upload';
import * as cors from 'cors';
import * as fileUpload from 'express-fileupload';
import { EvaluationRunResultWithoutScore } from 'types';
import { EvaluationRequest, EvaluationRunResult } from 'types';

const app = express();

app.use(express.json());
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://promptjudy.com',
        'https://promptjudy.lambdagenie.com',
    ],
    methods: ['GET', 'POST']
}));

app.use(fileUpload());

const httpServer = createServer(app);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/assets/index.html'));
});
app.post('/', (req, res) => {
    const body: EvaluationRequest = req.body;
    console.log(body);
    const evaluationRunResult: EvaluationRunResult | EvaluationRunResultWithoutScore = {
        score: 100,
        scoreDetails: "This is a test score",
        content: "This is a test response",
        duration: 1000,
        tokenUsage: {
            inputTokens: 100,
            outputTokens: 100,
            totalTokens: 200,
        },
    };
    res.send(evaluationRunResult);
});
app.post("/sample-post", (req, res) => {
    res.send({
        message: "Hello World",
    });
});

app.post('/process-upload', async (req, res) => {

    if (!req.files || !req.files.file) {
        res.status(400).send('No file uploaded');
        return;
    }
    const fileContent = req.files.file as fileUpload.UploadedFile;
    const json = fileContent.data.toString('utf-8');
    const data = JSON.parse(json);
    if (!Array.isArray(data)) {
        res.status(400).send('Invalid file format');
        return;
    }
    const evaluationRunResults: (EvaluationRunResult | EvaluationRunResultWithoutScore)[] = [];
    const requiredFields = ["prompt", "model", "evaluationDataSetRow", "promptTemplateVersion", "promptTemplate", "evaluationDataSet"];
    for (const item of data) {
        if (!requiredFields.every(field => field in item)) {
            res.status(400).send('Invalid file format');
            return;
        }
        const result = await processUploadedItem(item);
        evaluationRunResults.push(result);
    }
    res.send(evaluationRunResults);
});

// Start server
const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
    console.log('Shutting down...');
    httpServer.close();
    console.log('Server shutdown complete');
    process.exit(0);
});