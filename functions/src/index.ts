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

admin.initializeApp();

interface OpenAIError {
  name: string;
  message: string;
  stack?: string;
  response?: {
    data?: unknown;
  };
}

export const apiv2 = onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Max-Age", "3600");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
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
