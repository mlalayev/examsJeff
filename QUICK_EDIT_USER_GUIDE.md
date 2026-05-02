# Quick Edit Questions - User Guide

## Overview
The Quick Edit Questions feature allows you to quickly add and edit exam questions without navigating away from the exam edit page. It includes full-featured editors for all question types, including HTML/CSS interactive questions.

---

## Getting Started

### Opening Quick Edit
1. Go to your exam edit page
2. Click the **"Quick Edit Questions"** button (blue gradient button at the top)
3. A modal will open showing all sections and parts

---

## Adding a New Question

### Step 1: Select Section and Part
- **Left sidebar** shows all sections (Listening, Reading, Writing, Speaking)
- For IELTS exams, you'll also see **Parts** below (Part 1, Part 2, etc.)
- Click on the section and part where you want to add the question

### Step 2: Click Add Question
- At the top of the main area, you'll see **"Add Question to [Part/Section]"**
- Click this blue gradient button

### Step 3: Choose Question Type
A modal appears with question types grouped by category:

**Variantlı sual (Multiple Choice)**
- MCQ_SINGLE - Single choice
- MCQ_MULTI - Multiple choice
- TF - True/False
- TF_NG - True/False/Not Given
- INLINE_SELECT - Dropdown selection

**Açıq sual (Open Questions)**
- SHORT_TEXT - Short answer
- ESSAY - Essay question
- FILL_IN_BLANK - Fill in the blanks

**Drag and Drop**
- ORDER_SENTENCE - Sentence ordering
- DND_GAP - Drag and drop to fill gaps

**Interactive**
- IMAGE_INTERACTIVE - Clickable image hotspots

**Kodlama (Coding)**
- HTML_CSS - HTML/CSS interactive question

**IELTS Speaking**
- SPEAKING_RECORDING - Speaking recording prompt

### Step 4: Edit the Question
After selecting a type, the Edit Question modal opens with specialized fields.

---

## HTML/CSS Questions (Special Case)

### What You'll See
The edit modal for HTML/CSS questions includes:

#### 1. Instructions Banner (Blue)
Shows examples of how to create interactive elements:
- **Text inputs**: `data-answer="ans1 | ans2 | ans3"`
- **Radio buttons**: `data-correct="true"`
- Code examples you can copy

#### 2. Question Instructions Field
Tell students what to do:
```
Example: Fill in the form below. For the age field, enter a number. 
For the question 'What is 60% as a decimal?', you can write 0.6 or 0.60 or 60%.
```

#### 3. HTML Code Editor
Write your HTML with interactive elements:

**Text Input Example:**
```html
<input type="text" data-answer="60% | 0.6 | sixty percent" />
```

**Radio Button Example:**
```html
<input type="radio" name="q1" value="A" data-correct="true" /> Option A
<input type="radio" name="q1" value="B" /> Option B
```

**Checkbox Example:**
```html
<input type="checkbox" data-answer="true" /> Check if correct
```

#### 4. CSS Code Editor (Optional)
Add styling for your HTML:
```css
body {
  font-family: Arial, sans-serif;
  padding: 20px;
}

input {
  margin: 10px 0;
  padding: 5px;
}
```

#### 5. Live Preview
See exactly how your question will appear during the exam:
- Shows in an iframe
- Updates as you type
- Toggle show/hide with button

### Answer Key Auto-Extraction
The system automatically creates answer keys from your HTML:
- For text inputs: Extracts all answers from `data-answer` (separated by `|`)
- For radio/checkboxes: Finds elements with `data-correct="true"`
- You don't need to manually create the answer key!

---

## Editing Existing Questions

### How to Edit
1. Find the question in the list
2. Click the **pencil icon** (Edit) on the right
3. The same Edit Question modal opens
4. Make your changes
5. Click **"Save Question"**

### What You Can Edit
- Question text/prompt
- All question-specific fields
- Options (for MCQ)
- Answer keys
- Images
- Everything except the question type

---

## Other Question Types

### MCQ (Multiple Choice)
- Add/remove options
- Mark correct answer(s)
- Reorder options

### Drag and Drop (DND_GAP)
- Write text with blanks (use `___`)
- Add words to the word bank
- System creates answer key

### Image Interactive
- Upload a background image
- Click to add hotspots
- Mark correct hotspots
- Drag to position hotspots

