/** Public messages deliberately exclude raw provider errors and credentials. */
export function transcriptionError(error: unknown) {
  const e = error as { status?: number; code?: string; name?: string; error?: { code?: string } };
  const code = e?.code || e?.error?.code;
  if (code === "insufficient_quota") return { code: "AI_QUOTA", error: "Audio saved. The transcription service has insufficient API credit or quota. Please contact the administrator." };
  if (e?.status === 401) return { code: "AI_AUTH", error: "Audio saved. The server's transcription API key was rejected. Please contact the administrator." };
  if (e?.status === 403 || e?.status === 404) return { code: "AI_ACCESS", error: "Audio saved. The API project does not have access to the transcription service. Please contact the administrator." };
  if (e?.status === 429) return { code: "AI_RATE_LIMIT", error: "Audio saved. The transcription service is busy. Please try again later." };
  if (e?.status === 400) return { code: "AI_AUDIO", error: "Audio saved, but the transcription service could not process the recording." };
  if (e?.name === "APIConnectionTimeoutError" || e?.name === "AbortError" || code === "ETIMEDOUT") return { code: "AI_TIMEOUT", error: "Audio saved. Transcription timed out." };
  return { code: "AI_UNAVAILABLE", error: "Audio saved. The transcription service could not be reached or returned an error." };
}
