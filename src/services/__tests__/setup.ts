/// <reference types="vite/client" />

// Make this a module
export {};

// Mock environment variables for tests
const mockEnv: ImportMetaEnv = {
  MODE: 'test',
  VITE_FIREBASE_API_KEY: 'mock-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'mock-auth-domain',
  VITE_FIREBASE_PROJECT_ID: 'mock-project-id',
  VITE_FIREBASE_STORAGE_BUCKET: 'mock-storage-bucket',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'mock-sender-id',
  VITE_FIREBASE_APP_ID: 'mock-app-id',
  VITE_OPENAI_API_KEY: 'mock-openai-key',
  BASE_URL: '/',
  DEV: false,
  PROD: false,
  SSR: false
};

// Mock import.meta.env for Vite environment
(global as any).import = {
  meta: {
    env: mockEnv
  }
}; 