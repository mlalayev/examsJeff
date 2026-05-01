# HTML_CSS Question Type - Complete Analysis

## Summary of the Problem

**Symptom**: Student answers for HTML_CSS questions show as `{}` in database, but correct answers ARE being stored.

**Root Cause**: The iframe is finding **0 inputs** even though HTML is 4230 characters long.

## Complete Data Flow Architecture

### 1. Question Creation (Admin Side)

```
Admin UI → PromptHtmlCss.tsx → Question State → API → Database
```

**Files**:
- `src/components/admin/exams/create/questionModal/questionFields/prompts/PromptHtmlCss.tsx`
- `src/app/api/admin/exams/[id]/route.ts`
- `prisma/schema.prisma`

**Data Structure in Database**:
```typescript
Question {
  qtype: "HTML_CSS"
  prompt: {
    text: string          // Instructions for student
    htmlCode: string      // The HTML markup
    cssCode: string       // Optional CSS styling
  }
  answerKey: {
    mode: "HTML_ATTRS_V1"
    fields: {
      [inputName: string]: {
        type: "text" | "radio" | "checkbox" | "select"
        accepted: string[]  // Correct answers
      }
    }
  }
}
```

**Answer Key Extraction**:
- Uses `extractHtmlCssAnswerKeyV1()` from `src/lib/htmlCssAnswerKey.ts`
- Scans HTML for inputs with `name` or `id` attributes
- Text inputs: requires `data-answer="ans1 | ans2 | ans3"`
- Radio buttons: requires `data-correct="true"` on correct option
- Checkboxes: requires `data-answer="true"` or `data-answer="false"`

### 2. Question Loading (Student Side)

```
GET /api/attempts/[attemptId] → Exam + Sections + Questions → Client State
```

**Files**:
- `src/app/api/attempts/[attemptId]/route.ts`
- `src/app/attempts/[attemptId]/run/page.tsx`

**Data Transformation**:
1. API returns `savedAnswers` keyed by `sectionType` (e.g., "LISTENING", "GRAMMAR")
2. Client converts to `sectionId` keys
3. Merges with localStorage
4. Sets initial state: `answers[sectionId][questionId]`

**What reaches QHtmlCss component**:
```typescript
{
  question: {
    id: string
    qtype: "HTML_CSS"
    prompt: {
      text: string
      htmlCode: string
      cssCode: string
    }
  }
  value: Record<string, string | boolean> | undefined
  onChange: (value: any) => void
  readOnly: boolean
}
```

### 3. Answer Capture (Iframe → React)

```
User types in iframe → Event handler → setStudentAnswers → onChange → handleAnswerChange → setAnswer
```

**Files**:
- `src/components/questions/QHtmlCss.tsx`
- `src/components/attempts/QuestionCard.tsx`
- `src/components/attempts/QuestionsArea.tsx`
- `src/app/attempts/[attemptId]/run/page.tsx`

**QHtmlCss Component Flow**:

1. **Rendering**:
   ```typescript
   const htmlCode = sanitizeHtmlCssMarkup(question.prompt?.htmlCode || "");
   const cssCode = question.prompt?.cssCode || "";
   
   // Builds full HTML document
   const fullHtml = `<!DOCTYPE html>...${cssCode}...${htmlCode}...</html>`;
   ```

2. **Sanitization** (`sanitizeHtmlCssMarkup`):
   - Extracts `<body>` inner HTML if full document is pasted
   - Removes `<script>` tags
   - Removes inline event handlers (`onclick`, etc.)
   - Removes `javascript:` URLs

3. **Iframe Setup**:
   - Waits for iframe to load
   - Queries for `input, textarea, select` elements
   - **CRITICAL**: Only captures inputs with `name` or `id` attribute
   - Sets up event listeners for `input` and `change` events
   - Polls every 800ms as fallback

4. **Value Capture**:
   ```typescript
   const key = element.name || element.id;  // If both missing → IGNORED!
   
   if (checkbox) {
     studentAnswers[key] = element.checked;  // boolean
   } else if (radio) {
     studentAnswers[key] = element.value;     // string
   } else {
     studentAnswers[key] = element.value;     // string
   }
   ```

