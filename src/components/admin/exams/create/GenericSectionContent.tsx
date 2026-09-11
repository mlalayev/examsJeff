"use client";

import { useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import type { Section } from "./types";

interface GenericSectionContentProps {
  section: Section;
  onSectionUpdate?: (updatedSection: Section) => void;
}

const VALID_AUDIO_EXTENSIONS = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".wma", ".webm"];
const MAX_AUDIO_SIZE = 52428800;

/**
 * Displays generic section content (passage for Reading, audio upload for Listening)
 */
export default function GenericSectionContent({
  section,
  onSectionUpdate,
}: GenericSectionContentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const applyAudio = (audioPath: string) => {
    const updated: Section = {
      ...section,
      audio: audioPath,
      subsections: section.subsections?.map((sub) => ({ ...sub, audio: audioPath })),
    };
    onSectionUpdate?.(updated);
  };

  const handleAudioFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);

    if (file.size > MAX_AUDIO_SIZE) {
      setUploadError(
        `Audio file is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 50MB.`
      );
      return;
    }

    const hasValidExtension = VALID_AUDIO_EXTENSIONS.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
    if (!hasValidExtension) {
      setUploadError("Please upload a valid audio file (mp3, wav, ogg, m4a, aac, flac, wma).");
      return;
    }

    setUploadingAudio(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "audio");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Failed to upload audio (${res.status})`);
      }

      applyAudio(data.path || data.publicPath);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(
        error instanceof Error
          ? error.message
          : "Network error or file too large. Please try again."
      );
    } finally {
      setUploadingAudio(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (section.type === "READING") {
    return (
      <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Reading Passage
          </label>
        </div>
        {section.passage && typeof section.passage === "string" ? (
          <div className="text-sm text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
            {section.passage.substring(0, 200)}...
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            No passage added yet. Go back to sections and click &quot;Add Passage&quot;.
          </p>
        )}
      </div>
    );
  }

  if (section.type === "LISTENING") {
    return (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <label className="text-sm font-medium text-blue-900 flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Listening Audio
          </label>
          <button
            type="button"
            disabled={uploadingAudio}
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs font-medium text-white rounded-md disabled:opacity-50"
            style={{ backgroundColor: "#303380" }}
          >
            {uploadingAudio
              ? "Uploading..."
              : section.audio
                ? "Change audio"
                : "Upload audio"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.wma,.webm"
            className="hidden"
            onChange={(e) => void handleAudioFile(e.target.files?.[0])}
          />
        </div>

        {uploadError && (
          <div className="mb-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {uploadError}
          </div>
        )}

        {section.audio ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-white rounded border border-blue-200">
              <Volume2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-sm text-gray-700 flex-1 truncate">{section.audio}</span>
              <span className="text-xs text-green-600 font-medium shrink-0">Uploaded</span>
            </div>
            <audio controls src={section.audio} className="w-full mt-1" preload="metadata" />
          </div>
        ) : (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800 font-medium">
              No audio uploaded yet. Use the Upload audio button above.
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
