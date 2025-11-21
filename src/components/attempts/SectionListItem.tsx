"use client";

import React from "react";
import { BookOpen, Lock, CheckCircle } from "lucide-react";

interface SectionListItemProps {
  section: {
    type: string;
    title: string;
  };
  isActive: boolean;
  isLocked: boolean;
  answeredCount: number;
  totalCount: number;
  onClick: () => void;
  getShortSectionTitle: (title: string) => string;
}

export const SectionListItem = React.memo(function SectionListItem({
  section,
  isActive,
  isLocked,
  answeredCount,
  totalCount,
  onClick,
  getShortSectionTitle,
}: SectionListItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
        isActive
          ? "border"
          : "border border-transparent"
      }`}
      style={isActive ? { 
        backgroundColor: '#E0E1EC',
        borderColor: 'rgba(48, 51, 128, 0.2)',
        color: '#303380'
      } : {
        backgroundColor: 'rgba(48, 51, 128, 0.02)',
        borderColor: 'rgba(48, 51, 128, 0.1)',
        color: 'rgba(48, 51, 128, 0.8)'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.05)';
          e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.02)';
          e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.1)';
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {isLocked ? (
            <Lock className="w-4 h-4 text-green-600 flex-shrink-0" />
          ) : (
            <BookOpen className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="font-medium text-sm truncate" title={section.title}>
            {getShortSectionTitle(section.title)}
          </span>
        </div>
        {isLocked && (
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
        )}
      </div>
      <div className="mt-1 text-xs"
           style={{ color: 'rgba(48, 51, 128, 0.6)' }}>
        {answeredCount}/{totalCount} answered
      </div>
    </button>
  );
});

