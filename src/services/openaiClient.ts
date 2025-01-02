import OpenAI from 'openai';
import { config } from '../config';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
}

export const callOpenAI = async (request: OpenAIRequest): Promise<OpenAI.Chat.ChatCompletion> => {
  const openai = new OpenAI({
    apiKey: config.openai.apiKey,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: request.messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.max_tokens || 500,
    });

    return completion;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}; 