5. **Notify Parent**:
   ```typescript
   useEffect(() => {
     if (JSON.stringify(studentAnswers) !== JSON.stringify(value)) {
       onChange(studentAnswers);  // Sends to parent
     }
   }, [studentAnswers, onChange, value]);
   ```

**Expected Answer Format**:
```typescript
{
  "q1": "truck",           // text input value
  "q2": "technology",      // text input value
  "agree": true,           // checkbox checked state
  "choice": "optionA"      // radio button value
}
```

### 4. Answer Saving (Client → Database)

```
setAnswer → localStorage + setTimeout → saveSection → POST /api/attempts/[attemptId]/save
```

**Files**:
- `src/app/attempts/[attemptId]/run/page.tsx` (lines 733-757)
- `src/app/api/attempts/[attemptId]/save/route.ts`

**Flow**:

1. **handleAnswerChange**:
   ```typescript
   // Finds which section the question belongs to
   const questionSection = data.sections.find(s => 
     s.questions.some(q => q.id === questionId)
   );
   
   setAnswer(questionSection.id, questionId, value);
   ```

2. **setAnswer**:
   ```typescript
   // Checks if section is locked/completed
   if (lockedSections.has(sectionId) || completedSections.has(sectionId)) {
     return;  // DOES NOT SAVE!
   }
   
   // Updates state
   const newAnswers = {
     ...prev,
     [sectionId]: { ...(prev[sectionId] || {}), [questionId]: value }
   };
   
   // Saves to localStorage immediately
   localStorage.setItem(storageKey, JSON.stringify(newAnswers));
   
   // Debounced API call (3 seconds)
   setTimeout(() => saveSection(sectionId, newAnswers[sectionId]), 3000);
   ```

3. **saveSection → API**:
   ```typescript
   POST /api/attempts/${attemptId}/save
   Body: {
     sectionType: "LISTENING",  // Section enum, not section.id
     answers: {
       [questionId]: { "q1": "truck", "q2": "tech", ... }
     }
   }
   ```

4. **API Handler**:
   - JSON exams: merges into `attempt.answers[sectionType]`
   - DB exams: updates `attemptSection.answers`
   - BOTH: upserts `attemptAnswer` rows (normalized storage)

### 5. Answer Submission & Scoring

```
POST /api/attempts/[attemptId]/submit → scoreQuestion → Database
```

**Files**:
- `src/app/api/attempts/[attemptId]/submit/route.ts`
- `src/lib/scoring.ts` (lines 209-247)

**Scoring Logic**:
```typescript
case "HTML_CSS": {
  // Student answer must be object
  if (!studentAnswer || typeof studentAnswer !== "object") return 0;
  
  // Answer key must be HTML_ATTRS_V1 format
  const key = answerKey as HtmlCssAnswerKeyV1;
  if (key.mode !== "HTML_ATTRS_V1" || !key.fields) return 0;
  
  // Check each field
  for (const name of Object.keys(key.fields)) {
    const spec = key.fields[name];
    const studentVal = studentAnswer[name];
    
    // For checkbox: check boolean match
    // For others: normalize and check if accepted
    if (!matches) return 0;
  }
  
  return 1;  // All fields correct
}
```

## Problem Diagnosis

### Current Status (from logs):

```
🟪 renderInteractiveHTML: {
  hasPrompt: true,
  htmlCodeLength: 4230,
  cssCodeLength: 95,
  htmlCodePreview: '<!DOCTYPE html>\n<html lang="en">\n<head>...'
}
🟣 QHtmlCss: Found 0 inputs in iframe
🔵 QHtmlCss: Poll found 0 inputs with values: {}
```

### Analysis:

**✅ Working**:
- HTML is loading (4230 characters)
- CSS is loading (95 characters)
- Iframe is rendering
- Answer key is being stored correctly (from your screenshot)

**❌ Broken**:
- Iframe finds **0 inputs**
- Poll finds **0 inputs**
- Student answers stay as `{}`

### Root Causes (in order of likelihood):

#### 1. **Full HTML Document Nested in iframe** (MOST LIKELY)

**Problem**: You pasted a complete HTML document including:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Family Presents</title>
  <style>...</style>
</head>
<body>
  ...inputs here...
