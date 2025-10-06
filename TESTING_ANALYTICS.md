# Testing Teacher Analytics

This guide explains how to test the analytics system with seed data.

## Prerequisites

1. **Teacher account** with classes
2. **Students** enrolled in classes
3. **Exams** with questions
4. **Attempts** completed by students
5. **Question tags** for topic analysis

## Migration

First, run the migration to add the QuestionTag model:

```bash
# Stop your dev server first (Ctrl+C)
npx prisma migrate dev --name analytics_tags
# When prompted, type 'y' and press Enter

# Regenerate Prisma Client
npx prisma generate

# Restart dev server
npm run dev
```

## Seed Data Script

Run this comprehensive script in your browser console as **TEACHER** to create test data for analytics:

```javascript
const seedAnalyticsData = async () => {
  console.log('🌱 Seeding analytics test data...\n');
  
  // 1. Create exam with questions
  console.log('1️⃣ Creating exam with questions...');
  const examRes = await fetch('/api/exams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'IELTS Academic Mock Test 1',
      examType: 'IELTS',
      sections: [
        { type: 'READING', durationMin: 60, order: 0 },
        { type: 'LISTENING', durationMin: 40, order: 1 },
        { type: 'WRITING', durationMin: 60, order: 2 },
        { type: 'SPEAKING', durationMin: 15, order: 3 }
      ]
    })
  });
  const { exam } = await examRes.json();
  console.log('✅ Exam created:', exam.id);
  
  // 2. Import questions with variety
  console.log('\n2️⃣ Importing questions...');
  const questionsRes = await fetch(`/api/exams/${exam.id}/questions/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        // READING - True/False/Not Given
        { sectionType: 'READING', qtype: 'true_false_not_given', order: 1, maxScore: 1,
          prompt: { text: 'The company was founded in 2020' },
          answerKey: { correct: 'TRUE' }
        },
        { sectionType: 'READING', qtype: 'true_false_not_given', order: 2, maxScore: 1,
          prompt: { text: 'All employees work remotely' },
          answerKey: { correct: 'NOT GIVEN' }
        },
        { sectionType: 'READING', qtype: 'true_false_not_given', order: 3, maxScore: 1,
          prompt: { text: 'The revenue increased last year' },
          answerKey: { correct: 'FALSE' }
        },
        
        // READING - Matching Headings
        { sectionType: 'READING', qtype: 'matching', order: 4, maxScore: 1,
          prompt: { text: 'Match heading to paragraph A' },
          answerKey: { correct: 'iii' }
        },
        { sectionType: 'READING', qtype: 'matching', order: 5, maxScore: 1,
          prompt: { text: 'Match heading to paragraph B' },
          answerKey: { correct: 'vi' }
        },
        
        // READING - Fill in Blanks
        { sectionType: 'READING', qtype: 'fill_in_blank', order: 6, maxScore: 1,
          prompt: { text: 'The process takes ___ hours' },
          answerKey: { correct: ['three', '3'] }
        },
        { sectionType: 'READING', qtype: 'fill_in_blank', order: 7, maxScore: 1,
          prompt: { text: 'Results are stored in the ___' },
          answerKey: { correct: 'database' }
        },
        
        // LISTENING - Multiple Choice
        { sectionType: 'LISTENING', qtype: 'multiple_choice', order: 1, maxScore: 1,
          prompt: { text: 'What is the main topic?' },
          options: { choices: ['A) History', 'B) Science', 'C) Art', 'D) Music'] },
          answerKey: { correct: 'B' }
        },
        { sectionType: 'LISTENING', qtype: 'multiple_choice', order: 2, maxScore: 1,
          prompt: { text: 'When did the event occur?' },
          options: { choices: ['A) Monday', 'B) Tuesday', 'C) Wednesday', 'D) Thursday'] },
          answerKey: { correct: 'C' }
        },
        
        // LISTENING - Note Completion
        { sectionType: 'LISTENING', qtype: 'note_completion', order: 3, maxScore: 1,
          prompt: { text: 'Speaker works at ___' },
          answerKey: { correct: 'university' }
        },
        { sectionType: 'LISTENING', qtype: 'note_completion', order: 4, maxScore: 1,
          prompt: { text: 'Research focus: ___' },
          answerKey: { correct: 'climate change' }
        },
      ]
    })
  });
  const questions = await questionsRes.json();
  console.log('✅ Questions imported:', questions.items.length);
  
  // 3. Add tags to questions
  console.log('\n3️⃣ Adding question tags...');
  const questionIds = questions.items.map(q => q.id);
  
  // Tag groups
  const tags = [
    { qIds: [0, 1, 2], tag: 'True/False/Not Given' },
    { qIds: [3, 4], tag: 'Matching Headings' },
    { qIds: [5, 6], tag: 'Fill in Blanks' },
    { qIds: [7, 8], tag: 'Multiple Choice' },
    { qIds: [9, 10], tag: 'Note Completion' },
  ];
  
  for (const tagGroup of tags) {
    for (const qIdx of tagGroup.qIds) {
      if (questionIds[qIdx]) {
        await fetch('/api/questions/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: questionIds[qIdx],
            tag: tagGroup.tag
          })
        }).catch(() => console.log('Tag endpoint not implemented yet - skipping'));
      }
    }
  }
  console.log('✅ Tags added (if endpoint exists)');
  
  // 4. Import band mappings
  console.log('\n4️⃣ Importing band mappings...');
  await fetch('/api/bands/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        // IELTS Reading
        { examType: 'IELTS', section: 'READING', minRaw: 0, maxRaw: 2, band: 2.0 },
        { examType: 'IELTS', section: 'READING', minRaw: 3, maxRaw: 4, band: 4.0 },
        { examType: 'IELTS', section: 'READING', minRaw: 5, maxRaw: 6, band: 6.0 },
        { examType: 'IELTS', section: 'READING', minRaw: 7, maxRaw: 8, band: 7.0 },
        { examType: 'IELTS', section: 'READING', minRaw: 9, maxRaw: 10, band: 8.0 },
        { examType: 'IELTS', section: 'READING', minRaw: 11, maxRaw: 11, band: 9.0 },
        // IELTS Listening
        { examType: 'IELTS', section: 'LISTENING', minRaw: 0, maxRaw: 2, band: 2.0 },
        { examType: 'IELTS', section: 'LISTENING', minRaw: 3, maxRaw: 4, band: 4.0 },
        { examType: 'IELTS', section: 'LISTENING', minRaw: 5, maxRaw: 6, band: 6.0 },
        { examType: 'IELTS', section: 'LISTENING', minRaw: 7, maxRaw: 8, band: 7.0 },
        { examType: 'IELTS', section: 'LISTENING', minRaw: 9, maxRaw: 10, band: 8.0 },
        { examType: 'IELTS', section: 'LISTENING', minRaw: 11, maxRaw: 11, band: 9.0 },
      ]
    })
  });
  console.log('✅ Band mappings imported');
  
  // 5. Create class and add students
  console.log('\n5️⃣ Creating class...');
  const classRes = await fetch('/api/classes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'IELTS Advanced October 2025' })
  });
  const { class: classData } = await classRes.json();
  console.log('✅ Class created:', classData.id);
  
  // Note: You need to manually add students or provide student emails
  const studentEmails = ['student1@test.com', 'student2@test.com', 'student3@test.com'];
  console.log('\n6️⃣ Add these students manually:');
  console.log('Student emails:', studentEmails.join(', '));
  console.log('Or run addStudentsToClass(classId, studentEmails) function');
  
  console.log('\n✅ Seed data created!');
  console.log('\nNext steps (as STUDENT):');
  console.log('1. Create bookings for students');
  console.log('2. Complete attempts with varying answers');
  console.log('3. View analytics at /dashboard/teacher/analytics/' + classData.id);
  
  return {
    examId: exam.id,
    classId: classData.id,
    questionIds
  };
};

