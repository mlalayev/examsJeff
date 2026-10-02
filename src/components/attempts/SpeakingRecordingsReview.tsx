"use client";

import { useState } from "react";
import { speakingAnswerAudioUrl, speakingAnswerText, resolveSpeakingAudioSrc } from "@/lib/speaking-answer";

export type SpeakingRecordingReview = { questionId: string; prompt: string; answer: unknown };

export async function requestSavedTranscript(attemptId: string, questionId: string) {
  const res = await fetch(`/api/attempts/${attemptId}/speaking/transcribe`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId }), signal: AbortSignal.timeout(55000),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Transcript could not be generated. The audio is still saved.");
  return result;
}

export function SpeakingRecordingsReview({ attemptId, recordings, canTranscribe, onUpdated }: {
  attemptId: string; recordings: SpeakingRecordingReview[]; canTranscribe: boolean; onUpdated: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  if (!recordings.length) return null;
  return <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-4 mb-6">
    <h2 className="text-lg font-semibold">Speaking recordings and transcripts</h2>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {recordings.map((recording, index) => {
      const audioUrl = speakingAnswerAudioUrl(recording.answer);
      const text = speakingAnswerText(recording.answer);
      return <details key={recording.questionId} className="rounded-lg border border-gray-200 p-3">
        <summary className="cursor-pointer font-medium">{index + 1}. {recording.prompt}</summary>
        <div className="mt-3 space-y-3">
          {audioUrl ? <audio controls preload="none" src={resolveSpeakingAudioSrc(audioUrl)} className="w-full" /> : <p>No recording saved.</p>}
          {text ? <div><h3 className="text-sm font-semibold">Transcript</h3><p className="whitespace-pre-wrap text-sm">{text}</p></div> : <p className="text-sm text-amber-800">Transcript has not been generated yet.</p>}
          {audioUrl && !text && canTranscribe && <button type="button" disabled={busy !== null} className="rounded bg-[#303380] px-3 py-2 text-sm text-white disabled:opacity-50" onClick={async () => {
            setBusy(recording.questionId); setError("");
            try { await requestSavedTranscript(attemptId, recording.questionId); await onUpdated(); }
            catch (e) { setError(e instanceof Error ? e.message : "Transcription failed"); }
            finally { setBusy(null); }
          }}>{busy === recording.questionId ? "Generating transcript…" : "Generate transcript"}</button>}
        </div>
      </details>;
    })}
  </section>;
}
