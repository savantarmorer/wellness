/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import express from "express";
import type {Request, Response} from "express";
import cors = require("cors");
import fetch from 'node-fetch';

admin.initializeApp();
const app = express();
app.use(cors({origin: true}));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generateAnalysis", async (req: Request, res: Response): Promise<void> => {
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

const corsHandler = cors({ origin: true });

export const getNearbyPlaces = functions.https.onRequest((request, response) => {
  return corsHandler(request, response, async () => {
    try {
      const { location, type, radius } = request.query;
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;

      if (!location || !type || !apiKey) {
        response.status(400).json({ error: 'Missing required parameters' });
        return;
      }

      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius || 5000}&type=${type}&key=${apiKey}`;
      
      const placesResponse = await fetch(url);
      const data = await placesResponse.json();

      response.json(data);
    } catch (error) {
      console.error('Error fetching places:', error);
      response.status(500).json({ error: 'Internal server error' });
    }
  });
});

export const api = functions.https.onRequest(app);
