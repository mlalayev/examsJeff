# HTML/CSS Interactive Questions - Complete Guide (Updated)

## ✨ NEW FEATURES

### 1. **Multiple Acceptable Answers for Text Inputs**
Students can answer in different ways, and any match counts as correct!

**Example:**
```
Question: "What is 60% as a decimal?"

Acceptable Answers:
- 0.6
- 0.60
- 60%
- sixty percent

Student writes ANY of these → ✅ Correct!
```

### 2. **Multiple Correct Radio Button Options**
You can mark multiple radio options as correct!

**Example:**
```html
<p>Which of these are programming languages?</p>
<input type="radio" data-answer="q1" value="python" /> Python ✅
<input type="radio" data-answer="q1" value="html" /> HTML ❌
<input type="radio" data-answer="q1" value="javascript" /> JavaScript ✅
```

Both "python" AND "javascript" are marked as correct answers!

---

## 📝 Complete Example with All Features

### HTML Code:
```html
<style>
  h3 { color: #333; }
  label { display: block; font-weight: bold; margin-top: 10px; }
  input, select { padding: 5px; margin: 5px 0; }
</style>

<h3>Student Information Form</h3>

<label>1. What percentage of students passed? (Write as percentage)</label>
<input type="text" data-answer="percentage" placeholder="Enter percentage" />

<label>2. What is 3 + 7?</label>
<input type="text" data-answer="math1" placeholder="Enter answer" />

<label>3. Select your age group:</label>
<select data-answer="agegroup">
  <option value="">Choose...</option>
  <option value="10-15">10-15 years</option>
  <option value="16-18">16-18 years</option>
  <option value="19+">19+ years</option>
</select>

<label>4. Which of these are web technologies? (Select all correct)</label>
<input type="radio" name="webtech" data-answer="webtech" value="html" /> HTML<br>
<input type="radio" name="webtech" data-answer="webtech" value="word" /> Microsoft Word<br>
<input type="radio" name="webtech" data-answer="webtech" value="css" /> CSS<br>
<input type="radio" name="webtech" data-answer="webtech" value="excel" /> Excel<br>

<label>5. Do you agree to the terms?</label>
<input type="checkbox" data-answer="agree" /> Yes, I agree
```

---

### Question Instructions (What Students See):

```
Fill in the form below with correct information:

1. For percentage: You can write "75%", "75 percent", or "seventy-five percent"
2. For math question: Enter the number
3. Select your age group from dropdown
4. For web technologies: Click ALL options that are web technologies (there may be more than one!)
5. Check the box if you agree

Make sure to answer all questions before submitting.
```

---

### Setting Correct Answers (Answer Key Section):

#### **For Text Input #1 (percentage):**
```
ID: percentage
Type: text

Correct Answers (one per line):
75%
75 percent
seventy-five percent
0.75

✅ Any of these will be marked correct!
```

#### **For Text Input #2 (math1):**
```
ID: math1
Type: text

Correct Answers (one per line):
10
ten

✅ Either "10" or "ten" accepted
```

#### **For Select Dropdown (agegroup):**
```
ID: agegroup
Type: select

Correct Answer:
16-18

✅ Only students who select "16-18 years" are correct
```

#### **For Radio Buttons (webtech):**
```
ID: webtech
Type: radio group • 4 options

Select Correct Answer(s):
☑️ HTML (value: html)
☐ Microsoft Word (value: word)
☑️ CSS (value: css)
☐ Excel (value: excel)

✅ You can select multiple correct answers!
Student must select either HTML or CSS to be correct
```

#### **For Checkbox (agree):**
```
ID: agree
Type: checkbox

☑️ Should be checked

✅ Student must check this box
```

---

## 🎯 How It Works During Exam

### Student View:
```
┌─────────────────────────────────────────────────────────┐
│ ℹ️ Fill in the form below with correct information:     │
│                                                         │
│ 1. For percentage: You can write "75%", "75 percent",  │
│    or "seventy-five percent"                            │
│ 2. For math question: Enter the number                 │
│ 3. Select your age group from dropdown                 │
│ 4. For web technologies: Click ALL options that are    │
│    web technologies (there may be more than one!)      │
│ 5. Check the box if you agree                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 👁 Interactive Question                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Student Information Form                               │
│                                                         │
│  1. What percentage of students passed?                 │
│  [75%                           ]                       │
│                                                         │
│  2. What is 3 + 7?                                      │
│  [10                            ]                       │
│                                                         │
│  3. Select your age group:                              │
│  [16-18 years ▼]                                        │
│                                                         │
│  4. Which of these are web technologies?                │
│  ⦿ HTML                                                 │
│  ○ Microsoft Word                                       │
│  ○ CSS                                                  │
│  ○ Excel                                                │
│                                                         │
│  5. Do you agree to the terms?                          │
│  ☑ Yes, I agree                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ 💡 Interact with elements above. Answers auto-saved.    │
└─────────────────────────────────────────────────────────┘

Your Current Answers:
percentage: 75%
math1: 10
agegroup: 16-18
webtech: html
agree: true
```

---

## 🏆 Grading Examples

### Example 1: Text Input with Multiple Acceptable Answers

