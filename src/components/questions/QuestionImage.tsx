"use client";

interface QuestionImageProps {
  imageUrl?: string;
  alt?: string;
}

export function QuestionImage({ imageUrl, alt = "Question diagram" }: QuestionImageProps) {
  if (!imageUrl) return null;

  return (
    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <img
        src={imageUrl}
        alt={alt}
        className="max-w-full h-auto max-h-96 mx-auto rounded border border-gray-300"
        loading="lazy"
      />
    </div>
  );
}

