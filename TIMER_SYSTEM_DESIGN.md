# ⏱️ Timer System Design

## 📊 İki Fərqli Timer Tipi

### Type 1: Section-Based Timer (IELTS, SAT, TOEFL)
**Xüsusiyyətlər:**
- ✅ Hər section üçün **ayrı timer**
- ✅ Timer bitəndə section **lock** olur (read-only)
- ✅ Tələbə növbəti section-a keçməlidir
- ✅ Password modal (optional)

**Flow:**
```
Reading Section (60 min)
  ↓ Timer: 60:00 → 59:59 → ... → 0:00
  ↓ Timer bitdi!
  ✓ Section lock (read-only mode)
  ✓ Auto-navigate to next section
  
Listening Section (40 min)
  ↓ Timer: 40:00 → 39:59 → ... → 0:00
  ↓ Timer bitdi!
  ✓ Section lock
  ✓ Auto-navigate to next section
  
Writing Section (60 min)
  ↓ Timer: 60:00 → ... → 0:00
  ✓ All sections complete → Submit exam
```

---

### Type 2: Global Timer (GENERAL_ENGLISH, KIDS, MATH)
**Xüsusiyyətlər:**
- ✅ **Ümumi timer** (exam-level, exam.durationMin)
- ✅ Timer bitəndə **bütün imtahan auto-submit**
- ✅ Section yoxdur, bütün suallar bir səhifədə
- ❌ Password yoxdur

**Flow:**
```
Exam starts (60 min total)
  ↓ Timer: 60:00 → 59:59 → ... → 0:00
  ↓ Timer bitdi!
  ✓ Auto-save all answers
  ✓ Auto-submit exam
  ✓ Redirect to results
```

---

## 🎯 Exam Category → Timer Type Mapping

| Category         | Timer Type       | Lock Behavior              |
|------------------|------------------|----------------------------|
| IELTS            | Section-based    | Lock section when time up  |
| TOEFL            | Section-based    | Lock section when time up  |
| SAT              | Section-based    | Lock section when time up  |
| GENERAL_ENGLISH  | Global           | Submit exam when time up   |
| KIDS             | Global           | Submit exam when time up   |
| MATH             | Global           | Submit exam when time up   |

---

## 📐 Database Structure

### Exam Model
```prisma
model Exam {
  durationMin     Int?    // For GENERAL_ENGLISH, KIDS, MATH (global timer)
  sectionPassword String? // For IELTS, SAT, TOEFL (section password)
}
```

### ExamSection Model
```prisma
model ExamSection {
  durationMin Int // For IELTS, SAT, TOEFL (per-section timer)
}
```

**Logic:**
- If `exam.category` in `[IELTS, SAT, TOEFL]` → Use `section.durationMin` (section-based)
- Else → Use `exam.durationMin` (global timer)

---

## 🔧 Implementation Logic

### Helper Function:
```typescript
function isSectionBasedExam(category: string): boolean {
  return ['IELTS', 'SAT', 'TOEFL'].includes(category);
}

function getTimerMode(exam: Exam): 'section' | 'global' {
  return isSectionBasedExam(exam.category) ? 'section' : 'global';
}
```

### Exam Runner Logic:
```typescript
const timerMode = getTimerMode(exam);

if (timerMode === 'section') {
  // Section-based: Show tabs, per-section timer
  return <SectionBasedRunner />;
} else {
  // Global: Show all questions, global timer
  return <GlobalTimerRunner />;
}
```

---

## 🎨 UI Differences

### Section-Based (IELTS/SAT/TOEFL):
```
┌─────────────────────────────────────────────────┐
│  IELTS Practice Test                            │
├─────────────────────────────────────────────────┤
│  [Reading ⏱️ 60:00] [Listening 🔒] [Writing 🔒] │ ← Tabs
├─────────────────────────────────────────────────┤
│  Question 1 of 40                                │
│  [Reading passage...]                            │
│  [Answer...]                                     │
├─────────────────────────────────────────────────┤
│  [← Prev]  [Save]  [Next Section (Password) →]  │
└─────────────────────────────────────────────────┘

Timer: 60:00 → ... → 0:00
↓ Section locked (read-only)
↓ Auto-navigate to Listening tab
```

