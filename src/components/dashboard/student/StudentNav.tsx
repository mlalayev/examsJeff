"use client";

import StudentNavSection from "./StudentNavSection";
import { studentNavSections } from "./studentNavConfig";

type Props = {
  onNavigate?: () => void;
};

export default function StudentNav({ onNavigate }: Props) {
  return (
    <div className="space-y-1">
      {studentNavSections.map((section) => (
        <StudentNavSection
          key={section.id}
          section={section}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}
