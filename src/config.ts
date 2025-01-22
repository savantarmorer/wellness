// Configuration for both test and development environments
declare const global: {
  import?: {
    meta: {
      env: Record<string, string>;
    };
  };
};

const getEnvVar = (key: string): string => {
  // In test environment, use mock values
  if (process.env.NODE_ENV === 'test') {
    return `mock-${key.toLowerCase()}`;
  }
  
  // In development/production, use Vite's import.meta.env
  // @ts-ignore - Vite's import.meta.env is available at runtime
  return import.meta.env[key] || '';
};

export const config = {
  firebase: {
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
    authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnvVar('VITE_FIREBASE_APP_ID')
  },
  openai: {
    apiKey: getEnvVar('VITE_OPENAI_API_KEY')
  }
}; 