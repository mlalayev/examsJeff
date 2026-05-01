# HTML_CSS Individual Fields - Implementation Plan

## Current State

**Problem**: HTML_CSS questions show as 1 question with a form containing 10 inputs. The student answer is a single object:
```json
{
  "q1": "salam",
  "q2": "necesen",
  "q3": "sen necesen",
  ...
}
```

**What you want**: Each input should be a **separate question** so:
- Question 1: shows only the `q1` input
- Question 2: shows only the `q2` input
- etc.

## Two Possible Approaches

### Option A: Split into 10 SHORT_TEXT questions (RECOMMENDED)

**Pros**:
- Uses existing question type
- Simple to implement
- Works with all existing features
- Each question independently scored
- Shows as "Question 1, 2, 3..." naturally

**Cons**:
- Loses the visual HTML context
- Can't show the full form styling

**Implementation**:
1. Create 10 SHORT_TEXT questions
2. Each has the context text (e.g., "A wooden ___ (a model)")
3. Each has single answer key

### Option B: Create new HTML_CSS_FIELD question type

**Pros**:
- Preserves full HTML context
- Can show styled form
- More flexible

**Cons**:
- Need new question type
- More code changes
- Complex to implement

## Recommended Solution: Option A (SHORT_TEXT)

Since you already have the HTML form working and the answer keys extracted, we can:

1. **Auto-convert** the HTML_CSS question into 10 SHORT_TEXT questions
2. Each question gets:
   - The context from the HTML (the label/text around the input)
   - The answer key from that specific field
3. Students see 10 separate questions
4. Each is scored individually

## Implementation Steps

### Step 1: Create Conversion Utility

**File**: `src/lib/convertHtmlCssToFields.ts`

```typescript
export function convertHtmlCssToIndividualQuestions(
  htmlCssQuestion: Question,
  sectionId: string,
  startingOrder: number
): Question[] {
  const { prompt, answerKey } = htmlCssQuestion;
  const htmlCode = prompt?.htmlCode || "";
  const fields = (answerKey as HtmlCssAnswerKeyV1)?.fields || {};
  
  const questions: Question[] = [];
  
  for (const [fieldName, fieldSpec] of Object.entries(fields)) {
    // Extract context around this input from HTML
    const context = extractContextForField(htmlCode, fieldName);
    
    questions.push({
      id: generateId(),
      qtype: "SHORT_TEXT",
      prompt: {
        text: context || `Fill in ${fieldName}:`,
      },
      answerKey: {
        answers: fieldSpec.accepted,
      },
      maxScore: 1,
      order: startingOrder++,
      sectionId,
    });
  }
  
  return questions;
}

function extractContextForField(html: string, fieldName: string): string {
  // Find the input with this name
  const inputRegex = new RegExp(
    `<input[^>]*name="${fieldName}"[^>]*>`,
    'i'
  );
  const match = html.match(inputRegex);
  if (!match) return "";
  
  const inputIndex = match.index!;
  
  // Get text before the input (look back ~100 chars)
  const before = html.substring(Math.max(0, inputIndex - 100), inputIndex);
  // Get text after the input (look forward ~100 chars)
  const after = html.substring(inputIndex + match[0].length, inputIndex + match[0].length + 100);
  
  // Extract meaningful text (remove HTML tags, trim)
  const beforeText = before.replace(/<[^>]*>/g, ' ').trim();
  const afterText = after.replace(/<[^>]*>/g, ' ').trim();
  
  // Combine: "...previous text ___ next text..."
  return `${beforeText.split(' ').slice(-10).join(' ')} ___ ${afterText.split(' ').slice(0, 10).join(' ')}`;
}
```

### Step 2: Add Admin UI Option

**File**: `src/components/admin/exams/create/questionModal/questionFields/prompts/PromptHtmlCss.tsx`

Add a checkbox:

```tsx
<div className="flex items-center gap-2 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
  <input
    type="checkbox"
    id="splitFields"
    checked={question.prompt?.splitFields ?? false}
    onChange={(e) => onChange({
      ...question,
      prompt: { ...question.prompt, splitFields: e.target.checked }
    })}
  />
  <label htmlFor="splitFields" className="text-sm">
    <strong>Split into individual questions</strong> - Create separate question for each input field
  </label>
</div>
```

### Step 3: Handle Conversion on Save

**File**: `src/components/admin/exams/create/questionOperations.ts`

When saving, if `splitFields` is true:

```typescript
export function processQuestionsBeforeSave(questions: Question[], sectionId: string): Question[] {
  const processed: Question[] = [];
  let currentOrder = 1;
  
  for (const q of questions) {
    if (q.qtype === "HTML_CSS" && q.prompt?.splitFields) {
      // Convert to multiple SHORT_TEXT questions
      const individualQuestions = convertHtmlCssToIndividualQuestions(q, sectionId, currentOrder);
      processed.push(...individualQuestions);
      currentOrder += individualQuestions.length;
    } else {
      processed.push({ ...q, order: currentOrder++ });
    }
  }
  
  return processed;
}
```

### Step 4: Update Question Rendering

No changes needed! SHORT_TEXT questions already work and show individually.

### Step 5: Update Scoring

No changes needed! SHORT_TEXT scoring already works per-question.

## Alternative: Quick Manual Approach

If you want to convert your existing question RIGHT NOW without code changes:

1. **Delete** the current HTML_CSS question
2. **Create 10 SHORT_TEXT questions** manually:

**Question 1**:
- Prompt: "A wooden ___ (a model)"
- Answer: "truck"

**Question 2**:
- Prompt: "helps children to understand basic ___"
- Answer: "technology"

**Question 3**:
- Prompt: "A ___ feeder"
- Answer: "bird"

etc.

This takes 5 minutes and works immediately.

## What I Recommend

**For now**: Use the manual approach (create 10 SHORT_TEXT questions)

**For future**: Implement the automatic conversion so admins can:
1. Design the full HTML form visually
2. Check "Split into individual questions"
3. System automatically creates 10 separate questions

This gives you the best of both worlds:
- Visual HTML editor for design
- Individual questions for students
- Proper scoring per field

## Next Steps

Let me know which approach you prefer:

**A) Manual** - I help you create the 10 SHORT_TEXT questions right now
**B) Semi-automatic** - I create a utility to convert your existing HTML_CSS question
**C) Fully automatic** - I implement the full admin UI with checkbox option

Which would you like me to do?
