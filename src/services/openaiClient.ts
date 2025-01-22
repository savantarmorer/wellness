import { config } from '../config';
import { getAuth } from 'firebase/auth';
import axios from 'axios';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

interface OpenAIRequest {
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  model?: string;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface OpenAIRequestConfig extends OpenAIRequest {
  context?: {
    userId: string;
    timestamp: string;
  };
}

// Create and export the client
export const openaiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'production'
    ? 'https://us-central1-lkhg-a0501.cloudfunctions.net/apiv2'
    : 'http://localhost:5001/lkhg-a0501/us-central1/apiv2',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor to handle auth
openaiClient.interceptors.request.use(async (config) => {
  try {
    const token = await getValidToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  } catch (error) {
    console.error('Error in request interceptor:', error);
    return Promise.reject(error);
  }
});

const getValidToken = async (): Promise<string> => {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error('Authentication required. Please sign in.');
  }
  
  try {
    // Get a fresh token
    const token = await auth.currentUser.getIdToken(true);
    if (!token) {
      throw new Error('Failed to get authentication token');
    }
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    throw new Error('Failed to get authentication token. Please sign in again.');
  }
};

const validateMessage = (msg: Message): boolean => {
  return (
    typeof msg.content === 'string' &&
    msg.content.trim().length > 0 &&
    ['system', 'user', 'assistant'].includes(msg.role) &&
    (!msg.name || typeof msg.name === 'string')
  );
};

export const callOpenAI = async (request: OpenAIRequestConfig): Promise<any> => {
  // Validate request
  if (!request.messages || request.messages.length === 0) {
    console.error('Invalid request:', request);
    throw new Error('Invalid request: messages array is required');
  }

  // Validate each message
  if (!request.messages.every(validateMessage)) {
    console.error('Invalid message format:', request.messages);
    throw new Error('Invalid message format: each message must have valid role and content');
  }

  let retryCount = 0;
  const maxRetries = 3;
  const retryDelay = 1000;

  while (retryCount < maxRetries) {
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Prepare standard OpenAI request format - only include OpenAI API fields
      const validatedRequest = {
        model: request.model || "gpt-4",
        messages: request.messages.map(msg => ({
          role: msg.role,
          content: String(msg.content).trim()
        })),
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 2000,
        top_p: request.top_p ?? 1,
        presence_penalty: request.presence_penalty ?? 0,
        frequency_penalty: request.frequency_penalty ?? 0
      };

      // Log request for debugging (but don't send these extra fields)
      console.log('OpenAI request payload:', {
        ...validatedRequest,
        debug: {
          userId,
          timestamp: new Date().toISOString()
        }
      });

      const response = await openaiClient.post('', validatedRequest);
      return response.data;
    } catch (error: any) {
      retryCount++;
      console.error(`Error calling OpenAI (attempt ${retryCount}):`, error);

      if (error.response?.status === 401) {
        console.error('Auth error details:', error.response);
        throw error; // Don't retry auth errors
      }

      if (retryCount === maxRetries) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
    }
  }
}; 