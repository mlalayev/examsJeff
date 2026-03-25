import OpenAI from "openai";

let openaiSingleton: OpenAI | null = null;

/** Lazy init so `next build` does not require OPENAI_API_KEY at module load time */
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  if (!openaiSingleton) {
    openaiSingleton = new OpenAI({
      apiKey,
      timeout: 60000, // 60 seconds timeout
      maxRetries: 3, // Retry failed requests 3 times
    });
  }
  return openaiSingleton;
}

/**
 * Helper to handle OpenAI API errors with better error messages
 */
export function handleOpenAIError(error: any): never {
  if (error?.status === 429) {
    throw new Error(
      "OpenAI API rate limit exceeded. Please wait a few minutes and try again."
    );
  }
  if (error?.status === 401) {
    throw new Error("OpenAI API key is invalid. Please check your configuration.");
  }
  if (error?.status === 503) {
    throw new Error("OpenAI API is temporarily unavailable. Please try again later.");
  }
  if (error?.code === "ECONNABORTED" || error?.name === "AbortError") {
    throw new Error("Request timeout. The AI scoring took too long. Please try again.");
  }
  throw error;
}