</body>
</html>
```

**What happens**:
1. `sanitizeHtmlCssMarkup()` extracts `<body>` inner HTML
2. But your `<style>` is in `<head>`, so it gets lost
3. More importantly: if the regex for `<body>` fails or the HTML is malformed, the ENTIRE content becomes empty
4. Result: iframe has no inputs to find

**Solution Applied**:
- Updated `sanitizeHtmlCssMarkup()` to extract body content
- Added retry logic to wait for iframe to be ready

**Why it might still be failing**:
- The regex might not be matching your specific HTML structure
- There might be whitespace or formatting issues
- The iframe might not be triggering the load event properly

#### 2. **Iframe Timing Issue**

**Problem**: setupListeners runs before iframe DOM is ready

**Evidence**: "Found 0 inputs" immediately after render

**Solution Applied**:
- Added retry mechanism (up to 2 seconds, checks every 100ms)
- Only starts polling after inputs are found

#### 3. **Inputs Missing name/id Attributes**

**Evidence from your HTML**: All inputs DO have `name` attributes ✅
```html
<input name="q1" data-answer="truck" />
<input name="q2" data-answer="technology" />
```

So this is NOT the issue.

#### 4. **CSS in wrong place**

Your full HTML has styles in `<head>`:
```html
<style>
  body { font-family: "Times New Roman", serif; ... }
  input { border: none; ... }
</style>
```

When we extract `<body>` content, this CSS is lost. But this only affects **styling**, not input detection.

## The Fix Needed

### Immediate Action Required:

You need to paste **ONLY the body content** into the HTML Code field, and move the `<style>` content to the CSS Code field.

**Current (what you're pasting)**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Family Presents</title>
  <style>
    body { ... }
    .page { ... }
    /* ALL YOUR CSS */
  </style>
</head>
<body>
  <div class="page">
    <!-- YOUR INPUTS -->
  </div>
</body>
</html>
```

**What you SHOULD paste**:

**HTML Code field**:
```html
<div class="page">
  <div class="top">
    <div>PART 1</div>
    <div>Questions <b>1 - 10</b></div>
  </div>
  
  <div class="instructions">
    Complete the notes below.<br /><br />
    Write <strong>ONE WORD AND/OR A NUMBER</strong> for each answer.
  </div>
  
  <div class="box">
    <h1>Family presents</h1>
    <h2>Company specialises in educational toys</h2>
    
    <div class="section">
      <div class="section-title">Presents for Peter:</div>
      <div>
        A wooden <b>1</b>
        <input name="q1" data-answer="truck" class="medium" type="text" /> (a model)
      </div>
      <!-- REST OF YOUR HTML -->
    </div>
  </div>
</div>
```

**CSS Code field**:
```css
body {
  font-family: "Times New Roman", serif;
  background: #fff;
  color: #222;
  padding: 30px;
}

.page {
  width: 620px;
  margin: 0 auto;
}

/* ALL YOUR OTHER CSS */
```

### Why This Will Fix It:

1. No nested HTML documents
2. CSS will be properly applied
3. Iframe will find all 10 inputs
4. Values will be captured correctly
5. Answers will save to database

## Testing Checklist

After fixing the HTML/CSS split:

1. **Edit the question** in admin panel
2. **Split HTML and CSS** as shown above  
3. **Save the question**
4. **Refresh the attempt page** (Ctrl+F5)
5. **Check console**: Should see "Found 10 inputs in iframe"
6. **Type in an input**
7. **Wait 3 seconds**
8. **Check console**: Should see API call with answers
9. **Check database**: `attemptAnswer` or `attempt_sections.answers` should have your values

## Files Modified

1. `src/lib/htmlCssAnswerKey.ts` - Added body extraction logic
2. `src/components/questions/QHtmlCss.tsx` - Added retry logic for iframe loading
3. `HTML_CSS_DEBUG_GUIDE.md` - Created debugging guide
4. `HTML_CSS_ANALYSIS.md` - This file

## Next Steps

If after splitting HTML/CSS it STILL shows 0 inputs:

1. Share the console logs again
2. Check browser DevTools → Elements → iframe content
3. Verify the iframe actually contains the HTML
4. Check if there are any CORS or security errors
5. Try removing all CSS and using minimal HTML with just one input to isolate the issue
