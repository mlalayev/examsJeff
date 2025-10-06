# Testing Auto-Scoring System

This guide explains how to test the automatic scoring system for Reading and Listening sections.

## Overview

The auto-scoring system:
1. **Compares student answers** to answer keys from questions
2. **Calculates raw scores** based on correct answers
3. **Maps to band scores** using BandMap table
4. **Applies IELTS rounding** for overall band (.25/.75 rule)
5. **Provides detailed review** showing correct/wrong answers

## IELTS Rounding Rules

Average → Rounded Band:
- **6.125** → 6.0 (less than .25)
- **6.25**  → 6.5 (exactly .25)
- **6.375** → 6.5 (between .25 and .75)
- **6.5**   → 6.5 (exactly .5)
- **6.625** → 6.5 (less than .75)
- **6.75**  → 7.0 (exactly .75)
- **6.875** → 7.0 (more than .75)

## Prerequisites

1. **Exam with sections** created
2. **Questions imported** for Reading and Listening
3. **Band mappings imported** (see `examples/band-map-import-example.json`)
4. **Booking assigned** to student
5. **Attempt created** from booking

## Testing Flow

### Step 1: Import Band Mappings (One Time Setup)

First, ensure band mappings exist:

```javascript
// Run in browser console as teacher
const importBands = async () => {
  const bands = {
    items: [
      // IELTS Reading
      { examType: 'IELTS', section: 'READING', minRaw: 0, maxRaw: 2, band: 2.0 },
      { examType: 'IELTS', section: 'READING', minRaw: 3, maxRaw: 5, band: 3.0 },
      { examType: 'IELTS', section: 'READING', minRaw: 6, maxRaw: 9, band: 4.0 },
      { examType: 'IELTS', section: 'READING', minRaw: 10, maxRaw: 14, band: 5.0 },
      { examType: 'IELTS', section: 'READING', minRaw: 15, maxRaw: 22, band: 6.0 },
      { examType: 'IELTS', section: 'READING', minRaw: 23, maxRaw: 29, band: 7.0 },
      { examType: 'IELTS', section: 'READING', minRaw: 30, maxRaw: 34, band: 8.0 },
      { examType: 'IELTS', section: 'READING', minRaw: 35, maxRaw: 40, band: 9.0 },
      // IELTS Listening
      { examType: 'IELTS', section: 'LISTENING', minRaw: 0, maxRaw: 2, band: 2.0 },
      { examType: 'IELTS', section: 'LISTENING', minRaw: 3, maxRaw: 5, band: 3.0 },
      { examType: 'IELTS', section: 'LISTENING', minRaw: 6, maxRaw: 9, band: 4.0 },
      { examType: 'IELTS', section: 'LISTENING', minRaw: 10, maxRaw: 15, band: 5.0 },
      { examType: 'IELTS', section: 'LISTENING', minRaw: 16, maxRaw: 22, band: 6.0 },
      { examType: 'IELTS', section: 'LISTENING', minRaw: 23, maxRaw: 29, band: 7.0 },
      { examType: 'IELTS', section: 'LISTENING', minRaw: 30, maxRaw: 34, band: 8.0 },
      { examType: 'IELTS', section: 'LISTENING', minRaw: 35, maxRaw: 40, band: 9.0 }
    ]
  };

  const response = await fetch('/api/bands/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bands)
  });
  
  const data = await response.json();
  console.log('✅ Band mappings imported:', data);
};

await importBands();
```

### Step 2: Create Attempt and Answer Questions

```javascript
// As STUDENT - create attempt
const bookingId = 'YOUR_BOOKING_ID';

const createResponse = await fetch('/api/attempts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bookingId })
});
const { attempt } = await createResponse.json();
const attemptId = attempt.id;

console.log('Attempt ID:', attemptId);

// Start Reading section
await fetch(`/api/attempts/${attemptId}/section/start`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sectionType: 'READING' })
});

// Answer questions (use actual question IDs from your exam)
const readingAnswers = {
  'question_id_1': 'B',           // Correct answer is 'B'
  'question_id_2': 'NOT GIVEN',   // Correct answer is 'NOT GIVEN'
  'question_id_3': 'temperatures' // Correct answer is 'temperatures'
};

await fetch(`/api/attempts/${attemptId}/section/save`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    sectionType: 'READING',
    answers: readingAnswers
  })
});

// End Reading section
await fetch(`/api/attempts/${attemptId}/section/end`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sectionType: 'READING' })
});
```

