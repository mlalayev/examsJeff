"use client";

import { Question } from "../../types";
import { Info } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import { PromptOrderSentence } from "./prompts/PromptOrderSentence";
import { PromptShortText } from "./prompts/PromptShortText";
import { PromptEssay } from "./prompts/PromptEssay";
import { PromptFillInBlank } from "./prompts/PromptFillInBlank";
import { PromptDndGap } from "./prompts/PromptDndGap";
import { PromptInlineSelect } from "./prompts/PromptInlineSelect";
import { PromptSpeakingRecording } from "./prompts/PromptSpeakingRecording";
import { PromptImageInteractive } from "./prompts/PromptImageInteractive";
import { PromptDefault } from "./prompts/PromptDefault";

interface QuestionPromptFieldProps {
  question: Question;
  onChange: (question: Question) => void;
  uploadingImage: boolean;
  onImageUpload: (file: File) => Promise<void>;
  showAlert: (title: string, message: string, type: "error" | "warning" | "info") => void;
}

export function QuestionPromptField({
  question,
  onChange,
  uploadingImage,
  onImageUpload,
  showAlert,
}: QuestionPromptFieldProps) {
  // Route to appropriate prompt component based on question type
  const renderPromptEditor = () => {
    switch (question.qtype) {
      case "ORDER_SENTENCE":
        return <PromptOrderSentence question={question} onChange={onChange} />;
      
      case "SHORT_TEXT":
        return <PromptShortText question={question} onChange={onChange} />;
      
      case "ESSAY":
        return <PromptEssay question={question} onChange={onChange} />;
      
      case "FILL_IN_BLANK":
        return <PromptFillInBlank question={question} onChange={onChange} />;
      
      case "DND_GAP":
        return <PromptDndGap question={question} onChange={onChange} />;
      
      case "INLINE_SELECT":
        return <PromptInlineSelect question={question} onChange={onChange} />;
      
      case "SPEAKING_RECORDING":
        return <PromptSpeakingRecording question={question} onChange={onChange} />;
      
      case "IMAGE_INTERACTIVE":
        return (
          <PromptImageInteractive
            question={question}
            onChange={onChange}
            uploadingImage={uploadingImage}
            onImageUpload={onImageUpload}
            showAlert={showAlert}
          />
        );
      
      default:
        return <PromptDefault question={question} onChange={onChange} />;
    }
  };

  return (
    <div className="p-4 bg-gray-50 border-l-2 border-r-2 border-b-2 border-gray-300">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Question Text / Prompt *
      </label>
      {renderPromptEditor()}
    </div>
  );
}
