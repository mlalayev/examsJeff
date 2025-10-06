# Testing Attempt Engine

This guide explains how to test the exam attempt system (student taking exams).

## ⚠️ Important: Run Migration First

Before testing, you MUST run the migration:

```powershell
npx prisma migrate dev --name attempts_engine
```

Press `y` when prompted. This will:
- Update the Attempt model (add bookingId, remove old fields)
- Create AttemptSection model
- Add unique constraint on bookingId

## Overview

The attempt engine allows students to:
1. **Create an attempt** from a booking
2. **Start sections** one at a time with timers
3. **Autosave answers** every few seconds
4. **End sections** when time runs out or manually
5. **Submit the entire attempt** when done

## Database Flow

```
Booking (assigned by teacher)
  ↓
Attempt (created by student when starting exam)
  ├── AttemptSection (READING) - answers, scores, status
  ├── AttemptSection (LISTENING) - answers, scores, status
  ├── AttemptSection (WRITING) - answers, scores, status
  └── AttemptSection (SPEAKING) - answers, scores, status
```

## Testing with Browser Console

**Prerequisites:**
- Login as STUDENT
- Have a booking assigned to you by teacher
- Get the booking ID from your dashboard

### Step 1: Create Attempt

```javascript
// Replace with your actual booking ID
const bookingId = 'YOUR_BOOKING_ID_HERE';

const createAttempt = async () => {
  const response = await fetch('/api/attempts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId })
  });
  const data = await response.json();
  console.log('✅ Attempt created:', data);
  return data.attempt.id;
};

const attemptId = await createAttempt();
console.log('📝 Attempt ID:', attemptId);
```

### Step 2: Get Attempt Details

```javascript
const getAttempt = async (attemptId) => {
  const response = await fetch(`/api/attempts?bookingId=${bookingId}`);
  const data = await response.json();
  console.log('📊 Attempt details:', data);
  return data.attempt;
};

const attempt = await getAttempt(attemptId);
console.log('Sections:', attempt.sections);
```

### Step 3: Start a Section

```javascript
const startSection = async (attemptId, sectionType) => {
  const response = await fetch(`/api/attempts/${attemptId}/section/start`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sectionType })
  });
  const data = await response.json();
  console.log(`✅ ${sectionType} started:`, data);
  console.log(`⏰ Duration: ${data.durationMin} minutes`);
  return data;
};

await startSection(attemptId, 'READING');
```

### Step 4: Save Answers (Autosave)

```javascript
const saveAnswers = async (attemptId, sectionType, answers) => {
  const response = await fetch(`/api/attempts/${attemptId}/section/save`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      sectionType,
      answers 
    })
  });
  const data = await response.json();
  console.log(`💾 ${sectionType} answers saved:`, data);
  return data;
};

// Example: Save reading answers
const readingAnswers = {
  question1: 'B',
  question2: 'NOT GIVEN',
  question3: 'temperatures'
};

await saveAnswers(attemptId, 'READING', readingAnswers);

// Simulate autosave (save multiple times)
await saveAnswers(attemptId, 'READING', { 
  ...readingAnswers, 
  question4: 'C' 
});
```

### Step 5: End a Section

```javascript
const endSection = async (attemptId, sectionType) => {
  const response = await fetch(`/api/attempts/${attemptId}/section/end`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sectionType })
  });
  const data = await response.json();
  console.log(`🔒 ${sectionType} ended:`, data);
  return data;
};

await endSection(attemptId, 'READING');
```

### Step 6: Submit Attempt

```javascript
const submitAttempt = async (attemptId) => {
  const response = await fetch(`/api/attempts/${attemptId}/submit`, {
    method: 'POST'
  });
  const data = await response.json();
  console.log('✅ Attempt submitted:', data);
  return data;
};

await submitAttempt(attemptId);
```

## Complete Test Flow

Run this complete script:

```javascript
// Complete test of attempt engine
const testAttemptEngine = async () => {
  console.log('🚀 Starting attempt engine test...\n');
  
  // 1. Create attempt
  console.log('1️⃣ Creating attempt...');
  const bookingId = 'YOUR_BOOKING_ID'; // Replace!
  
  const createResponse = await fetch('/api/attempts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId })
  });
  const { attempt } = await createResponse.json();
  console.log('✅ Attempt created:', attempt.id);
  
  const attemptId = attempt.id;
  
  // 2. Start READING section
  console.log('\n2️⃣ Starting READING section...');
  await fetch(`/api/attempts/${attemptId}/section/start`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sectionType: 'READING' })
  }).then(r => r.json()).then(console.log);
  
  // 3. Save answers (simulate autosave)
  console.log('\n3️⃣ Saving answers...');
  const answers = {
    q1: 'B',
    q2: 'NOT GIVEN',
    q3: 'temperatures'
  };
  
  await fetch(`/api/attempts/${attemptId}/section/save`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      sectionType: 'READING',
      answers 
    })
  }).then(r => r.json()).then(console.log);
  
  // Simulate multiple autosaves
  console.log('💾 Autosaving...');
  for (let i = 0; i < 3; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await fetch(`/api/attempts/${attemptId}/section/save`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sectionType: 'READING',
        answers: { ...answers, [`q${i+4}`]: `answer${i}` }
      })
    });
    console.log(`  Saved ${i+1}/3`);
  }
  
  // 4. End section
  console.log('\n4️⃣ Ending READING section...');
  await fetch(`/api/attempts/${attemptId}/section/end`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sectionType: 'READING' })
  }).then(r => r.json()).then(console.log);
  
  // 5. Try to save again (should fail - section ended)
  console.log('\n5️⃣ Testing section lock...');
  const lockTest = await fetch(`/api/attempts/${attemptId}/section/save`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      sectionType: 'READING',
      answers: { test: 'should fail' }
    })
  }).then(r => r.json());
  console.log('Section lock test:', lockTest.error ? '✅ LOCKED' : '❌ NOT LOCKED');
  
  // 6. Submit attempt
  console.log('\n6️⃣ Submitting attempt...');
  await fetch(`/api/attempts/${attemptId}/submit`, {
    method: 'POST'
  }).then(r => r.json()).then(console.log);
  
  // 7. Verify in DB
  console.log('\n7️⃣ Fetching final state...');
  const final = await fetch(`/api/attempts?bookingId=${bookingId}`)
    .then(r => r.json());
  
  console.log('\n✅ Test complete!');
  console.log('Status:', final.attempt.status);
  console.log('Sections:', final.attempt.sections.length);
  console.log('Submitted at:', final.attempt.submittedAt);
  
  return attemptId;
};

await testAttemptEngine();
```

## Expected Results

✅ **Create Attempt:**
- Attempt created with status "IN_PROGRESS"
- Sections created matching booking.sections
- All sections have status "NOT_STARTED"

✅ **Start Section:**
- Section status changes to "IN_PROGRESS"
- `startedAt` timestamp set
- Returns `durationMin` from exam section

✅ **Save Answers:**
- Answers saved in `answers` JSON field
- Can save multiple times (autosave)
- Optimistic - returns success immediately

✅ **End Section:**
- Section status changes to "COMPLETED"
- `endedAt` timestamp set
- Section is now locked (cannot save)

✅ **Submit Attempt:**
- Attempt status changes to "SUBMITTED"
- `submittedAt` timestamp set
- All unfinished sections automatically ended
- Booking status updated to "COMPLETED"

✅ **Section Lock:**
- After ending, saves to that section return error
- Data integrity maintained

## Troubleshooting

**"Attempt already exists":**
- Each booking can only have one attempt
- This is correct - prevents duplicate attempts

**"Section has been completed":**
- Trying to save to an ended section
- This is correct - section is locked

**"Unauthorized":**
- Make sure you're logged in as the student who owns the booking
- Check session in DevTools

**Migration errors:**
- Make sure you ran the migration first
- Check that there's no conflicting data

## Database Verification

Check the database directly:

```sql
-- View all attempts
SELECT id, "bookingId", status, "startedAt", "submittedAt" 
FROM attempts 
ORDER BY "createdAt" DESC;

-- View attempt sections with answers
SELECT 
  a.id as attempt_id,
  s.type as section_type,
  s.status,
  s."startedAt",
  s."endedAt",
  s.answers
FROM attempts a
JOIN attempt_sections s ON s."attemptId" = a.id
WHERE a.id = 'YOUR_ATTEMPT_ID'
ORDER BY s.type;

-- Check booking completion
SELECT id, status, "startAt"
FROM bookings 
WHERE id = 'YOUR_BOOKING_ID';
```

## Next Steps

After verifying the API works:
1. Build student exam-taking UI
2. Implement client-side timer
3. Implement autosave (every 5-10 seconds)
4. Add section navigation/tabs
5. Add progress indicators
6. Build question rendering UI
7. Implement auto-grading for Reading/Listening

## Notes

- All times stored in UTC
- Sections must be started before saving
- Sections are independent - can be done in any order
- Timer enforcement happens client-side (server validates on end)
- Answers structure is flexible JSON - can store any format
- Booking status updates to "COMPLETED" on submit

That's it! The attempt engine is ready. 🎉