await seedAnalyticsData();
```

## Creating Test Attempts (As STUDENT)

After seeding, log in as each student and create attempts with varying performance:

```javascript
// Student 1 - High performer (mostly correct)
const createAttemptStudent1 = async (bookingId) => {
  const { attempt } = await fetch('/api/attempts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId })
  }).then(r => r.json());
  
  // Reading section - 6 correct out of 7
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
      answers: {
        'q1_id': 'TRUE',      // ✅
        'q2_id': 'NOT GIVEN', // ✅
        'q3_id': 'TRUE',      // ❌ (correct: FALSE)
        'q4_id': 'iii',       // ✅
        'q5_id': 'vi',        // ✅
        'q6_id': 'three',     // ✅
        'q7_id': 'database',  // ✅
      }
    })
  });
  
  await fetch(`/api/attempts/${attempt.id}/section/end`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sectionType: 'READING' })
  });
  
  // Listening section - 3 correct out of 4
  await fetch(`/api/attempts/${attempt.id}/section/start`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sectionType: 'LISTENING' })
  });
  
  await fetch(`/api/attempts/${attempt.id}/section/save`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      sectionType: 'LISTENING',
      answers: {
        'q8_id': 'B',              // ✅
        'q9_id': 'C',              // ✅
        'q10_id': 'school',        // ❌ (correct: university)
        'q11_id': 'climate change', // ✅
      }
    })
  });
  
  await fetch(`/api/attempts/${attempt.id}/section/end`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sectionType: 'LISTENING' })
  });
  
  // Submit
  await fetch(`/api/attempts/${attempt.id}/submit`, { method: 'POST' });
  
  console.log('✅ Student 1 attempt completed (high performer)');
};

