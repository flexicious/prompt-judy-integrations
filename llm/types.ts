export enum LLMProviderEnum {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  GoogleGemini = 'google-gemini',
  AzureOpenAi = 'azure-openai',
  AwsBedrock = 'aws-bedrock',
  Together = 'together',
  Groq = 'groq',
  OpenRouter = 'openrouter',
}
export const LLMModels = {
  [LLMProviderEnum.OpenAI]: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-16k',
    'gpt-4',
    'gpt-4-32k',
    'gpt-4-turbo',
    'o1-preview',
    'o1-mini',
  ],
  [LLMProviderEnum.Anthropic]: [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ],
  [LLMProviderEnum.GoogleGemini]: [
    'gemini-1.5-pro-002',
    'gemini-1.5-flash-002',
    'gemini-1.5-flash-8b-001',
    'gemini-2.0-flash-001',
    'gemini-2.0-flash-lite-preview-02-05',
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash-thinking-exp',
    'gemini-exp-1206',
  ],
  [LLMProviderEnum.AwsBedrock]: [
    'amazon.nova-lite-v1:0',
    'amazon.nova-micro-v1:0',
    'amazon.nova-pro-v1:0',
    'anthropic.claude-3-5-sonnet-20240620-v1:0',
    'anthropic.claude-3-sonnet-20240229-v1:0',
    'anthropic.claude-3-haiku-20240307-v1:0',
    'anthropic.claude-3-opus-20240229-v1:0',
    'anthropic.claude-v2:1',
    'anthropic.claude-v2',
    'anthropic.claude-instant-v1',
    'meta.llama3-1-405b-instruct-v1:0',
    'meta.llama3-1-70b-instruct-v1:0',
    'meta.llama3-1-8b-instruct-v1:0',
    'meta.llama3-70b-instruct-v1:0',
    'meta.llama3-8b-instruct-v1:0',
    'amazon.titan-text-lite-v1',
    'amazon.titan-text-express-v1',
    'cohere.command-text-v14',
    'ai21.j2-mid-v1',
    'ai21.j2-ultra-v1',
    'ai21.jamba-instruct-v1:0',
    'meta.llama2-13b-chat-v1',
    'meta.llama2-70b-chat-v1',
    'mistral.mistral-7b-instruct-v0:2',
    'mistral.mixtral-8x7b-instruct-v0:1',
  ],
  [LLMProviderEnum.Together]: [
    'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
    'meta-llama/Meta-Llama-3-8B-Instruct-Turbo',
    'meta-llama/Meta-Llama-3-70B-Instruct-Turbo',
    'meta-llama/Llama-3.2-3B-Instruct-Turbo',
    'meta-llama/Meta-Llama-3-8B-Instruct-Lite',
    'meta-llama/Meta-Llama-3-70B-Instruct-Lite',
    'meta-llama/Llama-3-8b-chat-hf',
    'meta-llama/Llama-3-70b-chat-hf',
    'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF',
    'Qwen/Qwen2.5-Coder-32B-Instruct',
    'Qwen/QwQ-32B-Preview',
    'microsoft/WizardLM-2-8x22B',
    'google/gemma-2-27b-it',
    'google/gemma-2-9b-it',
    'databricks/dbrx-instruct',
    'deepseek-ai/deepseek-llm-67b-chat',
    'deepseek-ai/DeepSeek-V3',
    'google/gemma-2b-it',
    'Gryphe/MythoMax-L2-13b',
    'meta-llama/Llama-2-13b-chat-hf',
    'mistralai/Mistral-7B-Instruct-v0.1',
    'mistralai/Mistral-7B-Instruct-v0.2',
    'mistralai/Mistral-7B-Instruct-v0.3',
    'mistralai/Mixtral-8x7B-Instruct-v0.1',
    'mistralai/Mixtral-8x22B-Instruct-v0.1',
    'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO',
    'Qwen/Qwen2.5-7B-Instruct-Turbo',
    'Qwen/Qwen2.5-72B-Instruct-Turbo',
    'Qwen/Qwen2-72B-Instruct',
    'Qwen/Qwen2-VL-72B-Instruct',
    'upstage/SOLAR-10.7B-Instruct-v1.0',
  ],
  [LLMProviderEnum.Groq]: [
    'gemma2-9b-it',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'llama-guard-3-8b',
    'llama3-70b-8192',
    'llama3-8b-8192',
    'mixtral-8x7b-32768',
  ],
  [LLMProviderEnum.OpenRouter]: [
    'databricks/dbrx-instruct',
    'deepseek/deepseek-chat-v2.5',
    'deepseek/deepseek-chat',
    'cognitivecomputations/dolphin-mixtral-8x7b',
    'cognitivecomputations/dolphin-mixtral-8x22b',
    'eva-unit-01/eva-llama-3.33-70b',
    'eva-unit-01/eva-qwen-2.5-32b',
    'eva-unit-01/eva-qwen-2.5-72b',
    'qwen/qwen-2-72b-instruct',
    'qwen/qwen-2-7b-instruct',
    'qwen/qwen-2-7b-instruct:free',
    'qwen/qwen-2-vl-72b-instruct',
    'qwen/qwen-2-vl-7b-instruct',
    'qwen/qwen-2.5-72b-instruct',
    'qwen/qwen-2.5-7b-instruct',
    'qwen/qwen-2.5-coder-32b-instruct',
    'qwen/qvq-72b-preview',
    'qwen/qwq-32b-preview',
  ],
  [LLMProviderEnum.AzureOpenAi]: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-16k',
    'gpt-4',
    'gpt-4-32k',
    'gpt-4-turbo',
    'o1',
    'o1-mini',
    'o3-mini',
  ],
};

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cacheReadInputTokens?: number;
  cacheCreationInputTokens?: number;
}

export interface LLMConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}
export interface LLMPromptParams {
  modelName: string;
  prompt: string;
  systemPrompt?: string;
  promptParts?: {
    staticPart: string;
    dynamicPart: string;
  };
  llmConfig: LLMConfig;
  images?: ImageInfo[];
}
export interface ImageInfo {
  path: string;
  description?: string;
  width?: number;
  height?: number;
  size?: number;
  data?: string;
  name?: string;
  type?: string;
  imageBinary?: string;
}
