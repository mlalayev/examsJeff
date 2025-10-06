# Testing Dashboard Polish

This guide explains how to test the polished student and teacher dashboards.

## Prerequisites

1. **Database seeded** with test data
2. **At least 1 teacher** account
3. **At least 1 student** account
4. **1 class** with enrolled student
5. **1 booking** (future) and **1 attempt** (past submitted)

## Quick Seed Script

Run this in your browser console as TEACHER to create test data:

```javascript
const seedTestData = async () => {
  console.log('🌱 Seeding test data...\n');
  
  // 1. Create an exam
  console.log('1️⃣ Creating exam...');
  const examRes = await fetch('/api/exams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'IELTS Academic Full Test',
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
  
  // 2. Create a class
  console.log('\n2️⃣ Creating class...');
  const classRes = await fetch('/api/classes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'IELTS Prep October 2025' })
  });
  const { class: classData } = await classRes.json();
  console.log('✅ Class created:', classData.id);
  
  // 3. Add student to class (you'll need a student email)
  const studentEmail = 'student@example.com'; // Replace with actual student email
  console.log('\n3️⃣ Adding student to class...');
  const addStudentRes = await fetch(`/api/classes/${classData.id}/add-student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentEmail })
  });
  const addResult = await addStudentRes.json();
  console.log('✅ Student added');
  
  // 4. Get student ID
  const rosterRes = await fetch(`/api/classes/${classData.id}/roster`);
  const roster = await rosterRes.json();
  const studentId = roster.students[0].id;
  
  // 5. Create a future booking (tomorrow)
  console.log('\n4️⃣ Creating future booking...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  
  const bookingRes = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId,
      examId: exam.id,
      sections: ['READING', 'LISTENING'],
      startAt: tomorrow.toISOString(),
      status: 'CONFIRMED'
    })
  });
  const booking = await bookingRes.json();
  console.log('✅ Future booking created:', booking.booking.id);
  
  // 6. Create a past booking (yesterday)
  console.log('\n5️⃣ Creating past booking...');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(14, 0, 0, 0);
  
  const pastBookingRes = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId,
      examId: exam.id,
      sections: ['WRITING', 'SPEAKING'],
      startAt: yesterday.toISOString(),
      status: 'CONFIRMED'
    })
  });
  const pastBooking = await pastBookingRes.json();
  console.log('✅ Past booking created:', pastBooking.booking.id);
  
  console.log('\n✅ Test data seeded successfully!');
  console.log('\nNext steps:');
  console.log('1. Log in as STUDENT');
  console.log('2. Create attempt from past booking');
  console.log('3. Submit attempt');
  console.log('4. Check both dashboards');
  
  return {
    examId: exam.id,
    classId: classData.id,
    futureBookingId: booking.booking.id,
    pastBookingId: pastBooking.booking.id
  };
};

await seedTestData();
```

## Testing Flow

### Part 1: Student Dashboard

#### Test 1: New Student (Empty State)

**Setup:**
- Create a new student account
- Do NOT add to any class or create bookings

**Steps:**
1. Log in as the new student
2. Navigate to `/dashboard/student`

**Expected Results:**
- ✅ Stats show all zeros:
  - Total Exams: 0
  - Average Band: —
  - Upcoming: 0
  - Activity: 0
- ✅ "Upcoming Exams" section shows empty state:
  - Calendar icon
  - "No upcoming exams" message
  - Explanation about contacting teacher
- ✅ "Recent Results" section shows empty state:
  - Award icon
  - "No results yet" message
  - Encouragement to complete first exam
- ✅ No progress tip shown

#### Test 2: Student with Upcoming Exam

**Setup:**
- Use student from seed script (has future booking)

**Steps:**
1. Log in as student
2. Navigate to `/dashboard/student`

**Expected Results:**
- ✅ Stats show:
  - Upcoming: 1 (or more)
- ✅ "Upcoming Exams" section shows card:
  - Exam title: "IELTS Academic Full Test"
  - Teacher name
  - Date/time in Asia/Baku (tomorrow at 10:00)
  - Section badges: READING, LISTENING
  - "Start Exam" button (blue)
- ✅ Click "Start Exam" → should navigate or show message

#### Test 3: Student with Completed Attempt

**Setup:**
- Create attempt from past booking
- Submit the attempt (auto-scored)

```javascript
// As STUDENT - create and submit attempt
const createAttempt = async (bookingId) => {
  // Create
  const res1 = await fetch('/api/attempts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId })
  });
  const { attempt } = await res1.json();
  
  // Start Writing section
  await fetch(`/api/attempts/${attempt.id}/section/start`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sectionType: 'WRITING' })
  });
  
  // Save some answers
  await fetch(`/api/attempts/${attempt.id}/section/save`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      sectionType: 'WRITING',
      answers: 'This is my essay...'
    })
  });
  
  // End Writing
  await fetch(`/api/attempts/${attempt.id}/section/end`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sectionType: 'WRITING' })
  });
  
  // Submit
  await fetch(`/api/attempts/${attempt.id}/submit`, {
    method: 'POST'
  });
  
  console.log('✅ Attempt submitted:', attempt.id);
  return attempt.id;
};