### Global (GENERAL_ENGLISH/KIDS/MATH):
```
┌─────────────────────────────────────────────────┐
│  General English A2 - Unit 1        ⏱️ 60:00   │ ← Global timer
├─────────────────────────────────────────────────┤
│  Question 1 of 20                                │
│  [Question...]                                   │
│  [Answer...]                                     │
├─────────────────────────────────────────────────┤
│  [← Prev]  [Save]  [Next →]                     │
└─────────────────────────────────────────────────┘

Timer: 60:00 → ... → 0:00
↓ Auto-save answers
↓ Auto-submit exam
↓ Redirect to /attempts/[id]/results
```

---

## ⏱️ Timer Behavior Details

### Section-Based Timer:
```typescript
// When section timer reaches 0:00
function onSectionTimeUp(currentSection: Section) {
  // 1. Lock current section (set to read-only)
  lockSection(currentSection.id);
  
  // 2. Save section answers
  await saveSectionAnswers(currentSection.id);
  
  // 3. Show modal
  showModal("Time's up! Moving to next section...");
  
  // 4. Navigate to next section (bypass password)
  navigateToNextSection();
}
```

### Global Timer:
```typescript
// When global timer reaches 0:00
function onGlobalTimeUp() {
  // 1. Save all answers
  await saveAllAnswers();
  
  // 2. Submit exam
  await submitExam();
  
  // 3. Show modal
  showModal("Time's up! Your exam has been submitted.");
  
  // 4. Redirect to results
  router.push(`/attempts/${attemptId}/results`);
}
```

---

## 🔐 Password Behavior

### Section-Based (IELTS/SAT/TOEFL):
- **Manual navigation:** Password required (if set)
- **Auto-navigation (time up):** Password bypassed

```typescript
function navigateToSection(nextSectionIndex: number, isAutoNavigation: boolean) {
  if (!isAutoNavigation && exam.sectionPassword) {
    // Show password modal
    showPasswordModal(nextSectionIndex);
  } else {
    // Direct navigation
    setCurrentSectionIndex(nextSectionIndex);
  }
}
```

### Global (GENERAL_ENGLISH/KIDS/MATH):
- **No sections** → No password needed
- **No manual section navigation**

---

## 📋 Implementation Checklist

### Phase 1: Database & Logic
- [✅] Add `sectionPassword` to Exam
- [ ] Add `timerMode` helper function
- [ ] Add `isSectionBasedExam()` helper

### Phase 2: Exam Create UI
- [ ] Add password field (for IELTS/SAT/TOEFL only)
- [ ] Hide password field for GENERAL_ENGLISH/KIDS/MATH
- [ ] Add global timer field (for GENERAL_ENGLISH/KIDS/MATH)

### Phase 3: Exam Runner Split
- [ ] Create `SectionBasedRunner` component (IELTS/SAT/TOEFL)
- [ ] Keep existing runner as `GlobalTimerRunner` (GENERAL_ENGLISH/KIDS/MATH)
- [ ] Add routing logic based on `timerMode`

### Phase 4: Section-Based Runner
- [ ] Section tabs UI
- [ ] Per-section timer
- [ ] Section lock on time up
- [ ] Password modal
- [ ] Auto-navigation

### Phase 5: Global Timer Enhancement
- [ ] Add global countdown timer
- [ ] Auto-save on time up
- [ ] Auto-submit on time up
- [ ] Redirect to results

---

## 🧪 Test Scenarios

### IELTS Exam:
1. Start Reading section (60 min timer)
2. Timer reaches 0:00
3. ✓ Section locks (read-only)
4. ✓ Auto-navigate to Listening
5. Try to manually go to Writing
6. ✓ Password modal appears
7. Enter correct password
8. ✓ Writing section unlocks

### General English Exam:
1. Start exam (60 min global timer)
2. Answer questions
3. Timer reaches 0:00
4. ✓ Answers auto-saved
5. ✓ Exam auto-submitted
6. ✓ Redirected to results

---

## 💡 Key Points

1. **Section-based exams:**
   - Multiple timers (one per section)
   - Lock section on time up
   - Password-protected navigation
   - Can't go back to locked sections

2. **Global timer exams:**
   - Single timer for whole exam
   - Auto-submit on time up
   - No sections, no password
   - All questions accessible anytime

3. **Backward compatibility:**
   - Existing exams without sections → Global timer
   - Existing exams with sections → Check category for mode

---

**Status:** 📋 Design Complete | Ready to Implement

