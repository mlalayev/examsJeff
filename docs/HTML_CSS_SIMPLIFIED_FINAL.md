# HTML/CSS Questions - SIMPLIFIED SYSTEM

## ✅ How It Works (FINAL)

### For Text Inputs - Multiple Correct Answers

```html
<input type="text" data-answer="60% | 0.6 | sixty percent" />
```

**Separate answers with ` | `** (pipe symbol with spaces)

Student writes "60%" → ✅ Correct  
Student writes "0.6" → ✅ Correct  
Student writes "sixty percent" → ✅ Correct

---

### For Radio Buttons - Mark Correct Options

```html
<input type="radio" name="q1" value="python" data-correct="true" /> Python
<input type="radio" name="q1" value="html" /> HTML
<input type="radio" name="q1" value="java" data-correct="true" /> Java
```

**Add `data-correct="true"`** to ALL correct options

Student selects Python → ✅ Correct  
Student selects HTML → ❌ Wrong  
Student selects Java → ✅ Correct

---

### For Checkboxes - Should It Be Checked?

```html
<input type="checkbox" data-answer="true" /> I agree
```

**Use `data-answer="true"`** if it should be checked

Student checks it → ✅ Correct  
Student doesn't check it → ❌ Wrong

---

## 📝 Complete Example

```html
<style>
  label { display: block; margin: 10px 0; font-weight: bold; }
  input { padding: 5px; margin: 5px 0; }
</style>

<h3>Quick Quiz</h3>

<label>1. What is 60% as a decimal?</label>
<input type="text" data-answer="0.6 | 0.60 | 60% | sixty percent" />

<label>2. What is 2 + 2?</label>
<input type="text" data-answer="4 | four | Four" />

<label>3. Which are programming languages? (Select one)</label>
<input type="radio" name="q3" value="python" data-correct="true" /> Python<br>
<input type="radio" name="q3" value="word" /> Microsoft Word<br>
<input type="radio" name="q3" value="java" data-correct="true" /> Java<br>

<label>4. Do you agree?</label>
<input type="checkbox" data-answer="true" /> Yes
```

### Question Instructions:
```
Answer all questions:
1. For percentage: You can write "0.6", "0.60", "60%", or "sixty percent"
2. For math: Enter the number or spell it out
3. For programming: Select ANY programming language (there are multiple correct answers!)
4. Check the box if you agree
```

---

## 🎯 What You See in Answer Key

After adding HTML, the Answer Key section **automatically shows**:

```
✅ Correct Answers Auto-Detected from HTML

Found 4 question(s) with correct answers:

┌─────────────────────────────────────────┐
│ Input: text field                       │
│ Correct Answer(s):                      │
│ 0.6  0.60  60%  sixty percent          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Input: text field                       │
│ Correct Answer(s):                      │
│ 4  four  Four                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Radio group: q3                         │
│ Correct Answer(s):                      │
│ Python  Java                            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Checkbox: Yes                           │
│ Correct Answer(s):                      │
│ checked                                 │
└─────────────────────────────────────────┘

💡 How it works:
• Text inputs: Use data-answer="answer1 | answer2 | answer3"
• Radio buttons: Add data-correct="true" to correct option(s)
• Checkboxes: Add data-answer="true" if should be checked
```

**NO NEED TO CONFIGURE ANYTHING!** Just add attributes in HTML!

---

## ✨ Quick Rules

### Text Inputs:
```html
✅ <input data-answer="ans1 | ans2 | ans3" />
❌ <input data-answer="ans1" />  (only one answer)
```

### Radio Buttons:
```html
✅ <input type="radio" name="q1" value="a" data-correct="true" />
✅ <input type="radio" name="q1" value="b" data-correct="true" />
(You can mark multiple as correct!)

❌ <input type="radio" name="q1" value="a" />  (not marked)
```

### Checkboxes:
```html
✅ <input type="checkbox" data-answer="true" />  (should be checked)
✅ <input type="checkbox" data-answer="false" />  (should NOT be checked)
```

---

## 🚀 Steps to Create

1. Add Question → "Kodlama" → "HTML/CSS Code Question"
2. Write clear instructions
3. Add HTML with:
   - `data-answer="ans1 | ans2"` for text inputs
   - `data-correct="true"` for correct radio options
   - `data-answer="true/false"` for checkboxes
4. Add CSS styling (optional)
5. Check the Answer Key section - it auto-detects everything!
6. Save

DONE! 🎉

---

## 💡 Examples

### Example 1: Text with Multiple Answers
```html
<p>Enter your age:</p>
<input type="text" data-answer="16 | sixteen | Sixteen" />
```

### Example 2: Radio with 2 Correct Options
```html
<p>Which are fruits?</p>
<input type="radio" name="q1" value="apple" data-correct="true" /> Apple<br>
<input type="radio" name="q1" value="car" /> Car<br>
<input type="radio" name="q1" value="banana" data-correct="true" /> Banana
```

### Example 3: Must Check Checkbox
```html
<input type="checkbox" data-answer="true" /> I agree to terms
```

---

That's it! Super simple! 🎊
