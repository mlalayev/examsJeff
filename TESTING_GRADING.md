# Testing Writing & Speaking Grading System

This guide explains how to test the manual grading system for Writing and Speaking sections.

## Overview

The grading system allows teachers to:
1. **View pending submissions** in a grading queue
2. **Grade sections** with band scores (0-9, 0.5 steps)
3. **Provide feedback** and optional rubric scores
4. **Auto-recalculate** overall band when all sections graded
5. **Students view results** with feedback and rubric

## Prerequisites

1. **Exam with W/S sections** created
2. **Booking assigned** to student with Writing/Speaking sections
3. **Attempt submitted** by student
4. **R/L sections auto-scored** (from Task G)

## Testing Flow

### Part 1: Teacher Grading Queue

#### Step 1: Access Grading Queue

```javascript
// As TEACHER - navigate to grading queue
// URL: /dashboard/teacher/grading
// Or click "Grade Submissions" on teacher dashboard

// Fetch queue via API
const response = await fetch('/api/grading/queue?status=pending');
const data = await response.json();

console.log('📋 Grading Queue:', data);
console.log('Pending submissions:', data.pendingTotal);
console.log('Total items:', data.total);

// Expected response:
{
  queue: [
    {
      attemptId: "xxx",
      student: { id, name, email },
      exam: { id, title, examType },
      submittedAt: "2025-10-06T10:00:00Z",
      bandOverall: null, // Or partial if R/L scored
      sections: [
        { id: "section1", type: "WRITING", bandScore: null, status: "pending" },
        { id: "section2", type: "SPEAKING", bandScore: null, status: "pending" }
      ],
      pendingCount: 2,
      gradedCount: 0,
      totalSections: 2
    }
  ],
  total: 1,
  pendingTotal: 1
}
```

**UI Verification:**
- ✅ List shows all pending submissions from your students
- ✅ Each submission shows student name, exam title, submitted date
- ✅ Sections displayed with status badges (pending/graded)
- ✅ "Grade" button visible for pending sections
- ✅ Progress bar shows graded/total ratio

#### Step 2: Filter Queue

```javascript
// View all submissions (including fully graded)
const allResponse = await fetch('/api/grading/queue?status=all');
const allData = await allResponse.json();

console.log('All submissions:', allData.total);
```

**UI Verification:**
- ✅ "Pending" tab shows only ungraded submissions
- ✅ "All" tab shows all submissions
- ✅ Fully graded submissions show green "Complete" badge

### Part 2: Grade a Section

#### Step 3: Load Section for Grading

```javascript
// Get section details
const sectionId = "YOUR_SECTION_ID";

const response = await fetch(`/api/attempt-sections/${sectionId}`);
const data = await response.json();

console.log('📝 Section Data:', data);

// Expected response:
{
  section: {
    id: "xxx",
    type: "WRITING",
    answers: { /* student's written response */ },
    bandScore: null,
    rubric: null,
    feedback: null,
    gradedById: null,
    startedAt: "...",
    endedAt: "...",
    status: "COMPLETED"
  },
  attempt: {
    id: "xxx",
    status: "SUBMITTED",
    submittedAt: "...",
    bandOverall: 6.5 // or null if not all graded
  },
  student: { id, name, email },
  exam: { id, title, examType }
}
```

**UI Verification:**
- ✅ Student's response displayed in readable format
- ✅ Student info shown (name, email)
- ✅ Exam info shown (title, type)
- ✅ Submitted date displayed
- ✅ Grading form rendered with band score dropdown

#### Step 4: Submit Grade

```javascript
// Submit grade for Writing section
const gradeResponse = await fetch(`/api/attempt-sections/${sectionId}/grade`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bandScore: 7.0,
    rubric: {
      taskAchievement: 7.0,
      coherenceCohesion: 7.5,
      lexicalResource: 6.5,
      grammaticalRange: 7.0
    },
    feedback: "Good essay overall. Strong coherence and clear arguments. Work on vocabulary range for band 8."
  })
});

const result = await gradeResponse.json();
console.log('✅ Grade submitted:', result);

// Expected response:
{
  message: "Section graded successfully",
  section: { /* updated section with scores */ },
  allGraded: true, // if all sections now graded
  overallBand: 7.0 // recalculated if all graded
}
```

**UI Verification:**
- ✅ Band score dropdown (0, 0.5, 1.0, ... 9.0)
- ✅ Rubric fields for IELTS Writing (4 criteria)
- ✅ Rubric auto-calculates average
- ✅ Feedback textarea (max 5000 chars)
- ✅ Character counter displayed
- ✅ Submit button shows loading state
- ✅ Success message displayed
- ✅ Auto-redirect to queue after 2 seconds

### Part 3: Overall Band Recalculation

#### Step 5: Verify Overall Band Update

