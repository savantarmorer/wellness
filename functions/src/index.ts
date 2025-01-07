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

// Update CORS configuration to allow specific origins
const corsHandler = cors({
  origin: [
    'https://lkhg-a0501.web.app',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

interface OpenAIError {
  name: string;
  message: string;
  stack?: string;
  response?: {
    data?: unknown;
  };
}

export const apiv2 = onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Validate request method
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Validate authentication
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('Invalid token format:', { authHeader });
        res.status(401).json({ error: 'Unauthorized - Invalid token format' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      try {
        // Verify and decode the token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        console.log('Token verified for user:', decodedToken.uid);

        // Log request body for debugging
        console.log("Request body:", req.body);

        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const {systemPrompt, userPrompt, temperature = 0.7} = req.body;

        if (!systemPrompt || !userPrompt) {
          console.error("Missing parameters:", {systemPrompt, userPrompt});
          res.status(400).json({error: "Missing required parameters"});
          return;
        }

        // Add JSON formatting requirement to system prompt
        const jsonInstruction = [
          "\nIMPORTANT: Response must be valid JSON without any text outside it.",
        ].join("");
        const formattedSystemPrompt = systemPrompt + jsonInstruction;

        console.log("Making OpenAI API call with params:", {
          model: "gpt-4",
          temperature,
          promptLength: {
            system: formattedSystemPrompt.length,
            user: userPrompt.length,
          },
        });

        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {role: "system", content: formattedSystemPrompt},
            {role: "user", content: userPrompt},
          ],
          temperature,
        });

        const responseContent = completion.choices[0].message.content || "";
        console.log("OpenAI API response received:", responseContent);

        // Validate JSON before sending
        try {
          // Parse and re-stringify to ensure valid JSON format
          const parsedResponse = JSON.parse(responseContent);
          res.json({result: JSON.stringify(parsedResponse)});
        } catch (parseError) {
          console.error("Invalid JSON in GPT response:", responseContent);
          res.status(500).json({
            error: "Failed to generate analysis",
            details: "Response was not valid JSON",
          });
        }
      } catch (verifyError) {
        console.error('Token verification failed:', verifyError);
        res.status(401).json({ 
          error: 'Unauthorized - Invalid token',
          details: verifyError instanceof Error ? verifyError.message : 'Unknown error'
        });
        return;
      }
    } catch (error) {
      // Log the full error details
      const err = error as OpenAIError;
      console.error("Error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack,
        response: err.response?.data,
      });
      res.status(500).json({
        error: "Failed to generate analysis",
        details: err.message,
      });
    }
  });
});