### Step 3: Submit and Get Auto-Scored

```javascript
// Submit attempt - this triggers auto-scoring
const submitResponse = await fetch(`/api/attempts/${attemptId}/submit`, {
  method: 'POST'
});

const result = await submitResponse.json();
console.log('📊 Scoring Result:', result);

// Check the scoring
console.log('Overall Band:', result.attempt.bandOverall);
console.log('Sections:', result.attempt.sections.map(s => ({
  type: s.type,
  rawScore: s.rawScore,
  bandScore: s.bandScore
})));
```

### Step 4: Get Detailed Review

```javascript
// Get review with correct/wrong breakdown
const reviewResponse = await fetch(`/api/attempts/${attemptId}/review`);
const review = await reviewResponse.json();

console.log('📝 Review:', review);

// Check Reading section review
const readingReview = review.sections.find(s => s.type === 'READING');
console.log('\n📖 Reading Section:');
console.log('Correct:', readingReview.summary.correctCount, '/', readingReview.summary.totalQuestions);
console.log('Raw Score:', readingReview.summary.rawScore, '/', readingReview.summary.maxRawScore);
console.log('Band Score:', readingReview.bandScore);

// Show wrong answers
console.log('\n❌ Wrong Answers:');
readingReview.questions
  .filter(q => !q.isCorrect)
  .forEach(q => {
    console.log(`Q${q.order}: ${q.prompt.text}`);
    console.log(`  Your answer: ${q.studentAnswer}`);
    console.log(`  Correct answer: ${q.correctAnswer}`);
  });
```

## Test Scenarios

### Scenario 1: Perfect Score

```javascript
// Answer all 3 Reading questions correctly
const perfectAnswers = {
  'question_id_1': 'B',
  'question_id_2': 'NOT GIVEN',
  'question_id_3': 'temperatures'
};

// Expected:
// - Raw Score: 3/3
// - Band Score: Depends on BandMap (e.g., if 3 questions, likely low band)
```

### Scenario 2: Known Band Score

```javascript
// Get exactly 23 correct (Band 7.0 according to IELTS Reading)
// Answer first 23 questions correctly, rest wrong

// Expected:
// - Raw Score: 23
// - Band Score: 7.0
```

### Scenario 3: IELTS Rounding

```javascript
// Create scenario where sections average to test rounding
// Example: Reading 6.5, Listening 6.5, Writing 6.5, Speaking 6.0
// Average: (6.5 + 6.5 + 6.5 + 6.0) / 4 = 6.375
// Rounded: 6.5

// Expected Overall Band: 6.5
```

### Scenario 4: Mixed Correct/Wrong

```javascript
// Answer some correctly, some wrong
const mixedAnswers = {
  'question_id_1': 'B',       // ✅ Correct
  'question_id_2': 'TRUE',    // ❌ Wrong (correct is 'NOT GIVEN')
  'question_id_3': 'temperature' // ✅ Correct (accepts variations)
};

// Expected:
// - Raw Score: 2/3
// - Review shows Q2 as incorrect
```

## Verification Checklist

✅ **Band Lookup Works:**
- [ ] Raw score correctly mapped to band via BandMap
- [ ] Different raw scores produce different bands
- [ ] Edge cases handled (0 score, max score)

✅ **Answer Matching:**
- [ ] Exact matches work (case insensitive)
- [ ] Multiple choice: 'B' matches 'b'
- [ ] Fill in blank: accepts array of acceptable answers
- [ ] True/False/Not Given: exact match required
- [ ] Variations accepted ('temperature' vs 'temperatures')

✅ **IELTS Rounding:**
- [ ] 6.125 → 6.0
- [ ] 6.25 → 6.5
- [ ] 6.375 → 6.5
- [ ] 6.5 → 6.5
- [ ] 6.625 → 6.5
- [ ] 6.75 → 7.0
- [ ] 6.875 → 7.0

✅ **Review Accuracy:**
- [ ] Shows all questions with answers
- [ ] Correctly marks right/wrong
- [ ] Shows student answer vs correct answer
- [ ] Summary counts match individual questions
- [ ] Only shows for Reading/Listening (not Writing/Speaking)

✅ **Deterministic:**
- [ ] Same answers always produce same scores
- [ ] Resubmitting doesn't change scores
- [ ] No randomness in scoring

## Database Verification