```javascript
// After grading all sections, check overall band
// Example: 4 sections
// - Reading: 6.5 (auto-scored)
// - Listening: 7.0 (auto-scored)
// - Writing: 7.0 (manually graded)
// - Speaking: 6.5 (manually graded)
// Average: (6.5 + 7.0 + 7.0 + 6.5) / 4 = 6.75
// IELTS Rounding: 6.75 → 7.0

const attemptResponse = await fetch(`/api/attempts/${attemptId}/review`);
const attemptData = await attemptResponse.json();

console.log('📊 Final Results:');
console.log('Overall Band:', attemptData.bandOverall); // Should be 7.0
attemptData.sections.forEach(s => {
  console.log(`${s.type}: ${s.bandScore}`);
});
```

**Verification:**
- ✅ Overall band calculated correctly
- ✅ IELTS rounding applied (.25/.75 rule)
- ✅ All section bands included in average

### Part 4: Student Views Results

#### Step 6: Student Results Page

```javascript
// As STUDENT - view results
// URL: /dashboard/student/results/[attemptId]

const resultsResponse = await fetch(`/api/attempts/${attemptId}/review`);
const results = await resultsResponse.json();

console.log('🎓 Student Results:', results);
```

**UI Verification:**
- ✅ Overall band displayed prominently (large, colored badge)
- ✅ Each section shows band score
- ✅ Reading/Listening show question-by-question review
  - ✅ Correct answers: green checkmark
  - ✅ Wrong answers: red X with correct answer shown
- ✅ Writing/Speaking show:
  - ✅ Band score
  - ✅ Rubric breakdown (if provided)
  - ✅ Teacher feedback (if provided)
  - ✅ "Pending grading" message if not yet graded

## Test Scenarios

### Scenario 1: Grade Single Section

1. Teacher submits one section (Writing: 7.0)
2. Other sections still pending
3. Overall band = null or partial (only R/L if auto-scored)
4. Student sees "Pending grading" for ungraded sections

