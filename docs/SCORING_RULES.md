# Auto-Scoring Rules

This document describes the auto-scoring implementation for General English exam questions.

## Overview

All question types except `SHORT_TEXT` and `ESSAY` are auto-scored. The scoring function returns:
- `1` for correct answers
- `0` for incorrect answers

## Scoring Rules by Question Type

### TF (True/False)
```typescript
answerKey: { value: boolean }
studentAnswer: boolean
```
**Rule**: Exact boolean match
- `studentAnswer === answerKey.value`

**Examples**:
- ✅ `true === true` → 1
- ✅ `false === false` → 1
- ❌ `true === false` → 0
- ❌ `null === true` → 0

---

### MCQ_SINGLE (Multiple Choice - Single Answer)
```typescript
answerKey: { index: number }
studentAnswer: number
```
**Rule**: Selected index must equal answerKey.index
- `studentAnswer === answerKey.index`

**Examples**:
- ✅ `1 === 1` → 1
- ✅ `0 === 0` → 1
- ❌ `0 === 1` → 0
- ❌ `null === 1` → 0

---

### MCQ_MULTI (Multiple Choice - Multiple Answers)
```typescript
answerKey: { indices: number[] }
studentAnswer: number[]
```
**Rule**: Set equality - sort both arrays and compare
- `set(studentAnswer) === set(answerKey.indices)`

**Examples**:
- ✅ `[0, 1, 2] === [0, 1, 2]` → 1
- ✅ `[2, 0, 1] === [0, 1, 2]` → 1 (order doesn't matter)
- ❌ `[0, 1] === [0, 1, 2]` → 0 (missing item)
- ❌ `[0, 1, 3] === [0, 1, 2]` → 0 (wrong item)

---

### SELECT (Dropdown Selection)
```typescript
answerKey: { index: number }
studentAnswer: number
```
**Rule**: Selected value must equal answerKey.index
- `studentAnswer === answerKey.index`

**Examples**: Same as MCQ_SINGLE

---

### GAP (Fill in the Blank)
```typescript
answerKey: { answers: string[] }
studentAnswer: string
```
**Rule**: Normalize (trim + lowercase), then check if matches any accepted answer
- `normalize(studentAnswer) in normalize(answerKey.answers)`

**Normalization**:
1. Trim whitespace: `"  answer  "` → `"answer"`
2. Convert to lowercase: `"Answer"` → `"answer"`

**Examples**:
- ✅ `"answer"` matches `["answer"]` → 1
- ✅ `"  Answer  "` matches `["answer"]` → 1
- ✅ `"buy"` matches `["buy", "purchase", "get"]` → 1
- ✅ `"PURCHASE"` matches `["buy", "purchase", "get"]` → 1
- ❌ `"wrong"` matches `["answer"]` → 0
- ❌ `""` matches `["answer"]` → 0
- ❌ `123` matches `["answer"]` → 0 (non-string)

---

### ORDER_SENTENCE (Sentence Ordering)
```typescript
answerKey: { order: number[] }
studentAnswer: number[]
```
**Rule**: Deep array equality - exact order match
- `studentAnswer[i] === answerKey.order[i]` for all i

**Examples**:
- ✅ `[2, 0, 1, 5, 4, 3] === [2, 0, 1, 5, 4, 3]` → 1
- ❌ `[0, 1, 2, 3, 4, 5] === [2, 0, 1, 5, 4, 3]` → 0
- ❌ `[2, 1, 0, 5, 4, 3] === [2, 0, 1, 5, 4, 3]` → 0
- ❌ `[2, 0, 1] === [2, 0, 1, 5, 4, 3]` → 0 (wrong length)

---

### DND_GAP (Drag-and-Drop Gap Fill)
```typescript
answerKey: { blanks: string[] }
studentAnswer: string[]
```
**Rule**: Each blank must match (normalize trim + lowercase)
- `normalize(studentAnswer[i]) === normalize(answerKey.blanks[i])` for all i

**Normalization**: Same as GAP (trim + lowercase)

**Examples**:
- ✅ `["go", "come"] === ["go", "come"]` → 1
- ✅ `["GO", "COME"] === ["go", "come"]` → 1
- ✅ `["  go  ", "  come  "] === ["go", "come"]` → 1
- ❌ `["come", "go"] === ["go", "come"]` → 0 (wrong order)
- ❌ `["go"] === ["go", "come"]` → 0 (wrong length)
- ❌ `["go", "wrong"] === ["go", "come"]` → 0

---

### SHORT_TEXT & ESSAY (Manual Grading)
```typescript
studentAnswer: string
```
**Rule**: No auto-scoring
- Always returns `0`
- Requires teacher manual grading

---

## Section Scoring

For each section:
```typescript
rawScore = sum(correct questions * their maxScore)
maxScore = sum(all questions' maxScore)
sectionPercent = round((rawScore / maxScore) * 100)
```

**Example**:
- Question 1: MCQ_SINGLE, maxScore=1, correct → +1
- Question 2: GAP, maxScore=1, correct → +1
- Question 3: MCQ_MULTI, maxScore=2, incorrect → +0
- Question 4: DND_GAP, maxScore=1, correct → +1

Result: `rawScore = 3, maxScore = 5, percent = 60%`

---

## Overall Attempt Scoring

```typescript
totalRaw = sum(all auto-scored sections' rawScore)
totalMax = sum(all auto-scored sections' maxScore)
overallPercent = round((totalRaw / totalMax) * 100)
```

**Note**: WRITING sections (with SHORT_TEXT/ESSAY) are excluded from overall percent until teacher grading.

---

## Testing

Unit tests are available in `src/lib/scoring.test.ts` covering:
- ✅ All question types
- ✅ Edge cases (null, empty, wrong types)
- ✅ Normalization (trim, case)
- ✅ Set equality
- ✅ Array equality

Run tests:
```bash
npm test scoring
```

---

## API Endpoints

### Submit Attempt
```
POST /api/attempts/:attemptId/submit
```
- Auto-scores all questions
- Saves rawScore/maxScore per section
- Sets attempt.status = "SUBMITTED"
- Returns resultsUrl

### View Results
```
GET /api/attempts/:attemptId/results
```
- Returns per-section scores
- Returns question-level review (your answer vs correct)
- Includes explanations where available

