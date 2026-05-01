# HTML/CSS Question Type - Complete Guide

## Overview
The HTML/CSS question type allows you to create coding questions where students write HTML and CSS code. The code is displayed with a live preview both in the question editor and during the exam.

## How It Works

### 1. **Creating the Question**
When you add a new HTML/CSS question in the question modal:

- **Question Instructions**: Write the task/requirements for students
  - Example: "Create a button that is red with white text and rounded corners"
  
- **HTML Code**: Enter the reference HTML code that students will see
  - This code will be displayed to students as a reference
  - Students can see your code while writing their own solution
  
- **CSS Code**: Enter the reference CSS code (optional)
  - If provided, will be shown to students
  - Leave empty if CSS is not needed

- **Live Preview**: Shows real-time rendering of your HTML/CSS
  - Updates as you type
  - Shows exactly how the code will appear in the exam
  - Can be toggled on/off

### 2. **Answer Key Section (Multiple Correct Answers Supported)**

You can specify multiple correct answers:

- **Correct HTML Code**: Enter one correct HTML solution (optional)
- **Correct CSS Code**: Enter one correct CSS solution (optional)
- **Alternative Correct Answers**: Add multiple alternative solutions
  - Separate each alternative with `---` on a new line
  - Useful when there are multiple ways to solve the problem

**Important Notes:**
- If you leave the answer key empty, the question will require **manual grading**
- Students' code will be saved and viewable by instructors
- Multiple correct solutions are supported for flexible grading

### 3. **During the Exam**

Students will see:
- The question instructions you wrote
- The reference HTML/CSS code (in a gray box)
- Code editors for their HTML and CSS answers
- A live preview of their code (updates in real-time)
- Line counts for their code

The interface includes:
- Syntax highlighting (monospace font)
- Resizable text areas
- Toggle button to show/hide preview
- Separate editors for HTML and CSS

### 4. **Grading**

The question can be graded in two ways:

**Automatic Grading** (if answer key is provided):
- System compares student's code with correct answers
- Checks if code matches any of the provided solutions
- Awards points if match is found

**Manual Grading** (if answer key is empty):
- Instructor reviews student's code
- Checks if code meets requirements
- Awards points based on correctness
- Can test the code using the live preview

### 5. **Data Structure**

The question data is stored as:

```typescript
{
  qtype: "HTML_CSS",
  prompt: {
    text: "Question instructions",
    htmlCode: "Reference HTML code",
    cssCode: "Reference CSS code"
  },
  answerKey: {
    correctHTML: "One correct HTML solution",
    correctCSS: "One correct CSS solution",
    alternativeAnswers: ["alternative 1", "alternative 2"],
    allowMultipleAnswers: true
  }
}
```

Student answers are stored as:
```typescript
{
  html: "Student's HTML code",
  css: "Student's CSS code"
}
```

### 6. **Best Practices**

- Write clear, specific instructions
- Provide reference code when helpful
- Consider multiple valid solutions
- Test the live preview before saving
- Use this for HTML/CSS assessment, not general programming

### 7. **Example Use Cases**

- "Create a red button with rounded corners"
- "Style this heading to be centered and blue"
- "Create a navigation bar with 3 links"
- "Build a card component with image and text"
- "Create a responsive grid layout"

### 8. **Tips for Creating Good Questions**

- Be specific about requirements (colors, sizes, etc.)
- Provide starter code when appropriate
- Test your reference code in the preview
- Consider different valid approaches
- Use reasonable complexity for the exam level

---

## Technical Notes

### File Locations
- Question type definition: `src/components/admin/exams/create/types.ts`
- Labels and groups: `src/components/admin/exams/create/constants.ts`
- Default values: `src/components/admin/exams/create/questionHelpers.ts`
- Editor component: `src/components/admin/exams/create/questionModal/questionFields/prompts/PromptHtmlCss.tsx`
- Student component: `src/components/questions/QHtmlCss.tsx`
- Answer key field: `src/components/admin/exams/create/questionModal/questionFields/QuestionAnswerKeyField.tsx`
- Preview: `src/components/QuestionPreview.tsx`
- Exam rendering: `src/app/attempts/[attemptId]/run/page.tsx`

### Database Schema
- Added `HTML_CSS` to `QuestionType` enum in `prisma/schema.prisma`
- Stored in Question model's `prompt`, `options`, and `answerKey` JSON fields
