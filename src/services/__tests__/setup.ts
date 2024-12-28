// Make this a module
export {};

// Mock environment variables
process.env.VITE_OPENAI_API_KEY = 'test-api-key';

// Mock window.env for browser environment
(global as any).window = {
  env: {
    VITE_OPENAI_API_KEY: 'test-api-key'
  }
}; 