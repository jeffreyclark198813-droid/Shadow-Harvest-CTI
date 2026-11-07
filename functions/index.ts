import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Gemini Client
// Assuming process.env.GEMINI_API_KEY is available in the Cloud Function environment
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export const geminiProxy = onRequest({ cors: true }, async (req, res) => {
  // 1. Authenticate the request
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).send("Unauthorized");
    return;
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (!decodedToken.uid) {
      res.status(401).send("Unauthorized");
      return;
    }
  } catch (error) {
    res.status(401).send("Unauthorized");
    return;
  }

  // 2. Handle Gemini Request
  try {
    const { method, params } = req.body;

    if (method === 'generateContent') {
      const response = await ai.models.generateContent(params);
      res.status(200).json(response);
    } else if (method === 'generateContentStream') {
        const stream = await ai.models.generateContentStream(params);
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        for await (const chunk of stream) {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        res.end();
    } else {
      res.status(400).send(`Unsupported method: ${method}`);
    }
  } catch (error) {
    console.error("Gemini Proxy Error", error);
    res.status(500).send("Internal Server Error");
  }
});
