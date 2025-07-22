import { ChatOpenAI } from '@langchain/openai';

export function createOpenAIClient(userApiKey?: string): ChatOpenAI {
  const apiKey = userApiKey || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }
  
  return new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    temperature: 0.7,
    maxTokens: 2000,
    timeout: 60000,
    maxRetries: 3,
  });
}

export function validateOpenAIConfig(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

