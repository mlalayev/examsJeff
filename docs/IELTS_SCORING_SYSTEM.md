# IELTS Listening Scoring & Results System

## 📊 Overview
Server-side scoring system for IELTS Listening with 4-part breakdown and teacher-only visibility.

---

## 🎯 Scoring Rules

### IELTS Listening:
- **Total Questions**: 40 (exactly)
- **Parts**: 4 (10 questions each)
- **Points per Question**: 1 point (correct = 1, wrong/blank = 0)
- **Raw Score Range**: 0–40

### Part Distribution:
- **Part 1** (Q1-10): Conversation in social context
- **Part 2** (Q11-20): Monologue in social context  
- **Part 3** (Q21-30): Discussion in educational context
- **Part 4** (Q31-40): Academic monologue

---

## 💾 Data Storage

### Database Schema:
```prisma
model Attempt {
  id           String      @id
  status       String      // IN_PROGRESS | SUBMITTED
  submittedAt  DateTime?
  bandOverall  Float?      // Overall percentage
  startedAt    DateTime?
  // ... other fields
  sections     AttemptSection[]
}

model AttemptSection {
  id         String      @id
  type       SectionType // LISTENING, READING, WRITING, SPEAKING
  rawScore   Int?        // 0-40 for IELTS Listening
  maxScore   Int?        // Always 40 for IELTS Listening
  bandScore  Float?      // For band conversion (optional)
  rubric     Json?       // IELTS Listening: stores part scores
  feedback   String?     // Teacher feedback (Writing/Speaking)
  startedAt  DateTime?
  endedAt    DateTime?
  status     String      // IN_PROGRESS | COMPLETED
}
```

### Rubric JSON Structure (IELTS Listening):
```json
{
  "listeningParts": {
    "s1": 8,  // Part 1: 8/10 correct
    "s2": 9,  // Part 2: 9/10 correct
    "s3": 7,  // Part 3: 7/10 correct
    "s4": 6   // Part 4: 6/10 correct
  },
  "totalRaw": 30,
  "maxScore": 40
}
```

---

## 🔐 Security & Visibility

### ❌ Student CANNOT See:
- Correct answers / answer keys
- Per-question breakdown
- Individual question correctness
- Section-by-section analysis (unless teacher allows)

### ✅ Student CAN See:
- "Submitted successfully" message
- Total score (optional): `30/40 correct (75%)`
- Section summary: `LISTENING: 30/40 (75%)`
- **NOT** per-question details

### ✅ Teacher CAN See:
- Section raw scores (e.g., LISTENING: 30/40)
- Part-by-part breakdown (IELTS Listening):
  - Part 1: 8/10
  - Part 2: 9/10
  - Part 3: 7/10
  - Part 4: 6/10
- Student answer sheet vs correct answers
- Per-question correctness
- Timestamps (started, submitted, duration)
- Total score and percentage

---

## 🛠️ Implementation

### 1. Scoring Helper (`src/lib/ielts-listening-scoring.ts`)

```typescript
import { scoreQuestion } from "./scoring";
import { getIELTSListeningPart } from "./ielts-listening-helper";

export function scoreIELTSListening(
  questions: Array<{
    id: string;
    qtype: string;
    answerKey: any;
    maxScore?: number;
    order: number; // 0-based
  }>,
  answers: Record<string, any>
): {
  sectionScores: { s1: number; s2: number; s3: number; s4: number };
  totalRaw: number;
  maxScore: number;
}
```

**Logic**:
1. Loop through all 40 questions
2. Score each question (0 or 1)
3. Group by part (based on `order` field):
   - Q0-9 → Part 1 (s1)
   - Q10-19 → Part 2 (s2)
   - Q20-29 → Part 3 (s3)
   - Q30-39 → Part 4 (s4)
4. Return part scores + total

---

### 2. Submit API (`src/app/api/attempts/[attemptId]/submit/route.ts`)

