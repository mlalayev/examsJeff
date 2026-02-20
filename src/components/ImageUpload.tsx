"use client";

import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
  showUrlInput?: boolean;
  showHelperText?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  label = "Image",
  className = "",
  showUrlInput = true,
  showHelperText = true,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      // Convert to base64 data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onChange(dataUrl);
        setUploading(false);
      };
      reader.onerror = () => {
        alert("Failed to read file");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}
      </label>

      <div className="space-y-2">
        {/* File Input Button */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Choose Image"}
          </button>

          {value && (
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200 transition-colors"
            >
              <X className="w-4 h-4" />
              Remove
            </button>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* URL Input (alternative) */}
        {showUrlInput && (
          <div>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Or paste image URL"
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
            />
          </div>
        )}

        {/* Preview */}
        {value && (
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-start gap-3">
              <ImageIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 mb-2">Preview:</p>
                <img
                  src={value}
                  alt="Preview"
                  className="max-w-full h-auto max-h-48 rounded border border-gray-300"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {showHelperText && (
          <p className="text-xs text-gray-500">
            Upload from computer or paste URL • Max 5MB • JPG, PNG, GIF
          </p>
        )}
      </div>
    </div>
  );
}