// Student 2 - Medium performer (moderate scores)
const createAttemptStudent2 = async (bookingId) => {
  // Similar structure but with 4/7 Reading and 2/4 Listening
  // ... (implement similar to above)
};

// Student 3 - Low performer (struggling)
const createAttemptStudent3 = async (bookingId) => {
  // Similar structure but with 2/7 Reading and 1/4 Listening
  // ... (implement similar to above)
};
```

## Manual Tag Addition (Direct DB)

If the question tag API endpoint doesn't exist yet, add tags directly to database:

```sql
-- Connect to your PostgreSQL database
-- Replace question IDs with actual IDs from your database

-- True/False/Not Given questions
INSERT INTO question_tags ("questionId", tag, "createdAt")
SELECT id, 'True/False/Not Given', NOW()
FROM questions
WHERE qtype = 'true_false_not_given'
LIMIT 3;

-- Matching Headings questions
INSERT INTO question_tags ("questionId", tag, "createdAt")
SELECT id, 'Matching Headings', NOW()
FROM questions
WHERE qtype = 'matching'
LIMIT 2;

-- Fill in Blanks questions
INSERT INTO question_tags ("questionId", tag, "createdAt")
SELECT id, 'Fill in Blanks', NOW()
FROM questions
WHERE qtype = 'fill_in_blank'
LIMIT 2;

-- Multiple Choice questions
INSERT INTO question_tags ("questionId", tag, "createdAt")
SELECT id, 'Multiple Choice', NOW()
FROM questions
WHERE qtype = 'multiple_choice'
LIMIT 2;

-- Note Completion questions
INSERT INTO question_tags ("questionId", tag, "createdAt")
SELECT id, 'Note Completion', NOW()
FROM questions
WHERE qtype = 'note_completion'
LIMIT 2;
```

## Testing Analytics Page

### Test 1: Access Analytics

**Steps:**
1. Log in as TEACHER
2. Navigate to `/dashboard/teacher/classes`
3. Click "Analytics" button on a class card
4. Should navigate to `/dashboard/teacher/analytics/[classId]`

**Expected:**
- ✅ Page loads successfully
- ✅ Class name displayed in header
- ✅ KPI cards show correct data
- ✅ If no attempts, shows "Not enough data" message

### Test 2: KPI Cards

**With Data:**
- ✅ Students: Shows enrolled count
- ✅ Attempts: Shows completed attempts count
- ✅ Avg Overall: Shows average band (color-coded)
- ✅ Data Points: Shows number of weeks with data

**Without Data:**
- ✅ Students: Shows 0
- ✅ Attempts: Shows 0
- ✅ Avg Overall: Shows "—"
- ✅ Data Points: Shows 0

### Test 3: Performance Trend Chart

**Expected:**
- ✅ Line chart renders (SVG)
- ✅ Data points visible as circles
- ✅ Line connects points
- ✅ Y-axis labels (0.0 - 9.0)
- ✅ X-axis labels (week start dates)
- ✅ Trend indicator (Improving/Declining)

**Edge Cases:**
- Single data point: Shows just the point
- No data: Chart section hidden

### Test 4: Section Performance Bars

**Expected:**
- ✅ 4 sections listed (READING, LISTENING, WRITING, SPEAKING)
- ✅ Band score displayed per section
- ✅ Progress bars filled proportionally
- ✅ Color-coded by band range:
  - Green: 8-9
  - Blue: 7-7.5
  - Purple: 6-6.5
  - Orange: 5-5.5
  - Red: <5
- ✅ Shows "—" for sections with no data

### Test 5: Weak Topics Table

**With Tagged Questions:**
- ✅ Table displays topics
- ✅ Sorted by accuracy (lowest first)
- ✅ Shows accuracy percentage
- ✅ Shows number of attempts
- ✅ Status badge color-coded:
  - Red: <40% (Critical)
  - Orange: 40-60% (Weak)
  - Blue: 60-80% (Good)
  - Green: ≥80% (Strong)

**Without Tags:**
- ✅ Shows message: "No topic data available..."
- ✅ Suggests tagging questions

## API Testing

### Test Analytics Endpoint

```javascript
const testAnalyticsAPI = async (classId) => {
  const res = await fetch(`/api/analytics/teacher/overview?classId=${classId}`);
  const data = await res.json();
  
  console.log('📊 Analytics Data:', data);
  
  // Verify structure
  console.assert(data.class, 'Should have class object');
  console.assert(typeof data.studentsCount === 'number', 'Should have studentsCount');
  console.assert(typeof data.attemptsCount === 'number', 'Should have attemptsCount');
  console.assert(Array.isArray(data.trendLastN), 'Should have trendLastN array');
  console.assert(Array.isArray(data.weakTopics), 'Should have weakTopics array');
  
  // Verify calculations
  if (data.avgOverall !== null) {
    console.log('Avg Overall:', data.avgOverall);
    console.assert(data.avgOverall >= 0 && data.avgOverall <= 9, 'Band should be 0-9');
  }
  
  // Verify trend
  console.log('Trend data points:', data.trendLastN.length);
  data.trendLastN.forEach(point => {
    console.log(`Week ${point.weekStart}: ${point.avgOverall}`);
  });
  
  // Verify weak topics
  console.log('Weak topics:', data.weakTopics.length);
  data.weakTopics.forEach(topic => {
    console.log(`${topic.tag}: ${topic.accuracyPercent}% (${topic.attempts} attempts)`);
  });
  
  console.log('✅ Analytics API test complete');
};

