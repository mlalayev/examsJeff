# HTML/CSS Question Type - Implementation Summary

## What Was Added

A new question type `HTML_CSS` has been added to the exam system. This allows you to create coding questions where students write HTML and CSS code with live preview.

---

## Key Features

### 1. **Live Preview in Question Editor**
- As you type HTML/CSS code, you see a live preview
- Preview shows exactly how it will appear in the exam
- Can toggle preview on/off

### 2. **Live Preview in Exam**
- Students see their code rendered in real-time
- Helps them verify their work as they code
- Same preview interface as the editor

### 3. **Multiple Correct Answers**
- You can add multiple correct HTML/CSS solutions
- Useful when there are different valid approaches
- Separate alternative answers with `---`

### 4. **Manual or Auto Grading**
- If you provide answer key → automatic grading
- If you leave answer key empty → manual grading by instructor
- Flexible for different assessment needs

---

## Complete Question Editor Interface

When you add an HTML/CSS question, you'll see these sections:

### **Section 1: Question Type** (Gray box at top)
```
Question Type
[HTML/CSS Code Question]
```

### **Section 2: Question Instructions** (Blue info banner + text field)
```
ℹ️ HTML/CSS Question Type Instructions:
• Write your HTML and CSS code below
• The live preview shows how the code will render in the exam
• Students will see this exact output during the exam
• You can add multiple correct answers in the "Correct Answer" section below
• This question type is for evaluating HTML/CSS knowledge

Question Instructions *
[Text area: "E.g., Create a button that is red with white text and rounded corners"]
→ This instruction will be shown to students
```

### **Section 3: HTML Code Editor**
```
</> HTML Code *                                                    X lines
[Code text area with monospace font]
→ Write the HTML code that students will see in the exam
```

### **Section 4: CSS Code Editor**
```
</> CSS Code                                                       X lines
[Code text area with monospace font]
→ CSS styling (optional, leave empty if not needed)
```

### **Section 5: Live Preview**
```
┌─────────────────────────────────────────────────┐
│ 👁 Live Preview (How it will appear in exam) [Hide]│
├─────────────────────────────────────────────────┤
│                                                 │
│   [Live rendered HTML/CSS appears here]         │
│                                                 │
└─────────────────────────────────────────────────┘
```

### **Section 6: Correct Answer** (Below the question fields)
```
ℹ️ Multiple Correct Answers Supported
You can add multiple correct HTML/CSS solutions. Each answer should be entered separately below.

Correct HTML Code (Optional)
[Code text area]
→ Enter correct HTML code here (leave empty for manual grading)

Correct CSS Code (Optional)
[Code text area]
→ Enter correct CSS code here (leave empty for manual grading)

Alternative Correct Answers (Optional)
[Text area]
→ Add alternative solutions, separated by --- on a new line

⚠️ Note: If left empty, this question will require manual grading by instructors.
```

### **Section 7: Preview** (How students will see it)
```
Preview: How students will see this
┌─────────────────────────────────────────────────┐
│ 1  [Question text appears here]                 │
│                                                 │
│    [Live rendered preview of HTML/CSS]          │
└─────────────────────────────────────────────────┘
* This is how the question will appear to students during the exam
```

---

## What Students See During Exam

Students will see this interface:

```
┌─────────────────────────────────────────────────────────────┐
│ ℹ️ [Your question instructions appear here]                  │
└─────────────────────────────────────────────────────────────┘

Reference Code (For Your Reference)
┌─────────────────────────────────────────────────────────────┐
│ </> HTML Code                                               │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [Your reference HTML code shown here]                   ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ </> CSS Code                                                │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [Your reference CSS code shown here]                    ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

</> Your HTML Code
[Student types HTML here...]
→ X lines

</> Your CSS Code (Optional)
[Student types CSS here...]
→ X lines

┌─────────────────────────────────────────────────────────────┐
│ 👁 Live Preview                                    [Hide]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [Student's code renders here in real-time]                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Example Question Setup

### Example 1: Create a Red Button

**Question Instructions:**
```
Create a button with the following properties:
- Background color: red
- Text color: white
- Border radius: 5px
- Padding: 10px 20px
```

**Reference HTML Code:**
```html
<button>Click Me</button>
```

**Reference CSS Code:**
```css
/* Write your CSS here */
```

**Correct HTML Answer:**
```html
<button style="background-color: red; color: white; border-radius: 5px; padding: 10px 20px;">Click Me</button>
```

**Correct CSS Answer:**
```css
button {
  background-color: red;
  color: white;
  border-radius: 5px;
  padding: 10px 20px;
}
```

**Alternative Answers:**
```
button {
  background: red;
  color: #fff;
  border-radius: 5px;
  padding: 10px 20px;
}
---
button {
  background-color: #ff0000;
  color: white;
  border-radius: 5px;
  padding: 10px 20px;
}
```

### Example 2: Center a Heading (Manual Grading)

**Question Instructions:**
```
Style the heading to be:
- Centered on the page
- Blue color
- Font size: 32px
```

**Reference HTML Code:**
```html
<h1>Welcome to My Website</h1>
```

**Reference CSS Code:**
```css
/* Write your CSS here */
```

**Correct Answer:** *(Leave empty for manual grading)*

---

## How Multiple Correct Answers Work

When you add alternative answers, separate each solution with `---` on a new line:

```
Solution 1 code here
---
Solution 2 code here
---
Solution 3 code here
```

The system will check if the student's answer matches ANY of these solutions.

---

## Important Notes

### ✅ Best Practices
- Write clear, specific requirements
- Test your reference code in the preview
- Provide starter code when helpful
- Consider different valid solutions
- Use realistic complexity for exam level

### ⚠️ Things to Know
- HTML/CSS code is executed in a sandboxed iframe (safe)
- Students can see the reference code you provide
- Preview updates in real-time as students type
- Code is saved automatically as students work
- Line counts help students track their progress

### 🔒 Security
- Code runs in sandbox mode (`sandbox="allow-same-origin"`)
- No external scripts or resources can be loaded
- No access to parent page or user data
- Safe for both you and students

---

## Files Modified

1. `src/components/admin/exams/create/types.ts` - Added HTML_CSS type
2. `src/components/admin/exams/create/constants.ts` - Added labels and group
3. `src/components/admin/exams/create/questionHelpers.ts` - Added defaults
4. `src/components/admin/exams/create/questionModal/questionFields/prompts/PromptHtmlCss.tsx` - NEW editor
5. `src/components/admin/exams/create/questionModal/questionFields/QuestionPromptField.tsx` - Added HTML_CSS case
6. `src/components/admin/exams/create/questionModal/questionFields/QuestionAnswerKeyField.tsx` - Added answer key UI
7. `src/components/QuestionPreview.tsx` - Added preview rendering
8. `src/components/questions/QHtmlCss.tsx` - NEW student component
9. `src/app/attempts/[attemptId]/run/page.tsx` - Added to exam renderer
10. `prisma/schema.prisma` - Added HTML_CSS to enum
11. Database updated with new question type

---

## Testing Your First HTML/CSS Question

1. Go to exam creation page
2. Add a new question
3. Select "Kodlama" → "HTML/CSS Code Question"
4. Fill in the question instructions
5. Add HTML code in the editor
6. (Optional) Add CSS code
7. Watch the live preview update
8. Add correct answers (or leave empty for manual grading)
9. Save the question
10. Preview shows how students will see it

The question is now ready for use in exams!
