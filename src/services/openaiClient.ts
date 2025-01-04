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

export const callOpenAI = async (request: OpenAIRequest): Promise<any> => {
  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://us-central1-lkhg-a0501.cloudfunctions.net/apiv2'
    : 'http://localhost:5001/lkhg-a0501/us-central1/apiv2';
  const requestBody = {
    systemPrompt: request.messages.find(m => m.role === 'system')?.content || '',
    userPrompt: request.messages.find(m => m.role === 'user')?.content || '',
    temperature: request.temperature || 0.7,
  };

  console.log('Making API request to:', apiUrl);
  console.log('Request body:', requestBody);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.status === 403) {
      console.error('CORS error - Access denied');
      throw new Error('Access denied. CORS error.');
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        console.error('API Error response:', errorData);
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('API Response data:', data);

    if (!data.result) {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from API');
    }

    return {
      choices: [{
        message: {
          content: data.result
        }
      }]
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}; 