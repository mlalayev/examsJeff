import OpenAI from "openai";

let openaiSingleton: OpenAI | null = null;

/** Lazy init so `next build` does not require OPENAI_API_KEY at module load time */
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  if (!openaiSingleton) {
    openaiSingleton = new OpenAI({ apiKey });
  }
  return openaiSingleton;
}
