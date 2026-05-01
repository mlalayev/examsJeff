# HTML_CSS Question Type - Debugging Guide

## Problem
HTML_CSS questions are not being saved to the database. Student answers show as empty objects `{}` instead of capturing the form input values.

## Root Cause
The QHtmlCss component requires ALL input fields to have either a `name` or `id` attribute for the values to be captured and saved. If inputs are missing these attributes, they will be ignored.

## Solution

### For Question Creation
When creating HTML_CSS questions, ensure ALL input fields have proper attributes:

```html
<!-- ✅ CORRECT: Has name attribute -->
<input type="text" name="q1" data-answer="truck" />
<input type="text" name="q2" data-answer="technology" />
<textarea name="q3" data-answer="essay text"></textarea>
<select name="q4" data-answer="option1">
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>

<!-- ✅ CORRECT: Has id attribute (fallback if no name) -->
<input type="text" id="answer1" data-answer="correct" />

<!-- ❌ INCORRECT: No name or id attribute -->
<input type="text" data-answer="test" />
```

### Required Attributes

1. **name** or **id**: Used to identify the field and save its value
2. **data-answer**: Specifies the correct answer(s)
   - For text/textarea/select: pipe-separated list of accepted answers
     - Example: `data-answer="answer1 | answer2 | answer3"`
   - For radio: add `data-correct="true"` to the correct option (must have `value` attribute)
   - For checkbox: `data-answer="true"` or `data-answer="false"`

### Answer Key Format
The system extracts answer keys from the HTML using these conventions:

```typescript
{
  "mode": "HTML_ATTRS_V1",
  "fields": {
    "q1": {
      "type": "text",
      "accepted": ["truck"]
    },
    "q2": {
      "type": "text", 
      "accepted": ["technology", "tech"]
    },
    "q3": {
      "type": "checkbox",
      "accepted": ["true"]
    },
    "q4": {
      "type": "radio",
      "accepted": ["option_a"]
    }
  }
}
```

## How It Works

### 1. Component Initialization
The QHtmlCss component:
- Renders HTML in an iframe
- Searches for all `input`, `textarea`, and `select` elements
- Attaches event listeners to capture value changes
- Polls values every 800ms as a fallback

### 2. Value Capture
When a user interacts with an input:
- Event listeners capture the change
- The field's `name` or `id` is used as the key
- The value is stored in state: `{ fieldName: value }`
- State is saved to localStorage and synced to server every 3 seconds

### 3. Answer Submission
On submit:
- Student answers are compared against the answer key
- Scoring checks if student values match any accepted answer
- Text answers are normalized (lowercase, punctuation removed)

## Debugging Steps

### 1. Check Browser Console
Look for these log messages:
- `🎯 QHtmlCss: Render` - Shows incoming values
- `🟣 QHtmlCss: Found X inputs in iframe` - Shows how many inputs were found
- `🟢 QHtmlCss: Input changed` - Shows when values change
- `🔵 QHtmlCss: Poll found X inputs` - Shows polling results
- `❌ QHtmlCss: Input without name or id` - **ERROR: Input missing attributes**

### 2. Verify HTML Structure
Check that your HTML has:
```html
<input name="q1" ...>  <!-- ✅ Has name -->
<input id="q2" ...>     <!-- ✅ Has id -->
<input ...>             <!-- ❌ Missing both -->
```

### 3. Check Saved Data
In the database, check the `attempt_answers` table:
```sql
SELECT * FROM attempt_answers WHERE question_id = 'YOUR_QUESTION_ID';
```

The `answer` column should contain:
```json
{
  "q1": "student answer 1",
  "q2": "student answer 2"
}
```

If it shows `{}`, the inputs are not being captured.

### 4. Verify Answer Key
Check the question's `answerKey` field in the database:
```sql
SELECT answer_key FROM questions WHERE id = 'YOUR_QUESTION_ID';
```

Should contain:
```json
{
  "mode": "HTML_ATTRS_V1",
  "fields": {
    "q1": { "type": "text", "accepted": ["correct answer"] }
  }
}
```

## Common Mistakes

### ❌ Missing name/id attribute
```html
<input type="text" data-answer="test">
```

### ✅ Fixed
```html
<input type="text" name="q1" data-answer="test">
```

---

### ❌ Wrong data attribute format
```html
<input type="text" name="q1" answer="test">
```

### ✅ Fixed
```html
<input type="text" name="q1" data-answer="test">
```

---

### ❌ Radio button without value
```html
<input type="radio" name="q1" data-correct="true">
```

### ✅ Fixed
```html
<input type="radio" name="q1" value="option_a" data-correct="true">
```

---

### ❌ Multiple answers not pipe-separated
```html
<input type="text" name="q1" data-answer="answer1 answer2">
```

### ✅ Fixed
```html
<input type="text" name="q1" data-answer="answer1 | answer2">
```

## Implementation Status

### ✅ Working Components
- Prisma schema includes `HTML_CSS` type
- API routes accept and validate `HTML_CSS` questions
- Scoring logic is implemented for `HTML_CSS` type
- QHtmlCss component renders HTML and captures inputs
- Autosave functionality works (3-second debounce)
- AttemptAnswer table stores normalized per-question data

### ✅ Recent Updates (Just Applied)
- Added comprehensive console logging
- Added warnings for inputs without name/id
- Added state debugging
- Added polling diagnostics

## Testing Checklist

When testing HTML_CSS questions:

1. **Create Question**
   - [ ] All inputs have `name` or `id` attributes
   - [ ] All inputs have `data-answer` attributes
   - [ ] Answer key is extracted correctly
   - [ ] Preview shows the HTML renders correctly

2. **Take Test**
   - [ ] Open browser console (F12)
   - [ ] Fill in the form
   - [ ] Check console for input capture logs
   - [ ] Check for any error messages
   - [ ] Wait 3 seconds for autosave
   - [ ] Check "Last saved" timestamp updates

3. **Submit Test**
   - [ ] Submit the attempt
   - [ ] Check database for saved answers
   - [ ] Check scoring is applied correctly
   - [ ] View results page

4. **Verify Results**
   - [ ] Student answer is displayed
   - [ ] Correct answer is displayed
   - [ ] Score is calculated correctly
   - [ ] Feedback is appropriate

## Next Steps

If problems persist:

1. Check browser console for specific error messages
2. Verify the HTML structure has proper attributes
3. Check network tab to see if API calls are being made
4. Check database to see if data is being saved
5. Review the logs in the application console

For help, provide:
- Browser console logs
- Question HTML structure
- Student answer data from database
- Answer key from database