// Use past booking ID from seed
const attemptId = await createAttempt('YOUR_PAST_BOOKING_ID');
```

**Steps:**
1. Refresh student dashboard
2. Check "Recent Results" section

**Expected Results:**
- ✅ Stats updated:
  - Total Exams: 1
  - Average Band: (shows calculated average or — if W/S not graded)
- ✅ "Recent Results" shows card:
  - Exam title
  - Submitted date/time
  - Overall band (if all sections graded)
  - Section bands grid (R/L/W/S)
  - "View Details" link
- ✅ Click card → navigates to results page
- ✅ Progress tip appears if bandOverall exists

#### Test 4: Color-Coded Bands

**Test different band ranges:**
- Band 8.5 → Green
- Band 7.0 → Blue
- Band 6.5 → Purple
- Band 5.5 → Orange
- Band 4.0 → Red

### Part 2: Teacher Dashboard

#### Test 5: New Teacher (Empty State)

**Setup:**
- Create new teacher account
- Do NOT create classes or bookings

**Steps:**
1. Log in as new teacher
2. Navigate to `/dashboard/teacher`

**Expected Results:**
- ✅ Stats show all zeros:
  - Students: 0 (0 classes)
  - Pending Grading: 0 (All caught up!)
  - Total Graded: 0
  - Upcoming: 0
- ✅ Quick Actions visible (4 cards)
- ✅ NO alert banner
- ✅ NO quick grading section
- ✅ "Upcoming Exams" shows empty state:
  - Calendar icon
  - "No upcoming exams" message
  - "Go to Classes" button

#### Test 6: Active Teacher with Data

**Setup:**
- Use teacher from seed script
- Has class, students, bookings

**Steps:**
1. Log in as teacher
2. Navigate to `/dashboard/teacher`

**Expected Results:**
- ✅ Stats show real data:
  - Students: 1 (1 class)
  - Pending Grading: (depends on W/S submissions)
  - Upcoming: 1+
- ✅ Quick Actions visible
- ✅ "Manage Classes" → clickable
- ✅ "Grade Submissions" → has badge if pending > 0
- ✅ "Upcoming Exams" table populated:
  - Shows student name
  - Shows exam title
  - Shows date/time (Asia/Baku)
  - Shows section badges
  - Shows status badge (CONFIRMED)

#### Test 7: Teacher with Pending Grading

**Setup:**
- Student has submitted attempt with W/S sections
- W/S sections not graded yet

**Steps:**
1. Navigate to teacher dashboard
2. Check for alert and quick grading section

**Expected Results:**
- ✅ Stats show:
  - Pending Grading: 2 (or number of W/S sections)
- ✅ Orange alert banner visible:
  - Shows count: "2 sections awaiting grading"
  - Message: "Students are waiting..."
  - "Grade Now" button
- ✅ "Quick Grading" section visible:
  - Shows up to 5 pending sections
  - Each row shows:
    - Student name
    - Section type (WRITING/SPEAKING)
    - Exam title
    - Time ago ("2h ago", "1d ago")
    - Blue "Grade" button
- ✅ Badge on "Grade Submissions" action shows count
- ✅ Click "Grade" → navigates to grading page

#### Test 8: After Grading All Sections

**Setup:**
- Grade all pending W/S sections

**Steps:**
1. Go to grading queue
2. Grade all pending sections
3. Return to dashboard

**Expected Results:**
- ✅ Stats updated:
  - Pending Grading: 0
  - Total Graded: (increased)
- ✅ NO alert banner
- ✅ NO quick grading section
- ✅ "All caught up!" message in stats

### Part 3: Navigation & UX

#### Test 9: Loading States

**Steps:**
1. Clear cache
2. Navigate to student dashboard
3. Observe loading

**Expected Results:**
- ✅ Spinner shown while loading
- ✅ Smooth transition to content
- ✅ No flash of empty state

#### Test 10: Error Handling

**Steps:**
1. Disable network
2. Navigate to dashboard

**Expected Results:**
- ✅ Error message displayed
- ✅ Clear explanation
- ✅ No crashes

#### Test 11: Links & Navigation

**Test all clickable elements:**

**Student Dashboard:**
- [ ] "Start Exam" button → attempt page
- [ ] "View Results" button → results page
- [ ] Recent result card → results page
- [ ] "View all" link (if multiple bookings)

**Teacher Dashboard:**
- [ ] "Manage Exams" action → exams page
- [ ] "Manage Classes" action → classes page
- [ ] "Grade Submissions" action → grading page
- [ ] "View Analytics" action → analytics page (may not exist yet)
- [ ] "Grade Now" button → grading page
- [ ] Individual "Grade" buttons → specific grading page
- [ ] "View all" links → respective list pages

#### Test 12: Responsive Design

**Test on different screen sizes:**
- [ ] Desktop (1920x1080) → 4-column grid
- [ ] Tablet (768x1024) → 2-column grid
- [ ] Mobile (375x667) → 1-column stack

**Expected:**
- ✅ Layouts adapt smoothly
- ✅ No horizontal scroll
- ✅ Text readable
- ✅ Buttons accessible

## API Testing

### Student Overview API

```javascript
// As STUDENT
const testStudentOverview = async () => {
  const res = await fetch('/api/student/overview');
  const data = await res.json();
  
  console.log('📊 Student Overview:', data);
  
  // Verify structure
  console.assert(Array.isArray(data.upcomingBookings), 'upcomingBookings should be array');
  console.assert(Array.isArray(data.recentAttempts), 'recentAttempts should be array');
  console.assert(typeof data.stats.totalAttempts === 'number', 'totalAttempts should be number');
  
  // Verify timezone
  if (data.upcomingBookings.length > 0) {
    const booking = data.upcomingBookings[0];
    const date = new Date(booking.startAt);
    console.log('Booking date:', date.toLocaleString('en-US', { timeZone: 'Asia/Baku' }));
  }
  
  console.log('✅ Student overview API test passed');
};

