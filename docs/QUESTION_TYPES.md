# Question Types & Answer Formats

## Overview
This document describes all supported question types, their answer formats, and how they are auto-scored.

## Question Types

### 1. TF (True/False)
**Component:** `QTF.tsx`
**Answer Format:** `boolean` (true or false)
**Scoring:** Exact boolean match
```typescript
// Student answer
value: true | false

// Answer key
answerKey: { value: true | false }

// Score: 1 if studentAnswer === answerKey.value, else 0
```

### 2. MCQ_SINGLE (Single Choice)
**Component:** `QMcqSingle.tsx`
**Answer Format:** `number` (index of selected choice)
**Scoring:** Selected index must match answer key index
```typescript
// Student answer
value: number // e.g., 1

// Answer key
answerKey: { index: number } // e.g., { index: 1 }

// Score: 1 if studentAnswer === answerKey.index, else 0
```

### 3. MCQ_MULTI (Multiple Choice)
**Component:** `QMcqMulti.tsx`
**Answer Format:** `number[]` (array of selected indices, sorted)
**Scoring:** Set equality - both arrays must contain same indices
```typescript
// Student answer
value: number[] // e.g., [0, 2, 4]

// Answer key
answerKey: { indices: number[] } // e.g., { indices: [0, 2, 4] }

// Score: 1 if sorted arrays are equal, else 0
```

### 4. SELECT (Dropdown)
**Component:** `QSelect.tsx`
**Answer Format:** `number | null` (index of selected option)
**Scoring:** Selected index must match answer key index
```typescript
// Student answer
value: number | null // e.g., 2

// Answer key
answerKey: { index: number } // e.g., { index: 2 }

// Score: 1 if studentAnswer === answerKey.index, else 0
```

### 5. GAP (Fill in the Blank - Text Input)
**Component:** `QGap.tsx`
**Answer Format:** `{ [sentenceIndex: string]: string }` (object mapping sentence to answer)
**Scoring:** Normalized string match (trim, lowercase) against any accepted answer
```typescript
// Student answer (for single gap)
value: { "0": "drink" }

// Answer key
answerKey: { answers: string[] } // e.g., { answers: ["drink", "have"] }

// Score: 1 if normalized studentAnswer matches any in answerKey.answers, else 0
// Normalization: trim() + toLowerCase()
```

### 6. ORDER_SENTENCE (Sentence Ordering)
**Component:** `QOrderSentence.tsx`
**Answer Format:** `number[]` (array of token indices in correct order)
**Scoring:** Exact array match
```typescript
// Student answer
value: number[] // e.g., [2, 0, 1, 3, 4, 5]

// Answer key
answerKey: { order: number[] } // e.g., { order: [2, 0, 1, 3, 4, 5] }

// Score: 1 if arrays are exactly equal, else 0
```

### 7. DND_GAP (Drag-and-Drop Gap Fill)
**Component:** `QDndGap.tsx`
**Answer Format:** `{ [gapKey: string]: string }` (object mapping gap to word)
**Scoring:** Each gap must match corresponding answer (normalized)
```typescript
// Student answer
value: { "gap-0": "am", "gap-1": "are", "gap-2": "is" }

// Answer key
answerKey: { blanks: string[] } // e.g., { blanks: ["am", "are", "is"] }

// Score: 1 if all gaps match (after normalization), else 0
// Normalization: trim() + toLowerCase()
```

### 8. SHORT_TEXT (Short Text Answer)
**Answer Format:** `string`
**Scoring:** No auto-score (requires manual grading)
```typescript
// Student answer
value: string // e.g., "The capital is Paris"

// Score: Always 0 (manual grading required)
```

### 9. ESSAY (Long Text Answer)
**Answer Format:** `string`
**Scoring:** No auto-score (requires manual grading)
```typescript
// Student answer
value: string // e.g., "In my opinion..."

// Score: Always 0 (manual grading required)
```

## Answer Storage in Database

All student answers are stored in the `AttemptSection.answers` JSON field:

```typescript
{
  "READING": {
    "question-id-1": true,           // TF
    "question-id-2": 1,               // MCQ_SINGLE
    "question-id-3": [0, 2],          // MCQ_MULTI
  },
  "WRITING": {
    "question-id-4": [2, 0, 1],       // ORDER_SENTENCE
    "question-id-5": {                // DND_GAP
      "gap-0": "am",
      "gap-1": "are"
    }
  }
}
```

## Scoring Implementation

The scoring logic is centralized in `src/lib/scoring.ts`:

- **Auto-scored:** TF, MCQ_SINGLE, MCQ_MULTI, SELECT, GAP, ORDER_SENTENCE, DND_GAP
- **Manual grading:** SHORT_TEXT, ESSAY

See `src/lib/scoring.ts` for complete implementation details.