**Flow**:
1. Student submits attempt
2. Server loads exam + questions (with `answerKey`)
3. **IELTS Listening Special Handling**:
   ```typescript
   if (exam.category === "IELTS" && section.type === "LISTENING") {
     const result = scoreIELTSListening(questions, answers);
     sectionRaw = result.totalRaw; // 0-40
     sectionMax = result.maxScore; // 40
     sectionRubric = {
       listeningParts: result.sectionScores,
       totalRaw: result.totalRaw,
       maxScore: result.maxScore,
     };
   }
   ```
4. Save to database:
   - `rawScore`: 30
   - `maxScore`: 40
   - `rubric`: part scores JSON
5. Return success (NO answer keys sent to client)

**Security**:
- ✅ Answer keys NEVER leave server
- ✅ Scoring computed server-side
- ✅ Client only gets success/fail result

---

### 3. Results API (`src/app/api/attempts/[attemptId]/results/route.ts`)

**Student View** (Role: STUDENT):
```json
{
  "attemptId": "...",
  "examTitle": "IELTS Practice Test",
  "role": "STUDENT",
  "submittedAt": "2026-01-31T12:00:00Z",
  "summary": {
    "totalCorrect": 30,
    "totalQuestions": 40,
    "totalPercentage": 75,
    "perSection": [
      {
        "type": "LISTENING",
        "title": "Listening Section",
        "correct": 30,
        "total": 40,
        "percentage": 75
      }
    ]
  }
  // NO "sections" array with questions!
  // NO "answerKey" fields!
}
```

**Teacher View** (Role: TEACHER/ADMIN):
```json
{
  "attemptId": "...",
  "examTitle": "IELTS Practice Test",
  "studentName": "John Doe",
  "role": "TEACHER",
  "submittedAt": "2026-01-31T12:00:00Z",
  "summary": {
    "totalCorrect": 30,
    "totalQuestions": 40,
    "totalPercentage": 75
  },
  "sections": [
    {
      "type": "LISTENING",
      "title": "Listening Section",
      "correct": 30,
      "total": 40,
      "percentage": 75,
      "listeningParts": {
        "s1": 8,
        "s2": 9,
        "s3": 7,
        "s4": 6
      },
      "questions": [
        {
          "id": "q1",
          "qtype": "MCQ_SINGLE",
          "prompt": {...},
          "studentAnswer": "Option B",
          "correctAnswer": "Option B",
          "isCorrect": true
        },
        // ... all 40 questions
      ]
    }
  ]
}
```

---

### 4. UI - Teacher Results View

**File**: `src/app/attempts/[attemptId]/results/page.tsx`

**IELTS Listening Part Breakdown** (Teacher Only):
```tsx
{data.role === "TEACHER" && section.type === "LISTENING" && section.listeningParts && (
  <div className="flex items-center gap-2 mt-2 text-xs">
    <span className="text-gray-500">Parts:</span>
    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
      P1: {section.listeningParts.s1}/10
    </span>
    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
      P2: {section.listeningParts.s2}/10
    </span>
    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
      P3: {section.listeningParts.s3}/10
    </span>
    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
      P4: {section.listeningParts.s4}/10
    </span>
  </div>
)}
```

**Display**:
```
📊 Listening Section
30 / 40 correct • LISTENING

Parts: [P1: 8/10] [P2: 9/10] [P3: 7/10] [P4: 6/10]

75% ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░
```

---

### 5. UI - Student Results View

**File**: `src/app/dashboard/student/results/[attemptId]/page.tsx`

**Minimal Display** (NO detailed questions):
```
✅ Submitted Successfully

Overall Score: 75%
30 out of 40 questions correct

Section Results:
📊 Listening Section
30 / 40 correct (75%)
```

**Logic**:
- API returns `summary` only (no `sections.questions`)
- Page checks `if (data.sections && data.sections.length > 0)` → FALSE
- Questions section NOT rendered
- Student sees ONLY summary

