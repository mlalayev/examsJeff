# HTML/CSS Question Type - Quick Reference Card

## ✅ What You Can Do

### In Question Editor:
- ✅ Write HTML code with live preview
- ✅ Write CSS code with live preview  
- ✅ See exactly how students will see the question
- ✅ Add multiple correct answer solutions
- ✅ Toggle preview on/off
- ✅ See line counts in real-time

### In Answer Key Section:
- ✅ Add correct HTML code
- ✅ Add correct CSS code
- ✅ Add alternative correct solutions (separated by `---`)
- ✅ Leave empty for manual grading

### During Exam:
- ✅ Students see your reference code
- ✅ Students write their own code
- ✅ Students see live preview of their code
- ✅ Preview updates as they type
- ✅ Code editors are resizable

---

## 📝 Question Editor Sections (Top to Bottom)

1. **Question Type** (gray box) - Shows "HTML/CSS Code Question"
2. **Question Instructions** - What task students should complete
3. **HTML Code Editor** - Reference HTML for students
4. **CSS Code Editor** - Reference CSS for students (optional)
5. **Live Preview** - Shows how code renders
6. **Correct HTML Answer** - One correct solution (optional)
7. **Correct CSS Answer** - One correct solution (optional)
8. **Alternative Answers** - Other valid solutions (optional)
9. **Preview** - How students will see the question

---

## 🎨 Visual Elements

### Info Banners (Blue with ℹ️)
- Instructions for question creation
- Multiple answers explanation

### Code Editors
- Monospace font
- Gray background
- Line counter in top-right
- Resizable height

### Live Preview Box
- Bordered container
- Toggle show/hide button
- Iframe with rendered code
- Updates in real-time

### Warning Notes (Amber with ⚠️)
- Manual grading notice
- Important information

---

## 🔢 Example Question Structure

```
Instructions: "Create a red button with white text"

Reference HTML:
<button>Click Me</button>

Reference CSS:
/* Add your styles here */

Correct HTML Answer:
<button style="background:red;color:white">Click Me</button>

Correct CSS Answer:
button {
  background-color: red;
  color: white;
}

Alternative Answers:
<button style="background:#ff0000;color:#fff">Click Me</button>
---
<button class="btn">Click Me</button>
/* with .btn { background:red; color:white; } */
```

---

## 📋 Grading Options

### Option 1: Automatic Grading
✅ Add correct HTML code  
✅ Add correct CSS code  
✅ Add alternatives if needed  
→ System auto-grades by matching code

### Option 2: Manual Grading
❌ Leave answer key empty  
→ Instructor grades manually  
→ Can test code with live preview

---

## 🎯 Quick Tips

1. **Be Specific** - Clear requirements help students
2. **Test Preview** - Always check live preview before saving
3. **Multiple Solutions** - Add alternatives for flexibility
4. **Starter Code** - Provide reference code when helpful
5. **Realistic Complexity** - Match difficulty to exam level

---

## 🔍 Where to Find It

**Question Type Modal:**
1. Click "Add Question"
2. Look for "Kodlama" section
3. Select "HTML/CSS Code Question"

---

## 💾 How Data is Stored

```json
{
  "qtype": "HTML_CSS",
  "prompt": {
    "text": "Question instructions",
    "htmlCode": "Reference HTML",
    "cssCode": "Reference CSS"
  },
  "answerKey": {
    "correctHTML": "Correct HTML solution",
    "correctCSS": "Correct CSS solution",
    "alternativeAnswers": ["alt1", "alt2"],
    "allowMultipleAnswers": true
  }
}
```

**Student Answer:**
```json
{
  "html": "Student's HTML code",
  "css": "Student's CSS code"
}
```

---

## ⚡ Key Features

| Feature | Editor | Exam |
|---------|--------|------|
| Live Preview | ✅ Yes | ✅ Yes |
| Code Highlighting | ✅ Monospace | ✅ Monospace |
| Resizable | ✅ Yes | ✅ Yes |
| Line Count | ✅ Yes | ✅ Yes |
| Toggle Preview | ✅ Yes | ✅ Yes |
| Reference Code | ✅ Show | ✅ Show |
| Multiple Answers | ✅ Yes | - |
| Manual Grading | ✅ Optional | - |

---

## 🚀 Getting Started

1. Create new question
2. Select "HTML/CSS Code Question"
3. Write question instructions
4. Add HTML code (shown to students)
5. Add CSS code if needed
6. Watch live preview
7. Add correct answers (or skip for manual grading)
8. Save question
9. Done!

---

## 📄 Documentation Files

- `HTML_CSS_QUESTION_TYPE.md` - Complete guide
- `HTML_CSS_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `HTML_CSS_VISUAL_GUIDE.md` - Visual layout guide

---

## 🎓 Use Cases

- "Create a navigation bar"
- "Style a heading to be blue and centered"
- "Make a responsive button"
- "Build a card component"
- "Create a flexbox layout"
- "Style form inputs"
- "Create hover effects"

---

## ✨ Pro Tips

- Use clear color codes (hex or names)
- Specify exact sizes when needed
- Consider browser compatibility
- Test code in preview first
- Provide helpful starter code
- Think about different solutions
- Use realistic scenarios

---

That's it! You're ready to create HTML/CSS questions! 🎉
