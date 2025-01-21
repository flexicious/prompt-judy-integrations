This is a companion project for Prompt Judy

[Prompt Judy](https://promptjudy.com)
[Prompt Judy Lambda Genie](https://promptjudy.lambdagenie.com)

Prompt Judy is an AI-powered prompt evaluation framework.

This project allows prompt judy to call LLM's that are internal to your network,
as well as perform evaluations that require access to private resources on your network.

Note, this endpoint will be called directly by your browser - so it does not need to be a public endpoint. In fact, usually, this is implemented as a localhost endpoint, or an internal endpoint that you can access from your browser. Prompt Judy does not need to be able to access this endpoint, we only care about the response that can be used to evaluate the prompt.

For an endpoint to be used as an LLM provider in Prompt Judy, it must have the following endpoints:

- `/call-llm` - This is the endpoint that Prompt Judy will call to get the evaluation request. It must take a `PrivateLLMRequest` object, and return a `EvaluationRunResult` or `EvaluationRunResultWithoutScore` object. If you return `EvaluationRunResultWithoutScore`, Prompt Judy will run the evaluation and score the response. The evaluation could be either custom call back into your server, or it could be handled by Prompt Judy.

For an endpoint to be used as an evaluation provider in Prompt Judy, it must have the following endpoints:

- `/evaluate-response` - This is the endpoint that Prompt Judy will call to get the evaluation result. It must take a `EvaluationRequest` object, and return a `EvaluationRunResult` object. Note that the `EvaluationRequest` object contains the `actualResponse` field, which is the response from the LLM, and the `expectedResponse` field, which is the expected response from the LLM, in addition to the `PrivateLLMRequest` fields.

Additionally, if you want bulk upload to work, you must have the following endpoints:

- `/process-upload` - This will get a file that has an array of `PrivateLLMRequest`, and return an array of `EvaluationRunResult` that can be uploaded back to Prompt Judy. Note, this endpoint does not support `EvaluationRunResultWithoutScore` - when you upload the results back to Prompt Judy, you must upload the results of the evaluation, including the score and score details.

## How to run

```bash
npm run dev
```

This will start the server on port 3001.
The main file has a form post endpoint at `http://localhost:3001/call-llm` that you can provide to Prompt Judy as a custom-private llm provider.

It also has a form post endpoint at `http://localhost:3001/evaluate-response` that you can provide to Prompt Judy as a custom-private evaluation provider.

## Setup

Please review code in `main.ts` to see how to start the server, and the contract for the evaluation request.
The types.ts file contains the types for the evaluation request and response.

When an evaluation run is run in Prompt Judy, and you choose "Custom Provider" as the LLM, and give it
the url of this server, it will send a POST request to this server with the evaluation request.

The evaluation request is of type `EvaluationRequest`, and the evaluation run result is of type `EvaluationRunResult` or `EvaluationRunResultWithoutScore`.

Please see the types.ts file for more details. You can choose to implement your own evaluation logic, or let Prompt Judy handle the evaluation. Return an object of type `EvaluationRunResult` or `EvaluationRunResultWithoutScore` depending on your implementation.

If you want Prompt Judy to handle the evaluation, you can return an object of type `EvaluationRunResultWithoutScore`. Prompt Judy will then run the evaluation and score the response.

## How to implement your own evaluation and LLM logic

In this example, we proxy the request to Gemini - please see `call-llm.ts` for more details.
Here, you can implement any LLM call. We then use the `evaluate-response.ts` to evaluate the response - which in this case is a sql statement that we validate against our local sqlite database - you could use any database, or any evaluation logic here, please see `evaluate-response.ts` for more details.

## Bulk upload

This server also sets up a index page to upload a json file. This is useful for bulk uploading evaluation data. Please see `file-upload.ts` for more details. In this example, we call the same evaluation logic for each row in the json file described above. You can download the evaluation-request.json file from Prompt Judy, upload it here, and download the evaluation-response.json file, which contains the evaluation results. You can then upload this file back to Prompt Judy to see the evaluation results. The request file is an array of `EvaluationRequest`, and the response file should be an array of `EvaluationRunResult` or `EvaluationRunResultWithoutScore`. This page is accessible at `http://localhost:3001/`.

## Support

If you have any questions, please contact us at support@flexicious.com.
