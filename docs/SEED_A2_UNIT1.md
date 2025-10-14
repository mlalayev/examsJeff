# General English A2 — Unit 1 Seed Data

## Overview
This seed creates a complete A2-level English exam with **11 questions** across **5 sections**.

## Endpoint
```
POST /api/admin/seed/a2-unit1
DELETE /api/admin/seed/a2-unit1  (to remove)
```

## Exam Structure

### Section 1: READING (15 min, 3 questions)

**Q1 - True/False**
- Passage: "Sara lives in Baku and studies every evening."
- Question: "Sara studies in the morning."
- Answer: `false`

**Q2 - MCQ_SINGLE**
- Passage: "Tom usually goes to work by bus."
- Question: "How does Tom usually go to work?"
- Choices: by car | by bus | on foot
- Answer: index `1` (by bus)

**Q3 - MCQ_MULTI**
- Question: "Choose healthy morning habits."
- Choices: Skipping breakfast | Drinking water | Short exercise
- Answer: indices `[1, 2]` (Drinking water, Short exercise)

---

### Section 2: LISTENING (10 min, 2 questions)

**Q1 - True/False**
- Transcript: "The meeting starts at nine thirty."
- Question: "The meeting starts at 9:30."
- Answer: `true`

**Q2 - SELECT**
- Transcript: "Please bring your ID and a pen."
- Question: "What should you bring?"
- Choices: Notebook only | ID and a pen | Laptop
- Answer: index `1` (ID and a pen)

---

### Section 3: WRITING (20 min, 2 questions)

**Q1 - ORDER_SENTENCE**
- Tokens: `["is", "playing", "she", "in", "garden", "the"]`
- Correct order: `[2, 0, 1, 3, 5, 4]`
- Result: "she is playing in the garden"

**Q2 - DND_GAP**
- Text: "I ___ running. You ___ playing. He ___ reading."
- Bank: `["am", "is", "are"]`
- Answer: `["am", "are", "is"]`

---

### Section 4: GRAMMAR (10 min, 2 questions)

**Q1 - MCQ_SINGLE**
- Question: "She ___ to school by bus."
- Choices: go | goes | going
- Answer: index `1` (goes)

**Q2 - GAP**
- Question: "I usually ___ coffee in the morning."
- Answer: `["drink"]`

---

### Section 5: VOCABULARY (10 min, 2 questions)

**Q1 - DND_GAP**
- Text: "I need to ___ a ticket and ___ a hotel."
- Bank: `["book", "buy", "cook"]`
- Answer: `["buy", "book"]`

**Q2 - MCQ_MULTI**
- Question: "Select words related to 'transport'."
- Choices: bus | keyboard | train | window
- Answer: indices `[0, 2]` (bus, train)

---

## Question Type Distribution

| Type | Count | Auto-Score |
|------|-------|-----------|
| TF | 2 | ✅ |
| MCQ_SINGLE | 2 | ✅ |
| MCQ_MULTI | 2 | ✅ |
| SELECT | 1 | ✅ |
| GAP | 1 | ✅ |
| ORDER_SENTENCE | 1 | ✅ |
| DND_GAP | 2 | ✅ |
| **Total** | **11** | **All auto-scored** |

---

## Testing the Seed

### 1. Create Demo Exam
```bash
# Via Admin UI
Navigate to: /dashboard/admin/seed
Click: "Seed Demo Exam"

# Or via API
POST http://localhost:3000/api/admin/seed/a2-unit1
```

### 2. Assign to Student
```bash
# As Teacher
1. Go to: /dashboard/teacher/classes/{classId}
2. Select student
3. Click "Assign Exam"
4. Choose "General English A2 — Unit 1"
```

### 3. Take the Exam
```bash
# As Student
1. Go to: /dashboard/student/exams
2. Click "Start" on the assigned exam
3. Answer questions in each section
4. Autosave triggers every 8s
5. Click "Submit Attempt"
```

### 4. View Results
```bash
# Auto-redirect to results page
/attempt/{attemptId}/results

# Shows:
- Overall score percentage
- Per-section scores
- Question-by-question review
- Correct/incorrect indicators
- Explanations
```

---

## Expected Scores (Perfect Answers)

| Section | Max Score | Perfect Score |
|---------|-----------|---------------|
| Reading | 3 | 3 (100%) |
| Listening | 2 | 2 (100%) |
| Writing | 2 | 2 (100%) |
| Grammar | 2 | 2 (100%) |
| Vocabulary | 2 | 2 (100%) |
| **Total** | **11** | **11 (100%)** |

---

## Clean Up

To remove the demo exam:
```bash
DELETE http://localhost:3000/api/admin/seed/a2-unit1
```

This will cascade delete:
- The exam
- All sections
- All questions
- Any attempts (if students took it)

