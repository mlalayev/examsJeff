# HTML/CSS Interactive Question Type - Complete Guide

## Overview
Create questions with interactive HTML elements (inputs, radio buttons, checkboxes, selects) that students interact with during the exam. The system automatically detects interactive elements and lets you define correct answers for each one.

---

## How It Works

### 1. **Add Interactive Elements to HTML**

Use the `data-answer="id"` attribute to mark elements that need answers:

```html
<!-- Text Input -->
<input type="text" data-answer="name" placeholder="Enter your name" />

<!-- Radio Buttons -->
<input type="radio" name="choice" data-answer="question1" value="A" /> Option A
<input type="radio" name="choice" data-answer="question1" value="B" /> Option B

<!-- Checkboxes -->
<input type="checkbox" data-answer="agree" value="yes" /> I agree

<!-- Select Dropdown -->
<select data-answer="color">
  <option value="">Choose...</option>
  <option value="red">Red</option>
  <option value="blue">Blue</option>
</select>
```

**Important**: The `data-answer` attribute tells the system which elements to track.

---

### 2. **Question Editor Interface**

When you create an HTML/CSS question, you'll see:

#### **Step 1: Write Your HTML**
```
Question Instructions:
"Fill in the form below with the correct information"

HTML Code:
<form>
  <label>Your Name:</label>
  <input type="text" data-answer="studentName" placeholder="Enter name" />
  
  <label>Choose your grade:</label>
  <select data-answer="grade">
    <option value="">Select...</option>
    <option value="A">Grade A</option>
    <option value="B">Grade B</option>
    <option value="C">Grade C</option>
  </select>
  
  <label>Gender:</label>
  <input type="radio" name="gender" data-answer="gender" value="male" /> Male
  <input type="radio" name="gender" data-answer="gender" value="female" /> Female
</form>

CSS Code:
form {
  padding: 20px;
}
label {
  display: block;
  margin-top: 10px;
  font-weight: bold;
}
```

#### **Step 2: Set Correct Answers**

The system **automatically detects** your interactive elements and shows:

```
┌─────────────────────────────────────────────────────────┐
│ ℹ️ Set Correct Answers for Interactive Elements         │
│ For each element with data-answer attribute, specify    │
│ the correct answer below.                               │
└─────────────────────────────────────────────────────────┘

Found 3 interactive element(s):

┌─────────────────────────────────────────────────────────┐
│ ID: studentName                                         │
│ Type: text • Label: Enter name                          │
│                                                         │
│ Correct Answer:                                         │
│ [John Smith                                      ]      │
│ • For text input: enter the exact answer (case-sensitive)│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ID: grade                                               │
│ Type: select • Label: Select...                         │
│                                                         │
│ Correct Answer:                                         │
│ [A                                               ]      │
│ • For select: enter the value of correct option        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ID: gender                                              │
│ Type: radio • Label: Male                               │
│                                                         │
│ Correct Answer:                                         │
│ [male                                            ]      │
│ • For radio: enter the value attribute of correct option│
└─────────────────────────────────────────────────────────┘
```

---

### 3. **During the Exam (Student View)**

Students see:

```
┌─────────────────────────────────────────────────────────┐
│ ℹ️ Fill in the form below with the correct information  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 👁 Interactive Question                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Your form renders here - fully interactive]          │
│                                                         │
│  Your Name:                                             │
│  [___________________________]                          │
│                                                         │
│  Choose your grade:                                     │
│  [Select... ▼]                                          │
│                                                         │
│  Gender:                                                │
│  ○ Male  ○ Female                                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ 💡 Interact with elements above. Answers auto-saved.    │
└─────────────────────────────────────────────────────────┘

Your Current Answers:
studentName: John Smith
grade: A
gender: male
```

---

## Complete Example Questions

### Example 1: Simple Contact Form

**HTML:**
```html
<h3>Contact Information</h3>
<form>
  <div>
    <label>Full Name:</label>
    <input type="text" data-answer="fullname" placeholder="Enter your full name" />
  </div>
  
  <div>
    <label>Email:</label>
    <input type="email" data-answer="email" placeholder="your@email.com" />
  </div>
  
  <div>
    <label>Age:</label>
    <input type="number" data-answer="age" placeholder="18" />
  </div>
</form>
```

**Correct Answers:**
- `fullname`: `John Smith`
- `email`: `john@example.com`
- `age`: `25`

---

### Example 2: Quiz with Radio Buttons

**HTML:**
```html
<h3>HTML Quiz</h3>

<p><strong>Question 1:</strong> What does HTML stand for?</p>
<input type="radio" name="q1" data-answer="q1" value="a" /> Hyper Text Markup Language<br>
<input type="radio" name="q1" data-answer="q1" value="b" /> Home Tool Markup Language<br>
<input type="radio" name="q1" data-answer="q1" value="c" /> Hyperlinks Text Mark Language<br>

<p><strong>Question 2:</strong> Which tag is used for links?</p>
<input type="radio" name="q2" data-answer="q2" value="a" /> &lt;link&gt;<br>
<input type="radio" name="q2" data-answer="q2" value="b" /> &lt;a&gt;<br>
<input type="radio" name="q2" data-answer="q2" value="c" /> &lt;href&gt;<br>
```