await testStudentOverview();
```

### Teacher Overview API

```javascript
// As TEACHER
const testTeacherOverview = async () => {
  const res = await fetch('/api/teacher/overview');
  const data = await res.json();
  
  console.log('📊 Teacher Overview:', data);
  
  // Verify structure
  console.assert(typeof data.stats.classesCount === 'number', 'classesCount should be number');
  console.assert(typeof data.stats.studentsCount === 'number', 'studentsCount should be number');
  console.assert(Array.isArray(data.upcomingBookings), 'upcomingBookings should be array');
  console.assert(Array.isArray(data.pendingGrading), 'pendingGrading should be array');
  
  // Verify counts match
  console.log('Classes:', data.stats.classesCount);
  console.log('Students:', data.stats.studentsCount);
  console.log('Pending Grading:', data.stats.pendingGradingCount);
  console.log('Pending List Length:', data.pendingGrading.length);
  
  console.log('✅ Teacher overview API test passed');
};

await testTeacherOverview();
```

## Database Verification

```sql
-- Check student data
SELECT 
  u.email,
  COUNT(DISTINCT b.id) as bookings_count,
  COUNT(DISTINCT a.id) as attempts_count,
  AVG(a."bandOverall") as avg_band
FROM users u
LEFT JOIN bookings b ON b."studentId" = u.id
LEFT JOIN attempts a ON a."bookingId" = b.id AND a.status = 'SUBMITTED'
WHERE u.email = 'student@example.com'
GROUP BY u.id, u.email;

-- Check teacher data
SELECT 
  u.email,
  COUNT(DISTINCT c.id) as classes_count,
  COUNT(DISTINCT cs."studentId") as students_count,
  COUNT(DISTINCT b.id) as bookings_count
FROM users u
LEFT JOIN classes c ON c."teacherId" = u.id
LEFT JOIN class_students cs ON cs."classId" = c.id
LEFT JOIN bookings b ON b."teacherId" = u.id
WHERE u.email = 'teacher@example.com'
GROUP BY u.id, u.email;

-- Check pending grading
SELECT 
  s.id as section_id,
  s.type,
  u.email as student_email,
  e.title as exam_title,
  a."submittedAt"
FROM attempt_sections s
JOIN attempts a ON a.id = s."attemptId"
JOIN bookings b ON b.id = a."bookingId"
JOIN users u ON u.id = b."studentId"
JOIN exams e ON e.id = b."examId"
WHERE s.type IN ('WRITING', 'SPEAKING')
  AND s."bandScore" IS NULL
  AND a.status = 'SUBMITTED'
  AND b."teacherId" = (SELECT id FROM users WHERE email = 'teacher@example.com');
```

## Verification Checklist

### Student Dashboard
- [ ] Stats accurate (total, average, upcoming, streak)
- [ ] Upcoming bookings sorted by date (ascending)
- [ ] Timezone correct (Asia/Baku)
- [ ] "Start Exam" button shows for future bookings
- [ ] "View Results" button shows for completed attempts
- [ ] Recent results show band scores
- [ ] Section bands displayed (4-column grid)
- [ ] Empty states appear when no data
- [ ] Progress tip shows for students with results
- [ ] Color-coded bands correct
- [ ] All links functional
- [ ] Loading state smooth
- [ ] Responsive design works

### Teacher Dashboard
- [ ] Stats accurate (classes, students, pending, upcoming, graded)
- [ ] Quick actions all functional
- [ ] Badge shows pending count correctly
- [ ] Alert banner appears when pending > 0
- [ ] Quick grading list shows correct sections
- [ ] "Grade" buttons link correctly
- [ ] Upcoming table populates
- [ ] Timezone correct (Asia/Baku)
- [ ] Empty states appear when no data
- [ ] Table readable and organized
- [ ] All links functional
- [ ] Loading state smooth
- [ ] Responsive design works

### Both Dashboards
- [ ] No console errors
- [ ] No broken images
- [ ] Icons render correctly
- [ ] Hover effects work
- [ ] Transitions smooth
- [ ] Text readable (no overflow)
- [ ] Spacing consistent

---

**Task I — Dashboards Polish** testing complete! 🎉

Both dashboards provide comprehensive overviews with real-time data, smart CTAs, and polished UX.

