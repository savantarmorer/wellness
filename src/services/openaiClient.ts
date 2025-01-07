import { config } from '../config';
import { getAuth } from 'firebase/auth';
import axios from 'axios';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
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

export const callOpenAI = async (request: OpenAIRequest): Promise<any> => {
  // Get authentication token
  const auth = getAuth();
  console.log('Auth state:', {
    currentUser: auth.currentUser?.uid,
    isAuthenticated: !!auth.currentUser,
  });

  if (!auth.currentUser) {
    console.error('No authenticated user found');
    throw new Error('Authentication required. Please sign in.');
  }

  // Always force a token refresh to ensure we have a valid token
  try {
    await auth.currentUser.reload();
    const idToken = await auth.currentUser.getIdToken(true);
    console.log('Token retrieved:', idToken ? 'Token present' : 'No token');
    
    if (!idToken) {
      console.error('Failed to get authentication token');
      throw new Error('Authentication required. Please sign in again.');
    }

    const requestBody = {
      systemPrompt: request.messages.find(m => m.role === 'system')?.content || '',
      userPrompt: request.messages.find(m => m.role === 'user')?.content || '',
      temperature: request.temperature || 0.7,
    };

    console.log('Making API request to:', process.env.NODE_ENV === 'production'
      ? 'https://us-central1-lkhg-a0501.cloudfunctions.net/apiv2'
      : 'http://localhost:5001/lkhg-a0501/us-central1/apiv2');
    console.log('Request headers:', {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer [token present]',
      'Origin': window.location.origin
    });

    const response = await fetch(process.env.NODE_ENV === 'production'
      ? 'https://us-central1-lkhg-a0501.cloudfunctions.net/apiv2'
      : 'http://localhost:5001/lkhg-a0501/us-central1/apiv2', {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        'Origin': window.location.origin
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });

      if (response.status === 401) {
        // Try to get a fresh token one more time
        try {
          await auth.currentUser.reload();
          const newToken = await auth.currentUser.getIdToken(true);
          if (newToken) {
            console.log('Token refreshed, retrying request...');
            const retryResponse = await fetch(process.env.NODE_ENV === 'production'
              ? 'https://us-central1-lkhg-a0501.cloudfunctions.net/apiv2'
              : 'http://localhost:5001/lkhg-a0501/us-central1/apiv2', {
              method: 'POST',
              mode: 'cors',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${newToken}`,
                'Origin': window.location.origin
              },
              body: JSON.stringify(requestBody),
            });

            if (!retryResponse.ok) {
              throw new Error(`API request failed: ${retryResponse.statusText}`);
            }

            return await retryResponse.json();
          }
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          throw new Error('Authentication failed. Please sign in again.');
        }
      }

      throw new Error(`API request failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('OpenAI API error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to make API request');
  }
}; 