```sql
-- Check attempt scores
SELECT 
  a.id,
  a."bandOverall",
  a.status,
  a."submittedAt"
FROM attempts a
WHERE a.id = 'YOUR_ATTEMPT_ID';

-- Check section scores
SELECT 
  s.type,
  s."rawScore",
  s."bandScore",
  s.status,
  s.answers
FROM attempt_sections s
WHERE s."attemptId" = 'YOUR_ATTEMPT_ID'
ORDER BY s.type;

-- Verify band mapping lookup
SELECT * FROM band_maps
WHERE "examType" = 'IELTS'
  AND section = 'READING'
  AND "minRaw" <= 23
  AND "maxRaw" >= 23;
-- Should return Band 7.0
```

## Troubleshooting

**No band score after submit:**
- Check if BandMap exists for that examType and section
- Check if raw score falls within any band range
- Look at server logs for scoring errors

**Wrong band score:**
- Verify BandMap ranges are correct
- Check raw score calculation
- Ensure correct count of questions

**Rounding seems wrong:**
- Test with known values (see IELTS Rounding Rules above)
- Check decimal precision (JavaScript floating point)
- Verify all 4 sections have scores

**Review shows wrong answers as correct:**
- Check answerKey format in questions
- Test answer normalization (case, whitespace, punctuation)
- Look at qtype - different types have different matching logic

**Writing/Speaking scored automatically:**
- These should NOT be auto-scored
- Check that scoring service only processes READING/LISTENING
- Verify section types are correct

## Expected Behavior

✅ **Reading Section:**
- 3 correct out of 3 → Raw Score: 3, Band: (lookup in BandMap)
- Auto-scored immediately on submit
- Review shows each question with correct/wrong

✅ **Listening Section:**
- 2 correct out of 2 → Raw Score: 2, Band: (lookup in BandMap)
- Auto-scored immediately on submit
- Review shows each question with correct/wrong

✅ **Writing Section:**
- NOT auto-scored
- rawScore: null, bandScore: null
- Review shows "Pending teacher grading"

✅ **Speaking Section:**
- NOT auto-scored
- rawScore: null, bandScore: null
- Review shows "Pending teacher grading"

✅ **Overall Band:**
- Calculated from all 4 sections (if all have scores)
- Uses IELTS rounding rules
- Null if any section missing score

## Notes

- Scoring is **idempotent** - same answers always produce same scores
- Answer matching is **case-insensitive** and **trims whitespace**
- **Punctuation ignored** in normalization
- **Array answers** (fill in blank) check each element
- **Object answers** (matching) check each key-value pair
- **Band lookup** requires exact examType match
- **Overall band** only calculated if all sections scored

---

## Complete Test Script

Run this complete test:

```javascript
const testAutoScoring = async () => {
  console.log('🎯 Testing Auto-Scoring System\n');
  
  // 1. Create attempt
  const bookingId = 'YOUR_BOOKING_ID';
  const { attempt } = await fetch('/api/attempts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId })
  }).then(r => r.json());
  
  console.log('1️⃣ Attempt created:', attempt.id);
  
  // 2. Answer Reading questions
  await fetch(`/api/attempts/${attempt.id}/section/start`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sectionType: 'READING' })
  });
  
  await fetch(`/api/attempts/${attempt.id}/section/save`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      sectionType: 'READING',
      answers: { q1: 'B', q2: 'NOT GIVEN', q3: 'temperatures' }
    })
  });
  
  await fetch(`/api/attempts/${attempt.id}/section/end`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sectionType: 'READING' })
  });
  
  console.log('2️⃣ Reading section completed');
  
  // 3. Submit and score
  const { attempt: scored } = await fetch(`/api/attempts/${attempt.id}/submit`, {
    method: 'POST'
  }).then(r => r.json());
  
  console.log('3️⃣ Scored!');
  console.log('   Overall Band:', scored.bandOverall);
  scored.sections.forEach(s => {
    console.log(`   ${s.type}: Raw ${s.rawScore}, Band ${s.bandScore}`);
  });
  
  // 4. Get review
  const review = await fetch(`/api/attempts/${attempt.id}/review`)
    .then(r => r.json());
  
  console.log('\n4️⃣ Review:');
  const reading = review.sections.find(s => s.type === 'READING');
  console.log(`   Correct: ${reading.summary.correctCount}/${reading.summary.totalQuestions}`);
  console.log(`   Band: ${reading.bandScore}`);
  
  console.log('\n✅ Test complete!');
  return attempt.id;
};

await testAutoScoring();
```

That's it! The auto-scoring system is fully functional. 🎉

