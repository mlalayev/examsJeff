# Fix for 500 Error When Saving Questions

## Problem
When trying to save a question from the Quick Edit modal, a 500 Internal Server Error occurred:
```
PATCH https://exams.jeff.az/api/admin/exams/[examId] net::ERR_ABORTED 500 (Internal Server Error)
Error saving question: Error: Failed to save exam
```

## Root Cause
The API validation schema was expecting `instruction` to be a `string`, but the client was sending it as an **object** containing:
- `text`: The main instruction text
- `passage`: Optional passage text (for Reading sections)
- `audio`: Optional audio URL (for Listening sections)
- `introduction`: Optional introduction text

This mismatch caused the Zod validation to fail with a 500 error.

## Solution

### 1. Updated API Schema
**File**: `src/app/api/admin/exams/[id]/route.ts`

Changed the `sectionSchema` validation:
```typescript
// BEFORE (incorrect)
instruction: z.string().nullable().optional(),

// AFTER (correct)
instruction: z.any().nullable().optional(), // Can be string or object with text, passage, audio, introduction
```

### 2. Added Better Error Logging
Added comprehensive error logging to help diagnose future issues:
```typescript
console.error("[API] Error details:", {
  message: error instanceof Error ? error.message : "Unknown",
  stack: error instanceof Error ? error.stack : undefined,
  examId: (await params).id
});
```

### 3. Improved Client-Side Error Handling
**File**: `src/app/dashboard/admin/exams/[id]/edit/page.tsx`

Enhanced error handling to show more specific error messages:
```typescript
if (!res.ok) {
  const errorData = await res.json().catch(() => ({}));
  console.error("Save failed:", {
    status: res.status,
    statusText: res.statusText,
    errorData
  });
  throw new Error(errorData.details || errorData.error || "Failed to save exam");
}
```

Now the actual error message from the API will be displayed to the user.

## About the Warnings

### 1. Preload Warning
```
The resource <URL> was preloaded using link preload but not used within a few seconds
```
**Status**: This is a Next.js optimization warning and can be safely ignored. It doesn't affect functionality.

### 2. Sandbox Script Warning
```
Blocked script execution in 'about:srcdoc' because the document's frame is sandboxed
```
**Status**: This is **expected and correct**. The HTML/CSS preview iframe has `sandbox="allow-same-origin"` which prevents JavaScript execution for security. This is intentional to prevent malicious code from executing.

## How Answer Keys Work

### For HTML/CSS Questions
Answer keys are automatically extracted from the HTML code using these attributes:

1. **Text Inputs**: `data-answer="ans1 | ans2 | ans3"`
   ```html
   <input type="text" name="q1" data-answer="60% | 0.6 | sixty percent" />
   ```
   - System extracts: `["60%", "0.6", "sixty percent"]`
   - Any of these answers will be marked as correct

2. **Radio Buttons**: `data-correct="true"`
   ```html
   <input type="radio" name="q2" value="A" data-correct="true" /> Option A
   <input type="radio" name="q2" value="B" /> Option B
   ```
   - System extracts: `value="A"` is the correct answer

3. **Checkboxes**: `data-answer="true"`
   ```html
   <input type="checkbox" name="q3" data-answer="true" /> Check if correct
   ```
   - System extracts: This checkbox should be checked

### Storage in Database
- **Field**: `Question.answerKey` (type: `Json?`)
- **Format**: JSON object containing the extracted answer data
- **Example for HTML_CSS**:
  ```json
  {
    "q1": ["60%", "0.6", "sixty percent"],
    "q2": "A",
    "q3": true
  }
  ```

### When Students Take the Exam
1. Student inputs are captured from the HTML form elements
2. System compares student answers against the `answerKey`
3. For text inputs: Checks if student's answer matches any in the array (case-insensitive)
4. For radio/checkboxes: Checks if the selected value matches the correct value
5. Score is calculated automatically

## Files Modified

1. **`src/app/api/admin/exams/[id]/route.ts`**
   - Changed `instruction` validation from `z.string()` to `z.any()`
   - Added better error logging

2. **`src/app/dashboard/admin/exams/[id]/edit/page.tsx`**
   - Improved error handling to show specific API error messages
   - Added detailed logging of save failures

## Testing Checklist

- [x] Fix 500 error when saving questions
- [x] Verify instruction object is accepted
- [x] Test with HTML/CSS questions
- [x] Test with MCQ questions
- [x] Test with all question types
- [x] Verify answer keys are saved correctly
- [x] Check error messages are displayed properly

## Verification Steps

1. **Open Quick Edit**
   - Navigate to exam edit page
   - Click "Quick Edit Questions"

2. **Add HTML/CSS Question**
   - Click "Add Question to Part 1"
   - Select "HTML_CSS" type
   - Fill in HTML code with `data-answer` attributes
   - Fill in question instructions
   - Click "Save Question"
   - **Expected**: Success message, no 500 error

3. **Check Database**
   - Refresh the page
   - Open Quick Edit again
   - **Expected**: Question appears in the list
   - Click Edit on the question
   - **Expected**: All data is preserved

4. **Check Answer Keys**
   - In the database, check the `Question.answerKey` field
   - **Expected**: JSON object with extracted answers

## Common Issues and Solutions

### Issue: Still Getting 500 Error
**Solution**: Check the server logs for the specific validation error. The error details will show which field failed validation.

### Issue: Answer Keys Not Saving
**Possible Causes**:
1. HTML inputs missing `name` or `id` attributes
2. Missing `data-answer` or `data-correct` attributes
3. Invalid JSON in `answerKey`

**Solution**: 
- Add `name` attributes to all inputs
- Use proper format: `data-answer="ans1 | ans2"`
- Check browser console for extraction errors

### Issue: Student Answers Not Being Saved
**Note**: This is a different issue related to the attempt saving logic, not the question creation. See `HTML_CSS_FIX_INSTRUCTIONS.md` for details on the offline-first answer saving approach.

## Next Steps

If you still see issues:
1. Check the browser console for detailed error messages
2. Check the server logs (terminal where `npm run dev` is running)
3. Verify the Prisma schema matches the code
4. Try with a simple question first (e.g., MCQ) to isolate HTML/CSS specific issues

## Security Notes

- The iframe sandbox is intentionally restrictive to prevent XSS attacks
- No JavaScript execution is allowed in HTML/CSS previews
- Only HTML and CSS are rendered
- All student inputs are sanitized before saving

## Performance Notes

- Answer keys are extracted client-side before saving
- Extraction happens on every HTML code change (debounced)
- No server-side processing needed for answer key extraction
- Database stores the final JSON object

---

**Status**: ✅ Fixed
**Date**: 2026-05-02
**Tested**: Yes, with HTML/CSS questions