**Expected:**
- ✅ Writing shows band 7.0 and feedback
- ✅ Speaking still shows "Pending grading"
- ✅ Overall band incomplete (or average of R/L/W only if that's implemented)

### Scenario 2: Grade All Sections

1. Teacher grades Writing: 7.0
2. Teacher grades Speaking: 6.5
3. Reading auto-scored: 6.5
4. Listening auto-scored: 7.0
5. Overall: (7.0 + 6.5 + 6.5 + 7.0) / 4 = 6.75 → 7.0

**Expected:**
- ✅ All sections show band scores
- ✅ Overall band = 7.0
- ✅ Student sees complete results with all feedback

### Scenario 3: IELTS Writing Rubric

1. Grade Writing with rubric:
   - Task Achievement: 7.0
   - Coherence & Cohesion: 7.5
   - Lexical Resource: 6.5
   - Grammatical Range: 7.0
   - Average: 7.0
2. Set overall band score: 7.0

**Expected:**
- ✅ Rubric saved to database
- ✅ Student sees rubric breakdown on results page
- ✅ All 4 criteria displayed with scores

### Scenario 4: Re-grade Section

1. Teacher grades Writing: 6.0
2. Later, teacher re-opens and updates to 6.5
3. Overall band recalculated

**Expected:**
- ✅ Previous grade overwritten
- ✅ New overall band calculated
- ✅ Student sees updated results

### Scenario 5: No Feedback Provided

1. Teacher submits only band score (7.0)
2. No rubric, no feedback text

**Expected:**
- ✅ Grade saved successfully
- ✅ Student sees band score
- ✅ "No additional feedback provided" message shown

### Scenario 6: Edge Cases

**Test 0.5 steps:**
- ✅ 6.0 accepted
- ✅ 6.5 accepted
- ✅ 7.0 accepted
- ❌ 6.2 rejected (validation error)
- ❌ 6.7 rejected (validation error)

**Test boundaries:**
- ✅ 0.0 accepted
- ✅ 9.0 accepted
- ❌ -0.5 rejected
- ❌ 9.5 rejected

## Database Verification

```sql
-- Check graded section
SELECT 
  s.id,
  s.type,
  s."bandScore",
  s."gradedById",
  s.rubric,
  s.feedback
FROM attempt_sections s
WHERE s.id = 'YOUR_SECTION_ID';

-- Check updated overall band
SELECT 
  a.id,
  a."bandOverall",
  a.status,
  a."submittedAt"
FROM attempts a
WHERE a.id = 'YOUR_ATTEMPT_ID';

-- Check all section scores for attempt
SELECT 
  s.type,
  s."bandScore",
  s."gradedById",
  LENGTH(s.feedback) as feedback_length
FROM attempt_sections s
WHERE s."attemptId" = 'YOUR_ATTEMPT_ID'
ORDER BY s.type;
```

## API Endpoints Summary

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/grading/queue` | GET | List pending W/S sections | Teacher |
| `/api/attempt-sections/:id` | GET | Load section for grading | Teacher |
| `/api/attempt-sections/:id/grade` | POST | Submit grade | Teacher |
| `/api/attempts/:id/review` | GET | View results | Student |

## Verification Checklist

### Teacher Grading Queue
- [ ] Shows only teacher's students
- [ ] Pending filter works
- [ ] All filter works
- [ ] Progress bars accurate
- [ ] Grade buttons functional

### Grading Form
- [ ] Student response visible
- [ ] Band score dropdown 0-9 (0.5 steps)
- [ ] Rubric fields (IELTS Writing)
- [ ] Rubric average auto-calculates
- [ ] Feedback textarea (max 5000)
- [ ] Character counter updates
- [ ] Validation for band score steps
- [ ] Submit button shows loading
- [ ] Success message displayed
- [ ] Redirects after submission

### Overall Band Calculation
- [ ] Recalculates when all sections graded
- [ ] Uses correct IELTS rounding
- [ ] Includes all 4 sections in average
- [ ] Persists to database

### Student Results Page
- [ ] Overall band displayed prominently
- [ ] Section band scores shown
- [ ] R/L show question review
- [ ] W/S show feedback
- [ ] W/S show rubric (if provided)
- [ ] Pending sections show status
- [ ] Color coding for band ranges

### Security
- [ ] Teachers can only grade own students
- [ ] Students can only view own results
- [ ] Cannot grade R/L sections (auto-scored only)
- [ ] Cannot grade unapproved attempts

## Troubleshooting

**Queue is empty:**
- Check if attempts submitted by your students
- Verify sections include WRITING or SPEAKING
- Check attempt status is "SUBMITTED"

**Cannot load section:**
- Verify teacher owns the booking
- Check section is W or S (not R or L)
- Confirm section exists in database

**Grade not saving:**
- Check band score is 0-9 in 0.5 steps
- Verify feedback < 5000 characters
- Check network errors in console

**Overall band not updating:**
- Ensure all 4 sections have band scores
- Check scoring logic (average + rounding)
- Verify no database errors

**Student sees "Pending":**
- Check if section actually graded (bandScore not null)
- Verify gradedById is set
- Refresh page

## Complete Test Script

```javascript
const testGradingWorkflow = async () => {
  console.log('🧪 Testing Grading Workflow\n');
  
  // 1. Teacher: View queue
  console.log('1️⃣ Fetching grading queue...');
  const queueRes = await fetch('/api/grading/queue?status=pending');
  const queue = await queueRes.json();
  console.log(`Found ${queue.total} submissions`);
  
  const firstItem = queue.queue[0];
  const sectionId = firstItem.sections.find(s => s.status === 'pending')?.id;
  
  if (!sectionId) {
    console.log('❌ No pending sections found');
    return;
  }
  
  // 2. Teacher: Load section
  console.log('\n2️⃣ Loading section for grading...');
  const sectionRes = await fetch(`/api/attempt-sections/${sectionId}`);
  const sectionData = await sectionRes.json();
  console.log(`Section type: ${sectionData.section.type}`);
  console.log(`Student: ${sectionData.student.name}`);
  
  // 3. Teacher: Submit grade
  console.log('\n3️⃣ Submitting grade...');
  const gradeRes = await fetch(`/api/attempt-sections/${sectionId}/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bandScore: 7.0,
      rubric: sectionData.section.type === 'WRITING' ? {
        taskAchievement: 7.0,
        coherenceCohesion: 7.5,
        lexicalResource: 6.5,
        grammaticalRange: 7.0
      } : undefined,
      feedback: 'Excellent work! Keep practicing.'
    })
  });
  const gradeResult = await gradeRes.json();
  console.log(`✅ Graded successfully`);
  console.log(`All sections graded: ${gradeResult.allGraded}`);
  console.log(`Overall band: ${gradeResult.overallBand}`);
  
  // 4. Student: View results
  console.log('\n4️⃣ Fetching student results...');
  const attemptId = sectionData.attempt.id;
  const resultsRes = await fetch(`/api/attempts/${attemptId}/review`);
  const results = await resultsRes.json();
  console.log(`Overall Band: ${results.bandOverall}`);
  results.sections.forEach(s => {
    console.log(`${s.type}: ${s.bandScore ?? 'Pending'}`);
  });
  
  console.log('\n✅ Grading workflow test complete!');
  return attemptId;
};

// Run as teacher, then check as student
await testGradingWorkflow();
```

## Integration with Task G (Auto-Scoring)

The grading system works seamlessly with auto-scoring:

1. **Submit attempt** → R/L auto-scored, W/S pending
2. **Teacher grades W/S** → Overall band calculated from all 4
3. **Student views results** → Complete report with all sections

**Complete Flow:**
```
Student submits
    ↓
R/L auto-scored (Task G)
W/S pending grading
    ↓
Teacher opens grading queue
    ↓
Teacher grades W/S sections
    ↓
Overall band recalculated
    ↓
Student views complete results
```

---

**Task H — Writing & Speaking Grading** is now fully functional! 🎉

Teachers can grade W/S sections with rubrics and feedback, and students can view comprehensive results.