**Question:** "What is 60% as a decimal?"

**Acceptable Answers:**
- 0.6
- 0.60
- 60%
- sixty percent

**Student Answers:**
- Student A writes: `0.6` → ✅ **Correct** (matches first option)
- Student B writes: `60%` → ✅ **Correct** (matches third option)
- Student C writes: `sixty percent` → ✅ **Correct** (matches fourth option)
- Student D writes: `0.600` → ❌ **Incorrect** (not in acceptable list)

---

### Example 2: Radio with Multiple Correct Options

**Question:** "Which are primary colors?"

**Radio Options:**
```html
<input type="radio" data-answer="colors" value="red" /> Red ✅
<input type="radio" data-answer="colors" value="blue" /> Blue ✅
<input type="radio" data-answer="colors" value="yellow" /> Yellow ✅
<input type="radio" data-answer="colors" value="green" /> Green ❌
```

**Correct Answers Marked:** red, blue, yellow

**Student Answers:**
- Student A selects: `red` → ✅ **Correct**
- Student B selects: `blue` → ✅ **Correct**
- Student C selects: `yellow` → ✅ **Correct**
- Student D selects: `green` → ❌ **Incorrect**

---

## 📋 Answer Key Reference (Updated)

### Text Inputs
```
Correct Answers (one per line):
answer1
answer2
answer3

System checks if student's answer matches ANY line
Case-sensitive by default
```

### Radio Buttons
```
☑️ Option A (value: a)
☐ Option B (value: b)
☑️ Option C (value: c)

Student must select any checked option to be correct
Can have multiple correct options!
```

### Checkboxes
```
☑️ Should be checked

or

☐ Should NOT be checked
```

### Select Dropdowns
```
Correct Answer: [value]

Exactly matches the value attribute
```

---

## 💡 Best Practices

### 1. **Writing Good Question Instructions**

❌ **Bad:** "Answer the questions"

✅ **Good:** 
```
Fill in the form below:
1. For percentage questions: You can write "75%" or "75 percent"
2. For the math question: Enter just the number (e.g., 10)
3. For multiple choice: Select ALL correct answers
4. Read each question carefully before answering
```

### 2. **Adding Multiple Acceptable Answers**

For text inputs where students might answer differently:

**Math Questions:**
```
10
ten
Ten
TEN
```

**Percentages:**
```
75%
75 percent
seventy-five percent
0.75
.75
```

**Yes/No Questions:**
```
yes
Yes
YES
y
Y
```

### 3. **Radio Button Best Practices**

- Use clear labels
- If multiple answers are correct, tell students in instructions!
- Example: "Select ALL correct options (there may be more than one)"

---

## 🎓 Complete Working Examples

### Example 1: Simple Quiz

**HTML:**
```html
<h3>Quick Math Quiz</h3>

<p>1. What is 5 + 5?</p>
<input type="text" data-answer="q1" />

<p>2. Which is larger?</p>
<input type="radio" name="q2" data-answer="q2" value="10" /> 10<br>
<input type="radio" name="q2" data-answer="q2" value="100" /> 100<br>

<p>3. Is 2 + 2 = 4?</p>
<input type="checkbox" data-answer="q3" /> True
```

**Instructions:**
```
Answer all questions:
1. Enter the number or write it in words
2. Click the correct option
3. Check the box if the statement is true
```

**Correct Answers:**
- q1: `10`, `ten`, `Ten`
- q2: `100` (checked)
- q3: `true` (checked)

---

### Example 2: Survey Form

**HTML:**
```html
<h3>Student Survey</h3>

<label>Full Name:</label>
<input type="text" data-answer="name" />

<label>Favorite Subject:</label>
<select data-answer="subject">
  <option value="">Choose...</option>
  <option value="math">Mathematics</option>
  <option value="science">Science</option>
  <option value="english">English</option>
</select>

<label>Select all that apply:</label>
<input type="checkbox" data-answer="like_math" /> I like math<br>
<input type="checkbox" data-answer="like_science" /> I like science<br>
```

**Instructions:**
```
Complete the survey form:
- Enter your full name
- Select your favorite subject
- Check all boxes that apply to you
```

**Correct Answers:**
- name: `John Smith`, `Jane Doe` (example expected names)
- subject: `math`
- like_math: `true`
- like_science: `false`

---

## 🔧 Technical Details

### Data Structure

**Stored in Database:**
```json
{
  "answerKey": {
    "interactiveAnswers": {
      "percentage": ["75%", "75 percent", "seventy-five percent"],
      "math1": ["10", "ten"],
      "webtech": ["html", "css"],
      "agree": true
    }
  }
}
```

**Student Answer:**
```json
{
  "percentage": "75%",
  "math1": "10",
  "agegroup": "16-18",
  "webtech": "html",
  "agree": true
}
```

### Grading Logic

1. **Text Inputs:** Check if student answer matches ANY item in the acceptable answers array
2. **Radio Buttons:** Check if student's selection is in the correct answers array
3. **Checkboxes:** Check if boolean matches
4. **Selects:** Exact match with correct value

---

This system now supports flexible answering with multiple acceptable formats! 🎉
