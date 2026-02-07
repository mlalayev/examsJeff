"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Clock, Play, Check } from "lucide-react";
import { QSpeakingRecording } from "@/components/questions/QSpeakingRecording";

interface Question {
  id: string;
  qtype: string;
  prompt: any;
  options: any;
  answerKey: any;
  order: number;
  maxScore: number;
}

interface IELTSSpeakingViewProps {
  section: {
    id: string;
    type: string;
    title: string;
    questions: Question[];
  };
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  attemptId: string;
}

export function IELTSSpeakingView({
  section,
  answers,
  onAnswerChange,
  attemptId,
}: IELTSSpeakingViewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentQuestion = section.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === section.questions.length - 1;

  // Auto-move to next question when recording is complete
  const handleRecordingComplete = () => {
    if (!isLastQuestion) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setIsTransitioning(false);
      }, 1500); // 1.5 second transition
    }
  };

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Speaking Section Complete!
        </h3>
        <p className="text-gray-600">
          All questions have been answered. Move to the next section.
        </p>
      </div>
    );
  }

  // Determine part number from section title (e.g., "Speaking Part 1" -> 1)
  const partNumber = parseInt(section.title.match(/Part (\d)/)?.[1] || "1");

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-gray-900">{section.title}</span>
          </div>
          <span className="text-sm font-medium text-gray-600">
            Question {currentQuestionIndex + 1} of {section.questions.length}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentQuestionIndex + 1) / section.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Display */}
      <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-6">
          <QSpeakingRecording
            question={currentQuestion}
            value={answers[currentQuestion.id]}
            onChange={(v) => onAnswerChange(currentQuestion.id, v)}
            readOnly={false}
            attemptId={attemptId}
            speakingPart={partNumber}
            onRecordingComplete={handleRecordingComplete}
            autoStart={true} // Auto-start reading timer
          />
        </div>
      </div>

      {/* Transition Message */}
      {isTransitioning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl text-center">
            <Check className="w-16 h-16 text-green-600 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Response Recorded!
            </h3>
            <p className="text-gray-600">
              Moving to next question...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

