"use client";

import React from "react";

interface ProgressBarProps {
  answered: number;
  total: number;
  percentage: number;
}

export const ProgressBar = React.memo(function ProgressBar({ answered, total, percentage }: ProgressBarProps) {
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs mb-1"
           style={{ color: 'rgba(48, 51, 128, 0.7)' }}>
        <span>Progress</span>
        <span>
          {answered} / {total} questions
        </span>
      </div>
      <div className="w-full rounded-full h-2"
           style={{ backgroundColor: 'rgba(48, 51, 128, 0.1)' }}>
        <div 
          className="h-2 rounded-full transition-all duration-300"
          style={{
            backgroundColor: '#303380',
            width: `${percentage}%`
          }}
        ></div>
      </div>
    </div>
  );
});