await testAnalyticsAPI('YOUR_CLASS_ID');
```

## Database Verification

```sql
-- Check analytics data
SELECT 
  c.name as class_name,
  COUNT(DISTINCT cs."studentId") as students_count,
  COUNT(DISTINCT a.id) as attempts_count,
  AVG(a."bandOverall") as avg_overall
FROM classes c
LEFT JOIN class_students cs ON cs."classId" = c.id
LEFT JOIN bookings b ON b."studentId" = cs."studentId"
LEFT JOIN attempts a ON a."bookingId" = b.id AND a.status = 'SUBMITTED'
WHERE c.id = 'YOUR_CLASS_ID'
GROUP BY c.id, c.name;

-- Check section averages
SELECT 
  s.type,
  AVG(s."bandScore") as avg_band,
  COUNT(*) as count
FROM attempt_sections s
JOIN attempts a ON a.id = s."attemptId"
JOIN bookings b ON b.id = a."bookingId"
WHERE b."studentId" IN (
  SELECT "studentId" FROM class_students WHERE "classId" = 'YOUR_CLASS_ID'
)
AND s."bandScore" IS NOT NULL
GROUP BY s.type;

-- Check question tags
SELECT 
  qt.tag,
  COUNT(*) as question_count
FROM question_tags qt
GROUP BY qt.tag
ORDER BY question_count DESC;

-- Check weekly trend
SELECT 
  DATE_TRUNC('week', a."submittedAt") as week_start,
  AVG(a."bandOverall") as avg_band,
  COUNT(*) as attempts
FROM attempts a
JOIN bookings b ON b.id = a."bookingId"
WHERE b."studentId" IN (
  SELECT "studentId" FROM class_students WHERE "classId" = 'YOUR_CLASS_ID'
)
AND a.status = 'SUBMITTED'
AND a."bandOverall" IS NOT NULL
AND a."submittedAt" >= NOW() - INTERVAL '8 weeks'
GROUP BY DATE_TRUNC('week', a."submittedAt")
ORDER BY week_start;
```

## Verification Checklist

✅ **Schema & Migration:**
- [ ] QuestionTag model added to schema
- [ ] Migration created and applied
- [ ] Prisma Client regenerated

✅ **API Endpoint:**
- [ ] Returns correct structure
- [ ] Calculates averages accurately
- [ ] Groups trend by week correctly
- [ ] Sorts weak topics by accuracy
- [ ] Handles empty data gracefully

✅ **UI Components:**
- [ ] KPI cards display correct data
- [ ] Trend chart renders
- [ ] Section bars show correct percentages
- [ ] Weak topics table sorted correctly
- [ ] Empty state displayed when no data
- [ ] Color coding correct

✅ **Navigation:**
- [ ] Analytics button on class cards works
- [ ] Back button returns to dashboard
- [ ] URL param (classId) handled correctly

✅ **Security:**
- [ ] Only teacher can access their classes
- [ ] Unauthorized access blocked
- [ ] Invalid classId handled

---

**Task J — Teacher Analytics** testing complete! 🎉

The analytics system provides comprehensive insights into class performance with trends, section breakdowns, and weak topic analysis.

