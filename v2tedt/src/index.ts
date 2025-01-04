/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";

admin.initializeApp();

const openai = new OpenAI({
  apiKey: functions.config().openai.key,
  dangerouslyAllowBrowser: true,
});

export const generateAnalysis = onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  try {
    const {systemPrompt, userPrompt, temperature = 0.7} = req.body;

    if (!systemPrompt || !userPrompt) {
      res.status(400).json({error: "Missing required parameters"});
      return;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {role: "system", content: systemPrompt},
        {role: "user", content: userPrompt},
      ],
      temperature,
    });

    res.json({result: completion.choices[0].message.content});
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    res.status(500).json({error: "Failed to generate analysis"});
  }
});
