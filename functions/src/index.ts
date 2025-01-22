/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import cors = require('cors');

admin.initializeApp();

const ALLOWED_ORIGINS = [
  'https://lkhg-a0501.web.app',
  'http://localhost:3000',
  'http://localhost:5000'
];

// Update CORS configuration
const corsHandler = cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
});

interface OpenAIError {
  name: string;
  message: string;
  stack?: string;
  response?: {
    data?: unknown;
  };
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

interface RequestBody {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export const apiv2 = onRequest(async (request, response) => {
  // Set CORS headers for all responses
  response.set('Access-Control-Allow-Origin', request.headers.origin || ALLOWED_ORIGINS[0]);
  response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.set('Access-Control-Allow-Credentials', 'true');
  response.set('Access-Control-Max-Age', '86400');

  return corsHandler(request, response, async () => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    try {
      // Verify auth token
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        response.status(401).send('Unauthorized');
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      await admin.auth().verifyIdToken(token);

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const body = request.body as RequestBody;
      
      // Validate required fields
      if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
        response.status(400).send({ error: 'Messages array is required' });
        return;
      }

      if (!body.model) {
        response.status(400).send({ error: 'Model is required' });
        return;
      }

      // Forward request to OpenAI
      const completion = await openai.chat.completions.create({
        model: body.model,
        messages: body.messages,
        temperature: body.temperature ?? 0.7,
        max_tokens: body.max_tokens ?? 2000,
        top_p: body.top_p ?? 1,
        frequency_penalty: body.frequency_penalty ?? 0,
        presence_penalty: body.presence_penalty ?? 0
      });

      // Extract and validate the analysis from the response
      const analysisText = completion.choices[0]?.message?.content;
      if (!analysisText) {
        response.status(500).send({ error: 'Empty response from OpenAI' });
        return;
      }

      try {
        // Try to parse the response as JSON
        let analysis = JSON.parse(analysisText);

        // Validate required fields based on the CONSENSUS_FORM_ANALYSIS_PROMPT structure
        if (!analysis.overallAnalysis || !analysis.categoryAnalysis) {
          response.status(500).send({ 
            error: 'Invalid analysis structure',
            details: 'Missing required fields in analysis response'
          });
          return;
        }

        // Ensure all required fields have default values if missing
        analysis = {
          overallAnalysis: {
            score: analysis.overallAnalysis.score || 0,
            trend: analysis.overallAnalysis.trend || 'stable',
            summary: analysis.overallAnalysis.summary || '',
            riskLevel: analysis.overallAnalysis.riskLevel || 'low'
          },
          categoryAnalysis: analysis.categoryAnalysis || {},
          progressionAnalysis: {
            improvements: analysis.progressionAnalysis?.improvements || [],
            concerns: analysis.progressionAnalysis?.concerns || [],
            trends: analysis.progressionAnalysis?.trends || {}
          },
          therapeuticInsights: {
            immediateActions: analysis.therapeuticInsights?.immediateActions || [],
            longTermStrategies: analysis.therapeuticInsights?.longTermStrategies || [],
            underlyingIssues: analysis.therapeuticInsights?.underlyingIssues || []
          },
          consistencyAnalysis: {
            alignedAreas: analysis.consistencyAnalysis?.alignedAreas || [],
            discrepancies: analysis.consistencyAnalysis?.discrepancies || [],
            possibleMotivations: analysis.consistencyAnalysis?.possibleMotivations || []
          },
          recommendations: {
            communication: analysis.recommendations?.communication || [],
            exercises: analysis.recommendations?.exercises || [],
            professionalSupport: analysis.recommendations?.professionalSupport || []
          }
        };

        // Return the validated and structured analysis
        response.json({
          id: completion.id,
          object: completion.object,
          created: completion.created,
          model: completion.model,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify(analysis)
            },
            finish_reason: completion.choices[0]?.finish_reason
          }],
          usage: completion.usage
        });
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        response.status(500).send({ 
          error: 'Failed to parse analysis',
          details: parseError instanceof Error ? parseError.message : 'Unknown error'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      const err = error as OpenAIError;
      response.status(500).json({
        error: err.message,
        details: err.response?.data
      });
    }
  });
});