### Fill in the Blank
- Write text with `[input]` placeholders
- Define correct answers for each blank
- Multiple answers per blank supported

### Speaking Recording
- Write speaking prompt
- Select part (Part 1, 2, or 3)
- No answer key needed (manual grading)

---

## Preview Questions

### Before Saving
- Every edit modal has a **"Question Preview"** section at the bottom
- Shows exactly how the question will appear to students

### From List View
- Click the **eye icon** (Preview) next to any question
- Opens a preview modal
- See the question without editing

---

## Tips and Best Practices

### For HTML/CSS Questions
1. **Always use name or id attributes** on inputs
   - Bad: `<input type="text" />`
   - Good: `<input type="text" name="q1" data-answer="..." />`

2. **Use pipe `|` for multiple correct answers**
   - `data-answer="60% | 0.6 | sixty percent"`
   - System accepts any of these as correct

3. **Test your live preview**
   - Make sure it looks good before saving
   - Check that inputs are visible and styled

4. **Keep it simple**
   - Avoid complex JavaScript (not supported)
   - Focus on HTML form elements

5. **Be specific in instructions**
   - Tell students exactly what format to use
   - Example: "Enter numbers only" or "Select all that apply"

### For All Question Types
1. **Write clear instructions**
   - Tell students what to do
   - Specify format if important

2. **Use images when helpful**
   - Upload diagrams, charts, graphs
   - Supports JPG, PNG, etc.

3. **Preview before saving**
   - Always check the preview
   - Make sure everything looks correct

4. **Save often**
   - Changes are saved immediately to database
   - You can always edit again later

---

## Common Issues

### "Question not appearing in exam"
- Make sure you saved (clicked "Save Question")
- Refresh the page to verify it saved
- Check you're in the right section/part

### "HTML inputs not working"
- Add `name` or `id` attributes to all inputs
- Use `data-answer` for text inputs
- Use `data-correct="true"` for radio/checkboxes

### "Live preview not showing"
- Check for HTML syntax errors
- Make sure you have `<body>` content
- Try clicking "Show" button

### "Answer keys not auto-extracted"
- Verify `data-answer` format: `"ans1 | ans2"`
- Check for typos in attribute names
- Make sure quotes are correct

---

## Keyboard Shortcuts

Currently, standard shortcuts work:
- **Tab**: Move between fields
- **Ctrl+Enter**: (Future: Quick save)
- **Esc**: Close modal

---

## Support

If you encounter issues:
1. Check this guide first
2. Try refreshing the page
3. Check browser console for errors
4. Contact support with:
   - Screenshot of the issue
   - Question type you're using
   - What you were trying to do

---

## Limits

- Maximum image size: 5MB
- Supported image formats: JPG, PNG, GIF, WebP
- HTML/CSS: No JavaScript execution
- Questions are saved individually (not bulk)

---

## Future Features

Coming soon:
- Delete questions from Quick Edit
- Drag-and-drop reordering
- Duplicate questions
- Bulk import/export
- Keyboard shortcuts
- More question types

---

## Quick Reference

### HTML/CSS Syntax
```html
<!-- Text input with multiple answers -->
<input type="text" name="q1" data-answer="60% | 0.6 | sixty percent" />

<!-- Radio button (correct) -->
<input type="radio" name="q2" value="A" data-correct="true" /> Option A

<!-- Radio button (incorrect) -->
<input type="radio" name="q2" value="B" /> Option B

<!-- Checkbox (correct) -->
<input type="checkbox" name="q3" data-answer="true" /> Check this

<!-- Textarea -->
<textarea name="q4" data-answer="answer text"></textarea>

<!-- Select dropdown -->
<select name="q5" data-answer="option1">
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>
```

### Common CSS
```css
/* Basic styling */
body {
  font-family: Arial, sans-serif;
  padding: 20px;
  line-height: 1.6;
}

/* Input styling */
input[type="text"],
textarea {
  border: 1px solid #ccc;
  padding: 8px;
  border-radius: 4px;
  font-size: 14px;
}

/* Radio/Checkbox spacing */
input[type="radio"],
input[type="checkbox"] {
  margin-right: 5px;
}

/* Labels */
label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
```

---

**Happy question creating! 🎉**
