// Common types for question components

export interface BaseQuestionProps<T = any> {
  question: {
    id: string;
    qtype: string;
    prompt: any;
    options?: any;
    order: number;
  };
  value: T;
  onChange: (value: T) => void;
  readOnly?: boolean;
  showWordBank?: boolean;
  externalDraggedOption?: string | null;
  onDropComplete?: () => void;
  onImageClick?: (imageUrl: string) => void;
}

// Answer value shapes
export interface TFValue {
  value: boolean | null;
}

export interface MCQSingleValue {
  index: number | null;
}

export interface MCQMultiValue {
  indices: number[];
}

export interface SelectValue {
  index: number | null;
}

export interface GapValue {
  answers: string[];
}

export interface OrderSentenceValue {
  order: number[];
}

export interface DndGapValue {
  blanks: string[];
}

