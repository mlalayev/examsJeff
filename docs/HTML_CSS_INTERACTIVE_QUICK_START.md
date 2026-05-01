# HTML/CSS Interactive Questions - Quick Visual Guide

## ✨ How It Works in 3 Steps

### Step 1: Add HTML with `data-answer` attributes

```html
<input type="text" data-answer="name" placeholder="Your name" />
<input type="radio" name="q1" data-answer="q1" value="A" /> Option A
<input type="checkbox" data-answer="agree" /> I agree
```

### Step 2: System Auto-Detects Elements

The answer key section automatically shows:
```
Found 3 interactive element(s):

┌─ ID: name ──────────────────────┐
│ Type: text                      │
│ Correct Answer: [____]          │
└─────────────────────────────────┘

┌─ ID: q1 ────────────────────────┐
│ Type: radio                     │
│ Correct Answer: [____]          │
└─────────────────────────────────┘

┌─ ID: agree ─────────────────────┐
│ Type: checkbox                  │
│ Correct Answer: [____]          │
└─────────────────────────────────┘
```

### Step 3: Students Interact During Exam

```
┌─────────────────────────────────┐
│ 👁 Interactive Question         │
├─────────────────────────────────┤
│ Your name: [___________]        │
│                                 │
│ ○ Option A  ○ Option B          │
│                                 │
│ ☐ I agree                       │
└─────────────────────────────────┘

Your Current Answers:
name: John
q1: A
agree: true
```

---

## 📝 Complete Example

### In Question Editor:

**HTML Code:**
```html
<h3>Simple Quiz</h3>

<p>1. What is 2 + 2?</p>
<input type="text" data-answer="math1" placeholder="Enter answer" />

<p>2. Is HTML a programming language?</p>
<input type="radio" name="q2" data-answer="q2" value="yes" /> Yes
<input type="radio" name="q2" data-answer="q2" value="no" /> No

<p>3. Select web technologies you know:</p>
<input type="checkbox" data-answer="html" /> HTML
<input type="checkbox" data-answer="css" /> CSS
<input type="checkbox" data-answer="js" /> JavaScript
```

**Correct Answers Section Shows:**
```
┌─────────────────────────────────────────────────┐
│ ID: math1                                       │
│ Type: text                                      │
│ Correct Answer: [4               ]             │
│ • For text input: exact answer (case-sensitive)│
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ID: q2                                          │
│ Type: radio                                     │
│ Correct Answer: [no              ]             │
│ • For radio: value attribute of correct option │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ID: html                                        │
│ Type: checkbox                                  │
│ Correct Answer: [true            ]             │
│ • For checkbox: "true" if should be checked    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ID: css                                         │
│ Type: checkbox                                  │
│ Correct Answer: [true            ]             │
│ • For checkbox: "true" if should be checked    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ID: js                                          │
│ Type: checkbox                                  │
│ Correct Answer: [true            ]             │
│ • For checkbox: "true" if should be checked    │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Quick Reference

### data-answer Attribute

**Purpose:** Marks which elements need answers

**Format:** `data-answer="unique_id"`

**Examples:**
```html
✅ <input type="text" data-answer="studentName" />
✅ <input type="radio" name="q1" data-answer="q1" value="A" />
✅ <select data-answer="color"><option>...</option></select>

❌ <input type="text" />  (missing data-answer)
❌ <input data-answer="name 1" />  (spaces not allowed)
```

---

### Answer Formats

| Element | What to Enter | Example |
|---------|--------------|---------|
| `<input type="text">` | Exact text | `John Smith` |
| `<input type="radio">` | Value of correct option | `A` or `yes` |
| `<input type="checkbox">` | `true` or `false` | `true` |
| `<select>` | Value of correct option | `red` |

---

### Radio Buttons Special Case

For radio buttons in the same group:
```html
<!-- All have SAME data-answer but DIFFERENT values -->
<input type="radio" name="question1" data-answer="q1" value="A" /> Option A
<input type="radio" name="question1" data-answer="q1" value="B" /> Option B
<input type="radio" name="question1" data-answer="q1" value="C" /> Option C
```

**Correct Answer:** Enter the value (`A`, `B`, or `C`)

---

### Checkboxes Special Case

Each checkbox needs its own data-answer:
```html
<!-- Each has DIFFERENT data-answer -->
<input type="checkbox" data-answer="hobby1" /> Reading
<input type="checkbox" data-answer="hobby2" /> Sports
<input type="checkbox" data-answer="hobby3" /> Music
```

**Correct Answers:**
- `hobby1`: `true` (if should be checked)
- `hobby2`: `false` (if should NOT be checked)
- `hobby3`: `true`

---

## 💡 Pro Tips

1. **Use Clear IDs**: `data-answer="studentName"` not `data-answer="sn"`
2. **Test in Preview**: Always check the live preview works
3. **Case-Sensitive**: Text inputs are case-sensitive: `John` ≠ `john`
4. **Add CSS**: Style your form to make it look professional
5. **Instructions**: Add clear labels so students know what to enter

---

## 🚀 Quick Start

1. Click "Add Question" → "Kodlama" → "HTML/CSS Code Question"
2. Add HTML with `data-answer` attributes
3. System auto-detects interactive elements
4. Fill in correct answers
5. Save!

That's it! Students will interact with real form elements during the exam.
