import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ai } from "./gemini";

const MODELS = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"];

// Circuit breaker state
let isCircuitOpen = false;
let circuitOpenTime = 0;
const CIRCUIT_COOLDOWN_MS = 60 * 1000;

export const getCircuitBreakerStatus = () => {
  const active = isCircuitOpen && (Date.now() - circuitOpenTime < CIRCUIT_COOLDOWN_MS);
  const timeLeft = active ? Math.max(0, Math.round((CIRCUIT_COOLDOWN_MS - (Date.now() - circuitOpenTime)) / 1000)) : 0;
  return { active, timeLeft };
};

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export async function executeServerSideWithReliabilityEngine<T>(
  operationName: string,
  fn: (ai: GoogleGenAI, model: string) => Promise<T>,
  targetName = "Unknown Target"
): Promise<T> {
  // Circuit Breaker Check
  if (isCircuitOpen) {
    if (Date.now() - circuitOpenTime > CIRCUIT_COOLDOWN_MS) {
      isCircuitOpen = false;
    } else {
      throw new Error("Circuit breaker active - Quota exhausted");
    }
  }

  let modelIndex = 0;
  let currentModel = MODELS[modelIndex];

  try {
    return await fn(ai, currentModel);
  } catch (error: any) {
    const errorString = JSON.stringify(error).toLowerCase();
    if (errorString.includes('429') || errorString.includes('quota')) {
      isCircuitOpen = true;
      circuitOpenTime = Date.now();
      throw error;
    }
    throw error;
  }
}
