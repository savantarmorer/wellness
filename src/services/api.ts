import axios from 'axios';
import { auth } from './firebase';
import type { DailyAssessment, User } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Assessment API calls
export const assessmentApi = {
  submitAssessment: async (assessment: Partial<DailyAssessment>) => {
    const response = await api.post('/assessments', assessment);
    return response.data;
  },

  getAssessments: async (startDate: string, endDate: string) => {
    const response = await api.get('/assessments', {
      params: { startDate, endDate },
    });
    return response.data as DailyAssessment[];
  },

  getTodaysAssessment: async () => {
    const response = await api.get('/assessments/today');
    return response.data as DailyAssessment | null;
  },
};

// User API calls
export const userApi = {
  updateProfile: async (userData: Partial<User>) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },

  connectPartner: async (partnerEmail: string) => {
    const response = await api.post('/users/connect-partner', { partnerEmail });
    return response.data;
  },

  updatePreferences: async (preferences: { preferredScale: 5 | 10; notifications: boolean }) => {
    const response = await api.put('/users/preferences', preferences);
    return response.data;
  },
};

// Statistics API calls
export const statisticsApi = {
  getStatistics: async (timeRange: 'week' | 'month' | 'year') => {
    const response = await api.get('/statistics', {
      params: { timeRange },
    });
    return response.data;
  },

  getCategoryBreakdown: async () => {
    const response = await api.get('/statistics/categories');
    return response.data;
  },
};

// GPT API calls
export const gptApi = {
  getFeedback: async (assessmentId: string) => {
    const response = await api.get(`/gpt/feedback/${assessmentId}`);
    return response.data;
  },

  getWeeklySummary: async () => {
    const response = await api.get('/gpt/weekly-summary');
    return response.data;
  },
};

// Error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          // Handle unauthorized
          break;
        case 403:
          // Handle forbidden
          break;
        case 404:
          // Handle not found
          break;
        default:
          // Handle other errors
          break;
      }
    }
    return Promise.reject(error);
  }
); 