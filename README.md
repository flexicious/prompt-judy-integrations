This is a companion project for Prompt Judy

[Prompt Judy](https://promptjudy.com)
[Prompt Judy Lambda Genie](https://promptjudy.lambdagenie.com)

Prompt Judy is an AI-powered prompt evaluation framework.

This project allows prompt judy to call LLM's that are internal to your network,
as well as perform evaluations that require access to private resources on your network.

## How to run

```bash
npm run dev
```

This will start the server on port 3001.
The main file has a form post endpoint at `http://localhost:3001/` that you can provide to Prompt Judy.

## Setup

Please review code in `main.ts` to see how to start the server, and the contract for the evaluation request.
The types.ts file contains the types for the evaluation request and response.

When an evaluation run is run in Prompt Judy, and you choose "Custom Provider" as the LLM, and give it
the url of this server, it will send a POST request to this server with the evaluation request.

This server will then run the evaluation, and send the evaluation run result back to Prompt Judy.

The evaluation request is of type `EvaluationRequest`, and the evaluation run result is of type `EvaluationRunResult` or `EvaluationRunResultWithoutScore`.

Please see the types.ts file for more details. You can choose to implement your own evaluation logic, or let Prompt Judy handle the evaluation. Return an object of type `EvaluationRunResult` or `EvaluationRunResultWithoutScore` depending on your implementation.

If you want Prompt Judy to handle the evaluation, you can return an object of type `EvaluationRunResultWithoutScore`. Prompt Judy will then run the evaluation and score the response.

## How to implement your own evaluation and LLM logic

In this example, we proxy the request to AWS bedrock - please see `call-llm.ts` for more details.
Here, you can implement any LLM call. We then use Titan text embeddings to evaluate cosine similarity between the response and the expected response, please see `evaluate-response.ts` for more details. Again, you can choose to implement your own evaluation logic.

## Bulk upload

This server also sets up a index page to upload a json file. This is useful for bulk uploading evaluation data. Please see `file-upload.ts` for more details. In this example, we call the same evaluation logic for each row in the json file described above. You can download the evaluation-request.json file from Prompt Judy, upload it here, and download the evaluation-response.json file, which contains the evaluation results. You can then upload this file back to Prompt Judy to see the evaluation results. The request file is an array of `EvaluationRequest`, and the response file should be an array of `EvaluationRunResult` or `EvaluationRunResultWithoutScore`. This page is accessible at `http://localhost:3001/`.

## Support

If you have any questions, please contact us at support@flexicious.com.
