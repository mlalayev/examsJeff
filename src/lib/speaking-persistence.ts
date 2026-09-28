"use client";

// Recording owners register a stop-and-save operation. Navigation must await it.
const recordings = new Map<string, Map<string, () => Promise<void>>>();
export function registerSpeakingRecorder(attemptId: string, questionId: string, finish: () => Promise<void>) {
  const owners = recordings.get(attemptId) ?? new Map();
  recordings.set(attemptId, owners);
  owners.set(questionId, finish);
  return () => { if (owners.get(questionId) === finish) owners.delete(questionId); };
}
export async function flushSpeakingRecordings(attemptId: string) {
  await Promise.all(Array.from(recordings.get(attemptId)?.values() ?? []).map((finish) => finish()));
}

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("speaking-recordings", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("pending");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function pendingRecording(key: string, action: "get" | "put" | "delete", blob?: Blob): Promise<Blob | undefined> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("pending", action === "get" ? "readonly" : "readwrite");
      const store = tx.objectStore("pending");
      const request = action === "get" ? store.get(key) : action === "put" ? store.put(blob, key) : store.delete(key);
      tx.oncomplete = () => resolve(action === "get" ? request.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
