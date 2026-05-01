# Quick Reference: Multiple Answers & Radio Buttons

## ✨ NEW FEATURES SUMMARY

### 1️⃣ **Multiple Acceptable Answers (Text Inputs)**

**Before:** Only one correct answer
**Now:** Add many acceptable answers!

```
Question: What is 60% as a decimal?

Correct Answers Box:
0.6
0.60
60%
sixty percent

↓

Student writes "60%" → ✅ Correct!
Student writes "0.6" → ✅ Correct!
Student writes "sixty percent" → ✅ Correct!
```

---

### 2️⃣ **Multiple Correct Radio Options**

**Before:** Only one radio could be correct
**Now:** Check multiple options as correct!

```html
<input type="radio" data-answer="q1" value="a" /> Option A
<input type="radio" data-answer="q1" value="b" /> Option B
<input type="radio" data-answer="q1" value="c" /> Option C
```

**In Answer Key:**
```
☑️ Option A (value: a)  ← Check this
☐ Option B (value: b)
☑️ Option C (value: c)  ← Check this too!
```

**Result:** Student selecting either A or C gets points!

---

## 📝 HOW TO USE

### For Text Inputs:

#### Step 1: Add input with data-answer
```html
<input type="text" data-answer="age" placeholder="Enter your age" />
```

#### Step 2: In Answer Key, you'll see:
```
┌────────────────────────────────────┐
│ ID: age                            │
│ Type: text                         │
│                                    │
│ Correct Answers (one per line):   │
│ ┌────────────────────────────────┐│
│ │ 16                             ││
│ │ sixteen                        ││
│ │ Sixteen                        ││
│ └────────────────────────────────┘│
│ ✅ Add multiple acceptable answers │
└────────────────────────────────────┘
```

#### Step 3: Students can write ANY of those!

---

### For Radio Buttons:

#### Step 1: Add radios with same data-answer
```html
<p>Which are fruits?</p>
<input type="radio" name="q1" data-answer="q1" value="apple" /> Apple
<input type="radio" name="q1" data-answer="q1" value="car" /> Car
<input type="radio" name="q1" data-answer="q1" value="banana" /> Banana
```

#### Step 2: In Answer Key, check ALL correct options:
```
┌────────────────────────────────────┐
│ ID: q1                             │
│ Type: radio group • 3 options      │
│                                    │
│ Select Correct Answer(s):          │
│ ☑️ Apple (value: apple)            │
│ ☐ Car (value: car)                 │
│ ☑️ Banana (value: banana)          │
│                                    │
│ ✅ You can select multiple correct │
└────────────────────────────────────┘
```

#### Step 3: Students selecting Apple OR Banana get points!

---

## 💡 EXAMPLES

### Example 1: Percentage Question

**HTML:**
```html
<p>What is 75% as a decimal?</p>
<input type="text" data-answer="decimal" />
```

**Acceptable Answers:**
```
0.75
.75
75%
seventy-five percent
```

**Students can write:**
- `0.75` ✅
- `.75` ✅
- `75%` ✅
- `seventy-five percent` ✅
- `0.7500` ❌ (not in list)

---

### Example 2: Multiple Correct Radio

**HTML:**
```html
<p>Which are programming languages? (Select one correct option)</p>
<input type="radio" name="lang" data-answer="lang" value="python" /> Python
<input type="radio" name="lang" data-answer="lang" value="html" /> HTML
<input type="radio" name="lang" data-answer="lang" value="java" /> Java
<input type="radio" name="lang" data-answer="lang" value="word" /> Microsoft Word
```

**Mark as Correct:**
- ☑️ Python
- ☐ HTML  
- ☑️ Java
- ☐ Microsoft Word

**Students selecting:**
- Python → ✅ Correct
- HTML → ❌ Wrong
- Java → ✅ Correct  
- Word → ❌ Wrong

---

### Example 3: Combined Question

**HTML:**
```html
<h3>Mixed Question Types</h3>

<label>1. What is 2 + 2?</label>
<input type="text" data-answer="math" />

<label>2. Which are even numbers?</label>
<input type="radio" name="even" data-answer="even" value="2" /> 2<br>
<input type="radio" name="even" data-answer="even" value="3" /> 3<br>
<input type="radio" name="even" data-answer="even" value="4" /> 4<br>

<label>3. Do you agree?</label>
<input type="checkbox" data-answer="agree" /> Yes
```

**Correct Answers:**
- `math`: `4`, `four`, `Four` (any of these)
- `even`: Check both `2` and `4` as correct
- `agree`: Check the box (true)

**Instructions:**
```
Answer all questions:
1. You can write the number or spell it out
2. Select ANY even number (there may be more than one!)
3. Check the box if you agree
```

---

## ✅ QUICK CHECKLIST

When creating questions:

- [ ] Add `data-answer="id"` to all interactive elements
- [ ] Write clear instructions telling students:
  - What format to use for answers
  - If multiple radio options might be correct
  - Any special requirements
- [ ] For text inputs: Add ALL acceptable answer variations
- [ ] For radios: Check ALL correct options
- [ ] Test in preview before saving

---

## 🎯 REMEMBER

### Text Inputs:
- ✅ One answer per line
- ✅ As many lines as you want
- ✅ Student matches ANY → correct!

### Radio Buttons:
- ✅ Check all correct options  
- ✅ Student selects any checked option → correct!
- ✅ Tell students if multiple options can be correct

### Checkboxes:
- ✅ Check if should be selected
- ✅ Uncheck if should NOT be selected

---

Now you can handle all the different ways students might answer! 🎉
