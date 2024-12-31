import { getApiKey } from './gptService';

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface OpenAIErrorResponse {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

export const callOpenAI = async (
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as OpenAIErrorResponse;
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}\n` +
        `Type: ${errorData.error?.type}\n` +
        `Message: ${errorData.error?.message}`
      );
    }

    const data = await response.json() as OpenAIResponse;
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI API');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while calling OpenAI API');
  }
}; 