**Correct Answers:**
- `q1`: `a`
- `q2`: `b`

---

### Example 3: Checkboxes and Select

**HTML:**
```html
<h3>Survey Form</h3>

<p><strong>Select your favorite color:</strong></p>
<select data-answer="color">
  <option value="">Choose...</option>
  <option value="red">Red</option>
  <option value="blue">Blue</option>
  <option value="green">Green</option>
</select>

<p><strong>Select your hobbies:</strong></p>
<input type="checkbox" data-answer="hobby_reading" value="yes" /> Reading<br>
<input type="checkbox" data-answer="hobby_sports" value="yes" /> Sports<br>
<input type="checkbox" data-answer="hobby_music" value="yes" /> Music<br>
```

**Correct Answers:**
- `color`: `blue`
- `hobby_reading`: `true` (if should be checked)
- `hobby_sports`: `true`
- `hobby_music`: `false` (if should NOT be checked)

---

## Answer Format Reference

| Element Type | Correct Answer Format | Example |
|--------------|----------------------|---------|
| Text Input | Exact text (case-sensitive) | `John Smith` |
| Number Input | Number as text | `25` |
| Email Input | Email string | `test@example.com` |
| Radio Button | Value attribute of correct option | `a` or `male` |
| Checkbox | `true` if should be checked, `false` if not | `true` |
| Select Dropdown | Value attribute of correct option | `red` or `option1` |

---

## Important Rules

### ✅ DO:
- Use `data-answer="unique_id"` on all interactive elements
- Use unique IDs for each element
- Test your HTML in the live preview
- For radios, make sure all options have the same `name` but same `data-answer`
- For checkboxes, each one needs its own `data-answer`

### ❌ DON'T:
- Use same `data-answer` ID for different elements (except radio buttons in same group)
- Forget to set correct answers for all elements
- Use special characters in `data-answer` IDs (use letters, numbers, underscores)

---

## How Grading Works

1. **System collects student answers** from all elements with `data-answer`
2. **Compares with correct answers** you defined
3. **Each element is scored individually**:
   - Text inputs: Case-sensitive exact match
   - Radio buttons: Value must match
   - Checkboxes: Boolean must match
   - Selects: Value must match
4. **Final score** = (correct answers / total elements) × maxScore

---

## Data Structure

### Stored in Database:

```json
{
  "qtype": "HTML_CSS",
  "prompt": {
    "text": "Fill in the form below",
    "htmlCode": "<input data-answer='name' />...",
    "cssCode": "input { padding: 5px; }"
  },
  "answerKey": {
    "interactiveAnswers": {
      "name": "John Smith",
      "age": "25",
      "gender": "male",
      "hobby_reading": "true"
    }
  }
}
```

### Student Answer:

```json
{
  "name": "Jane Doe",
  "age": "30",
  "gender": "female",
  "hobby_reading": "true"
}
```

---

## Advanced Example: Complete Registration Form

**HTML:**
```html
<style>
  .form-container {
    max-width: 500px;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
  }
  .form-group {
    margin-bottom: 15px;
  }
  label {
    display: block;
    font-weight: bold;
    margin-bottom: 5px;
  }
  input[type="text"],
  input[type="email"],
  input[type="number"],
  select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
</style>

<div class="form-container">
  <h2>Student Registration Form</h2>
  
  <div class="form-group">
    <label>Full Name:</label>
    <input type="text" data-answer="fullname" placeholder="Enter your full name" required />
  </div>
  
  <div class="form-group">
    <label>Email Address:</label>
    <input type="email" data-answer="email" placeholder="your@email.com" required />
  </div>
  
  <div class="form-group">
    <label>Age:</label>
    <input type="number" data-answer="age" min="10" max="100" required />
  </div>
  
  <div class="form-group">
    <label>Grade Level:</label>
    <select data-answer="grade" required>
      <option value="">Select grade...</option>
      <option value="9">Grade 9</option>
      <option value="10">Grade 10</option>
      <option value="11">Grade 11</option>
      <option value="12">Grade 12</option>
    </select>
  </div>
  
  <div class="form-group">
    <label>Gender:</label>
    <input type="radio" name="gender" data-answer="gender" value="male" /> Male
    <input type="radio" name="gender" data-answer="gender" value="female" /> Female
    <input type="radio" name="gender" data-answer="gender" value="other" /> Other
  </div>
  
  <div class="form-group">
    <label>Select subjects you're interested in:</label>
    <input type="checkbox" data-answer="subject_math" value="yes" /> Mathematics<br>
    <input type="checkbox" data-answer="subject_science" value="yes" /> Science<br>
    <input type="checkbox" data-answer="subject_english" value="yes" /> English<br>
    <input type="checkbox" data-answer="subject_history" value="yes" /> History
  </div>
  
  <div class="form-group">
    <label>Additional Comments:</label>
    <textarea data-answer="comments" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
  </div>
</div>
```

**Correct Answers:**
- `fullname`: `John Smith`
- `email`: `john.smith@school.com`
- `age`: `16`
- `grade`: `10`
- `gender`: `male`
- `subject_math`: `true`
- `subject_science`: `true`
- `subject_english`: `false`
- `subject_history`: `false`
- `comments`: `I love mathematics and science!`

---

This is now a fully interactive HTML/CSS question type where students interact with real form elements!