---

## 🚀 API Endpoints

### 1. Submit Attempt
```
POST /api/attempts/[attemptId]/submit
Authorization: Student must own attempt
Body: (empty - answers already saved via auto-save)

Response:
{
  "success": true,
  "attemptId": "...",
  "resultsUrl": "/attempt/.../results"
}
```

### 2. Get Results (Student)
```
GET /api/attempts/[attemptId]/results
Authorization: Student must own attempt

Response: Summary only (see above)
```

### 3. Get Results (Teacher)
```
GET /api/attempts/[attemptId]/results
Authorization: Teacher of student's class

Response: Full details (see above)
```

---

## ⚡ Time Tracking

### Existing Fields:
- `Attempt.startedAt` - When attempt began
- `Attempt.submittedAt` - When submitted
- `AttemptSection.startedAt` - When section started
- `AttemptSection.endedAt` - When section completed

### Calculation:
```typescript
const timeSpent = submittedAt - startedAt; // Total time
const sectionTime = endedAt - startedAt;   // Per-section time
```

**Note**: Already implemented in database schema, no additional changes needed.

---

## 📁 Files Modified

### New Files:
1. ✅ `src/lib/ielts-listening-scoring.ts` - Scoring logic

### Modified Files:
1. ✅ `src/app/api/attempts/[attemptId]/submit/route.ts` - Server-side scoring
2. ✅ `src/app/api/attempts/[attemptId]/results/route.ts` - Part scores in teacher view
3. ✅ `src/app/attempts/[attemptId]/results/page.tsx` - UI for part breakdown

### Existing (No Changes Needed):
- ✅ `prisma/schema.prisma` - AttemptSection.rubric already exists
- ✅ `src/app/dashboard/student/results/[attemptId]/page.tsx` - Already minimal (summary only)
- ✅ Time tracking fields already in database

---

## ✅ Security Checklist

- [x] Answer keys NOT sent to student during exam
- [x] Answer keys NOT sent to student in results (summary only)
- [x] Scoring computed server-side (submit API)
- [x] Scoring verified server-side (cannot be tampered)
- [x] Student sees ONLY summary (correct/total, percentage)
- [x] Teacher sees full breakdown (questions, answers, part scores)
- [x] Permission checks in API (requireStudent, isTeacher)

---

## 🧪 Testing Checklist

### Student Flow:
- [ ] Submit IELTS Listening attempt (40 questions)
- [ ] See "Submitted successfully" message
- [ ] View results: See total score (30/40, 75%)
- [ ] Verify NO questions shown
- [ ] Verify NO correct answers shown
- [ ] Verify NO part breakdown shown

### Teacher Flow:
- [ ] View student results
- [ ] See total score + section scores
- [ ] See IELTS Listening part breakdown (P1-P4)
- [ ] Click section to view all 40 questions
- [ ] See student answers vs correct answers
- [ ] See per-question correctness (✓/✗)

### Scoring Accuracy:
- [ ] Part 1 (Q1-10) correctly scored
- [ ] Part 2 (Q11-20) correctly scored
- [ ] Part 3 (Q21-30) correctly scored
- [ ] Part 4 (Q31-40) correctly scored
- [ ] Total raw score = sum of all parts
- [ ] Rubric JSON saved correctly in database

---

## 📚 Summary

✅ **IELTS Listening Scoring**:
- 40 questions, 1 point each
- 4 parts (10 questions each)
- Server-side scoring with part breakdown
- Stored in `AttemptSection.rubric` JSON

✅ **Visibility**:
- Student: Summary only (total score)
- Teacher: Full breakdown (part scores, questions, answers)

✅ **Security**:
- Answer keys NEVER sent to student
- Scoring computed/verified server-side
- Permission checks enforced

✅ **Time Tracking**:
- Already implemented (startedAt, endedAt, submittedAt)

