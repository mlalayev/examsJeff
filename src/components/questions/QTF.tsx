"use client";

import { BaseQuestionProps } from "./types";

export function QTF({ question, value, onChange, readOnly }: BaseQuestionProps<boolean | null>) {
  const handleChange = (val: boolean) => {
    if (readOnly) return;
    onChange(val);
  };

  return (
    <div className="flex items-center gap-4 text-sm text-gray-800">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name={question.id}
          checked={value === true}
          onChange={() => handleChange(true)}
          disabled={readOnly}
          className="h-4 w-4 disabled:opacity-50"
          aria-label="True"
        />
        <span>True</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name={question.id}
          checked={value === false}
          onChange={() => handleChange(false)}
          disabled={readOnly}
          className="h-4 w-4 disabled:opacity-50"
          aria-label="False"
        />
        <span>False</span>
      </label>
    </div>
  );
}

