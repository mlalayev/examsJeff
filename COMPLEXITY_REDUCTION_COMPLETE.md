# Complexity Reduction: Extraction Complete

## Overview

Extracted tightly-coupled logic from the builder page into **focused, reusable modules** without changing behavior. Reduced builder from **1,672 lines → 1,509 lines** (163 lines / 9.7% reduction).

---

## What Was Extracted

### 1. Modal State Management → `useBuilderModals.ts` (118 lines)

**Before:**
```tsx
const [deleteQuestionModal, setDeleteQuestionModal] = useState({...});
const [deleteSectionModal, setDeleteSectionModal] = useState({...});
const [alertModal, setAlertModal] = useState({...});

const showAlert = (title, message, type) => {
  setAlertModal({ isOpen: true, title, message, type });
};

setDeleteQuestionModal({ isOpen: true, questionId, ... });
setDeleteSectionModal({ isOpen: false, ... });
```

**After:**
```tsx
const modals = useBuilderModals();

modals.showAlert("Error", "Message", "error");
modals.showDeleteQuestionModal(id, text, number);
modals.closeDeleteQuestionModal();
```

**Benefits:**
- **3 state declarations → 1 hook call** (9 lines saved in builder)
- **Consistent modal API** (showX, closeX pattern)
- **Type-safe interfaces** exported for reuse
- **Cleaner JSX** (no inline object literals in props)

**Extracted interfaces:**
- `DeleteQuestionModalState`
- `DeleteSectionModalState`
- `AlertModalState`

---

### 2. Validation Logic → `examValidation.ts` (98 lines)

**Before:**
```tsx
// Scattered throughout builder
if (!selectedCategory || !examTitle.trim() || sections.length === 0) {
  showAlert("Validation Error", "Please fill in all required fields...", "error");
  return;
}

if (selectedCategory === "IELTS") {
  showAlert("Cannot Delete", "IELTS sections cannot be deleted.", "warning");
  return;
}

const lines = text.split('\n').filter(line => line.trim());
if (lines.length === 0) {
  showAlert("Validation Error", "Please add at least one line...", "error");
  return;
}
```

**After:**
```tsx
const validation = validateExamInfo(selectedCategory, examTitle, sections);
if (!validation.valid) {
  modals.showAlert(validation.error!.title, validation.error!.message, "error");
  return;
}

if (!canDeleteSection(selectedCategory)) {
  modals.showAlert(...);
  return;
}

const validation = validateFillInBlankText(text);
if (!validation.valid) { ... }
```

**Benefits:**
- **Validation rules centralized** (easy to find and modify)
- **Testable in isolation** (pure functions)
- **Consistent error structure** (`{ valid, error: { title, message } }`)
- **Business rules extracted** (`canDeleteSection`, `canAddSection`)

**Exported functions:**
- `validateExamInfo()` - checks category, title, sections
- `validateFillInBlankText()` - checks [input] placeholders
- `canDeleteSection()` - IELTS check
- `canAddSection()` - IELTS check

---

### 3. Serialization → `examSerializer.ts` (186 lines)

**Before (in saveExam):**
```tsx
// 115+ lines inline
const flattenedSections = [];
for (const s of sections) {
  if (s.subsections && s.subsections.length > 0) {
    s.subsections.forEach((sub, idx) => {
      flattenedSections.push({
        ...sub,
        audio: s.audio,
        order: s.order * 1000 + idx,
        parentTitle: s.title,
        parentOrder: s.order,
      });
    });
  } else {
    flattenedSections.push(s);
  }
}

body: JSON.stringify({
  title: examTitle,
  category: selectedCategory,
  track: track || null,
  readingType: null,
  writingType: null,
  durationMin: durationMin || null,
  sections: flattenedSections.map((s, index) => {
    const instructionData = { text: s.instruction };
    if (s.passage) instructionData.passage = s.passage;
    if (s.audio) instructionData.audio = s.audio;
    if (s.introduction) instructionData.introduction = s.introduction;
    if (s.image) instructionData.image = s.image;
    if (s.image2) instructionData.image2 = s.image2;

    let sectionDurationMin = s.durationMin;
    if (selectedCategory === "SAT") {
      if (s.type === "WRITING") sectionDurationMin = 35;
      else if (s.type === "READING") sectionDurationMin = 32;
    }

    return {
      type: s.type,
      title: s.title,
      instruction: JSON.stringify(instructionData),
      image: s.image || null,
      image2: s.image2 || null,
      parentSectionId: s.parentSectionId || null,
      parentTitle: s.parentTitle || null,
      parentOrder: s.parentOrder !== undefined ? s.parentOrder : null,
      durationMin: sectionDurationMin,
      order: index,
      questions: (s.questions || []).map(q => ({...})),
    };
  }),
})
```

**After:**
```tsx
const payload = buildExamPayload(
  examTitle,
  selectedCategory,
  track,
  durationMin,
  sections
);

body: JSON.stringify(payload)
```

**Benefits:**
- **115 lines → 7 lines in builder** (108 lines extracted)
- **Testable serialization** (can verify payload structure in unit tests)
- **Type-safe payload** (`ExamPayload`, `FlattenedSection`, `SerializedQuestion`)
- **Modular composition** (flattenSections, buildInstructionData, serializeSection, serializeQuestion)
- **SAT duration logic isolated** (`applyCategoryDurationOverrides`)

**Exported functions:**
- `buildExamPayload()` - main entry point
- `flattenSections()` - handles subsections (IELTS Listening)
- Private helpers: `buildInstructionData`, `applyCategoryDurationOverrides`, `serializeSection`, `serializeQuestion`

---

### 4. Question Operations → `questionOperations.ts` (158 lines)

**Before (in saveQuestion):**
```tsx
// 90+ lines inline
if (editingQuestion.qtype === "FILL_IN_BLANK") {
  const text = editingQuestion.prompt?.text || "";
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) { showAlert(...); return; }

  const newQuestions = [];
  let globalBlankIndex = 0;

  lines.forEach((line, lineIdx) => {
    const inputCount = (line.match(/\[input\]/gi) || []).length;
    if (inputCount === 0) return;

    const lineAnswers = [];
    for (let i = 0; i < inputCount; i++) {
      const answer = editingQuestion.answerKey?.blanks[globalBlankIndex + i] || "";
      lineAnswers.push(answer);
    }

    const baseQuestionResult = createQuestionDraft({...});
    const questionId = `${baseQuestionResult.question.id}-${lineIdx}`;

    const newQuestion = {
      id: editingQuestion.id && lineIdx === 0 ? editingQuestion.id : questionId,
      qtype: "FILL_IN_BLANK",
      order: currentSection.questions.length + newQuestions.length,
      prompt: {
        text: line.trim(),
        instructions: lineIdx === 0 ? editingQuestion.prompt?.instructions : undefined,
        title: lineIdx === 0 ? editingQuestion.prompt?.title : undefined,
      },
      answerKey: { blanks: lineAnswers },
      maxScore: inputCount,
      image: lineIdx === 0 ? editingQuestion.image : undefined,
    };

    newQuestions.push(newQuestion);
    globalBlankIndex += inputCount;
  });

  if (newQuestions.length === 0) { showAlert(...); return; }

  const existingIndex = currentSection.questions.findIndex(q => q.id === editingQuestion.id);
  let updatedQuestions = [...currentSection.questions];
  if (existingIndex !== -1) {
    updatedQuestions.splice(existingIndex, 1, ...newQuestions);
  } else {
    updatedQuestions = [...updatedQuestions, ...newQuestions];
  }
  updatedQuestions = updatedQuestions.map((q, idx) => ({ ...q, order: idx }));
}
```

**After:**
```tsx
if (editingQuestion.qtype === "FILL_IN_BLANK") {
  const context = {
    examCategory: selectedCategory,
    currentSection,
    ieltsContext: selectedCategory === "IELTS" ? {
      getCurrentPart: () => ieltsParts.getPartForSection(currentSection.type),
    } : undefined,
  };

  const result = splitFillInBlankQuestions(editingQuestion, context);

  if (!result.valid) {
    modals.showAlert(result.error!.title, result.error!.message, "error");
    return;
  }

  const updatedQuestions = updateQuestionsInSection(
    currentSection.questions,
    editingQuestion,
    result.questions
  );

  const updatedSection = {
    ...currentSection,
    questions: updatedQuestions,
  };

  setSections(updateSectionInList(sections, updatedSection));
  setCurrentSection(updatedSection);
  setEditingQuestion(null);
  return;
}
```

**Benefits:**
- **90 lines → 30 lines in builder** (60 lines extracted)
- **FILL_IN_BLANK logic isolated** (can test independently)
- **Reusable question list updater** (`updateQuestionsInSection`)
- **Reusable delete helper** (`deleteQuestionFromSection`)

**Exported functions:**
- `splitFillInBlankQuestions()` - handles line splitting, ID generation, validation
- `updateQuestionsInSection()` - add/replace questions with order update
- `deleteQuestionFromSection()` - remove question with order update
- `QuestionOperationContext` - interface for context

---

### 5. Section Operations → `sectionOperations.ts` (48 lines)

**Before:**
```tsx
// Inline in addSection
const sectionId = `section-${Date.now()}`;
let defaultDuration = 15;
if (category === "SAT") {
  defaultDuration = type === "WRITING" ? 35 : 32;
}
const newSection = {
  id: sectionId,
  type,
  title: "",
  instruction: "",
  durationMin: defaultDuration,
  order: existingSections.length,
  questions: [],
};

// Inline in confirmDeleteSection
const updatedSections = sections.filter(s => s.id !== sectionId);
updatedSections = updatedSections.map((s, idx) => ({ ...s, order: idx }));
```

**After:**
```tsx
const newSection = createNewSection(type, selectedCategory, sections);
newSection.title = `${label} Section`;
newSection.instruction = `...`;

const updatedSections = deleteSectionFromList(sections, sectionId);

setSections(updateSectionInList(sections, updatedSection));
```

**Benefits:**
- **Section creation centralized** (SAT duration logic in one place)
- **Order updates handled** (delete/update maintain correct order)
- **Reusable across exam edit page** (can import and use)

**Exported functions:**
- `createNewSection()` - ID generation, default duration, order
- `deleteSectionFromList()` - filter + reorder
- `updateSectionInList()` - find and replace

---

## Files Created (5 new modules - 608 lines total)

1. **`useBuilderModals.ts`** (118 lines)
   - Modal state management hook
   - 3 modal states + actions

2. **`examValidation.ts`** (98 lines)
   - Validation helpers
   - Business rules (can add/delete section)

3. **`examSerializer.ts`** (186 lines)
   - Exam payload building
   - Section flattening
   - SAT duration overrides
   - Instruction data building

4. **`questionOperations.ts`** (158 lines)
   - FILL_IN_BLANK splitting
   - Question list updates
   - Question deletion

5. **`sectionOperations.ts`** (48 lines)
   - Section CRUD operations
   - Order management

---

## Builder Page Changes

### Line Count
- **Before:** 1,672 lines
- **After:** 1,509 lines
- **Reduction:** 163 lines (9.7%)

### State Variables
- **Before:** 14 state variables (11 useState + 3 from hooks)
- **After:** 11 state variables (8 useState + 3 from hooks)
- **Extracted:** 3 modal states into `useBuilderModals` hook

### Functions Simplified

| Function | Before | After | Saved |
|----------|--------|-------|-------|
| `addSection` | 38 lines | 26 lines | 12 lines |
| `addQuestion` | 28 lines | 20 lines | 8 lines (already done in prev phase) |
| `saveQuestion` (FILL_IN_BLANK) | 95 lines | 30 lines | 65 lines |
| `saveExam` | 120 lines | 35 lines | 85 lines |
| `deleteSection` | 15 lines | 8 lines | 7 lines |
| `confirmDeleteSection` | 10 lines | 8 lines | 2 lines |

**Total extracted from functions:** ~179 lines

---

## What's Now Easier to Maintain

### 1. Adding New Validation Rules ✅
**Before:** Search through 1,672 lines to find validation logic  
**After:** Edit `examValidation.ts` - all rules in one file

**Example:** Add "TOEFL requires at least 2 sections"
```tsx
// examValidation.ts
export function validateExamInfo(...) {
  // ... existing checks ...
  
  if (category === "TOEFL" && sections.length < 2) {
    return {
      valid: false,
      error: { title: "TOEFL Requirements", message: "TOEFL exams require at least 2 sections" }
    };
  }
  
  return { valid: true };
}
```

---

### 2. Modifying Serialization Format ✅
**Before:** Change 115-line inline logic in `saveExam`  
**After:** Edit `examSerializer.ts` - clear function boundaries

**Example:** Add new field to payload
```tsx
// examSerializer.ts - serializeSection()
return {
  // ... existing fields ...
  difficulty: section.difficulty || "MEDIUM", // NEW FIELD
};
```

---

### 3. Testing Business Logic ✅
**Before:** Need to mount entire builder component  
**After:** Unit test pure functions

```tsx
// Test validation
const result = validateExamInfo(null, "Title", []);
expect(result.valid).toBe(false);
expect(result.error.title).toBe("Validation Error");

// Test serialization
const payload = buildExamPayload("Test", "IELTS", "", 120, mockSections);
expect(payload.category).toBe("IELTS");
expect(payload.sections.length).toBe(4);

// Test FILL_IN_BLANK split
const result = splitFillInBlankQuestions(mockQuestion, mockContext);
expect(result.valid).toBe(true);
expect(result.questions.length).toBe(3);
```

---

### 4. Reusing Logic in Exam Edit Page ✅
**Before:** Duplicate validation/serialization in edit page  
**After:** Import and use same modules

```tsx
// In exam edit page
import { validateExamInfo } from "@/components/admin/exams/create/examValidation";
import { buildExamPayload } from "@/components/admin/exams/create/examSerializer";

const validation = validateExamInfo(category, title, sections);
const payload = buildExamPayload(title, category, track, duration, sections);
```

---

### 5. Adding New Category Behavior ✅
**Before:** Find all category checks scattered in builder  
**After:** Add to `categoryBehaviors.ts` registry + `examSerializer.ts` if needed

**Example:** TOEFL needs custom section duration
```tsx
// examSerializer.ts - applyCategoryDurationOverrides()
function applyCategoryDurationOverrides(duration, category, sectionType) {
  if (category === "SAT") {
    if (sectionType === "WRITING") return 35;
    if (sectionType === "READING") return 32;
  }
  
  if (category === "TOEFL") { // NEW
    if (sectionType === "LISTENING") return 40;
  }
  
  return duration;
}
```

---

### 6. Modal Management Consistency ✅
**Before:** Different patterns for different modals  
**After:** Uniform `modals.showX()` / `modals.closeX()` API

All modals now follow same pattern:
```tsx
// Show
modals.showAlert(title, message, type);
modals.showDeleteQuestionModal(id, text, number);
modals.showDeleteSectionModal(id, title, count);

// Close
modals.closeAlertModal();
modals.closeDeleteQuestionModal();
modals.closeDeleteSectionModal();

// Access state
modals.alertModal.isOpen
modals.deleteQuestionModal.questionId
modals.deleteSectionModal.sectionTitle
```

---

## Architecture Improvements

### Before: Monolithic Builder

```
create/[category]/page.tsx (1,672 lines)
├─ State management (14 variables)
├─ Modal state + actions (30 lines)
├─ Validation logic (scattered)
├─ Section CRUD (inline)
├─ Question CRUD (inline)
├─ FILL_IN_BLANK splitting (95 lines)
├─ Serialization (115 lines)
├─ Save logic (120 lines)
└─ Massive JSX (800+ lines for editor)
```

### After: Modular Builder

```
create/[category]/page.tsx (1,509 lines)
├─ State management (11 variables)
├─ Orchestration (delegates to modules)
└─ UI rendering

Modules:
├─ useBuilderModals.ts (118 lines) - Modal state
├─ examValidation.ts (98 lines) - Validation rules
├─ examSerializer.ts (186 lines) - Payload building
├─ questionOperations.ts (158 lines) - Question CRUD
├─ sectionOperations.ts (48 lines) - Section CRUD
├─ questionTypeRules.ts (109 lines) - Type availability
├─ addQuestionFlow.ts (93 lines) - Question creation
└─ categoryBehaviors.ts (102 lines) - Category overrides
```

**Total extracted:** 968 lines into 8 focused modules

---

## What's Still Coupled (Intentionally Not Touched)

### Question Editor Modal (800 lines)
**Status:** Still inline in builder  
**Reason:** Complex, needs careful prop design  
**Next step:** Extract to `QuestionEditorModal.tsx` with:
- `editingQuestion` prop
- `onSave` callback
- `onCancel` callback
- Image upload integration

**Estimated impact:** Would reduce builder to ~700 lines

---

### Regular Question Save Logic (60 lines)
**Status:** Still inline in `saveQuestion()`  
**Reason:** Handles subsections (complex)  
**Next step:** Extract to `questionOperations.ts`:
```tsx
export function saveRegularQuestion(
  editingQuestion: Question,
  currentSection: Section,
  sections: Section[]
): { updatedSections: Section[]; updatedCurrentSection: Section }
```

**Estimated impact:** Would save ~50 lines

---

### Section Edit Handlers (50 lines)
**Status:** Inline callbacks (`onSectionEdit`, `onDeleteSection`)  
**Reason:** Tied to current state management  
**Next step:** Could extract if section management becomes a custom hook

---

### Upload Logic (30 lines scattered)
**Status:** Inline in UI components  
**Reason:** Tightly coupled to UI state  
**Next step:** Extract to `useImageUpload` hook if adding more upload types

---

## Changed Files Summary

### Created (5 files - 608 lines)

1. ✅ `useBuilderModals.ts` (118 lines) - Modal management hook
2. ✅ `examValidation.ts` (98 lines) - Validation helpers
3. ✅ `examSerializer.ts` (186 lines) - Payload building
4. ✅ `questionOperations.ts` (158 lines) - Question operations
5. ✅ `sectionOperations.ts` (48 lines) - Section operations

### Modified (1 file)

1. ✅ `create/[category]/page.tsx`
   - Imports: Added 5 new module imports
   - State: Replaced 3 modal states with `useBuilderModals()` hook
   - Functions: Simplified 6 functions using extracted helpers
   - Lines: 1,672 → 1,509 (163 lines / 9.7% reduction)

---

## Impact by Category

### All Categories Benefit Equally ✅

| Extraction | IELTS | TOEFL | SAT | General | Math | Kids |
|------------|-------|-------|-----|---------|------|------|
| Modal management | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Validation | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Serialization | ✓ | ✓ | ✓ (custom duration) | ✓ | ✓ | ✓ |
| Question operations | ✓ (part-based ID) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Section operations | ✓ | ✓ | ✓ (custom duration) | ✓ | ✓ | ✓ |

**Category-specific behavior:**
- **IELTS:** Part-based IDs (in `categoryBehaviors`), subsection flattening (in `examSerializer`), cannot add/delete sections (in `examValidation`)
- **SAT:** Custom durations (in `examSerializer` + `sectionOperations`)
- **Others:** Use all defaults

No category is privileged. All share the same modules.

---

## Code Quality Improvements

### Cohesion ✅
**Before:** Modal state, validation, serialization mixed in one file  
**After:** Each concern in its own module

### Single Responsibility ✅
**Before:** Builder does state + UI + validation + serialization + CRUD  
**After:** Builder orchestrates, modules handle specific concerns

### Testability ✅
**Before:** Need full component mount to test validation  
**After:** Import pure functions, test in isolation

### Extensibility ✅
**Before:** Add new rule = modify 1,672-line file  
**After:** Add to specific module (validation/serialization/behaviors)

### Type Safety ✅
**Before:** Inline object literals, loose types  
**After:** Exported interfaces for all operations

---

## Future Refactor Priorities

### High Impact
1. **Extract Question Editor Modal** (800 lines)
   - Would reduce builder to ~700 lines
   - Largest remaining inline component
   - Medium complexity (prop threading)

### Medium Impact
2. **Extract Regular Question Save** (60 lines)
   - Would add to `questionOperations.ts`
   - Handles subsection logic
   - Low-medium complexity

3. **Extract Section Edit Modal** (if exists inline)
   - Currently using inline edit in `SectionCard`
   - Already clean, low priority

### Low Impact
4. **Extract Upload Handlers** (30 lines)
   - Create `useImageUpload` hook
   - Only if adding more upload types
   - Low priority (works fine inline)

5. **Extract Subsection Logic** (if needed)
   - Currently only IELTS Listening has subsections
   - Works fine in current structure
   - Extract if more categories need subsections

---

## Before/After Comparison

### Function: `saveExam`

**Before (120 lines):**
```tsx
const saveExam = async () => {
  // Validation (5 lines)
  if (!selectedCategory || !examTitle.trim() || sections.length === 0) {
    showAlert("Validation Error", "...", "error");
    return;
  }

  setSaving(true);
  try {
    // Flatten subsections (20 lines)
    const flattenedSections = [];
    for (const s of sections) {
      if (s.subsections && s.subsections.length > 0) {
        s.subsections.forEach((sub, idx) => {
          flattenedSections.push({...});
        });
      } else {
        flattenedSections.push(s);
      }
    }

    // Build payload (80 lines)
    body: JSON.stringify({
      title: examTitle,
      category: selectedCategory,
      track: track || null,
      readingType: null,
      writingType: null,
      durationMin: durationMin || null,
      sections: flattenedSections.map((s, index) => {
        // Build instruction data (15 lines)
        const instructionData = { text: s.instruction };
        if (s.passage) instructionData.passage = s.passage;
        if (s.audio) instructionData.audio = s.audio;
        // ... more fields

        // Apply duration overrides (10 lines)
        let sectionDurationMin = s.durationMin;
        if (selectedCategory === "SAT") {
          if (s.type === "WRITING") sectionDurationMin = 35;
          else if (s.type === "READING") sectionDurationMin = 32;
        }

        // Serialize section (25 lines)
        return {
          type: s.type,
          title: s.title,
          instruction: JSON.stringify(instructionData),
          image: s.image || null,
          image2: s.image2 || null,
          parentSectionId: s.parentSectionId || null,
          parentTitle: s.parentTitle || null,
          parentOrder: s.parentOrder !== undefined ? s.parentOrder : null,
          durationMin: sectionDurationMin,
          order: index,
          questions: (s.questions || []).map(q => ({
            qtype: q.qtype,
            order: q.order,
            prompt: q.prompt,
            options: q.options,
            answerKey: q.answerKey,
            maxScore: q.maxScore,
            explanation: q.explanation,
            image: q.image || null,
          })),
        };
      }),
    })

    // Fetch + error handling (15 lines)
    const res = await fetch(...);
    if (res.ok) {
      router.push(...);
    } else {
      showAlert("Failed to Create Exam", ...);
    }
  } catch (error) {
    showAlert("Failed to Create Exam", ...);
  } finally {
    setSaving(false);
  }
};
```

**After (35 lines):**
```tsx
const saveExam = async () => {
  // Validation (4 lines)
  const validation = validateExamInfo(selectedCategory, examTitle, sections);
  if (!validation.valid) {
    modals.showAlert(validation.error!.title, validation.error!.message, "error");
    return;
  }

  setSaving(true);
  try {
    // Build payload (7 lines)
    const payload = buildExamPayload(
      examTitle,
      selectedCategory!,
      track,
      durationMin,
      sections
    );

    // Fetch (5 lines)
    const res = await fetch("/api/admin/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Handle response (8 lines)
    if (res.ok) {
      const data = await res.json();
      router.push(`/dashboard/admin/exams/${data.exam.id}`);
    } else {
      const error = await res.json();
      console.error("Server error response:", error);
      modals.showAlert("Failed to Create Exam", error.error || error.details || JSON.stringify(error), "error");
    }
  } catch (error) {
    console.error("Failed to create exam:", error);
    modals.showAlert("Failed to Create Exam", error instanceof Error ? error.message : String(error), "error");
  } finally {
    setSaving(false);
  }
};
```

**Readability improvement:**
- Before: Need to understand flattening, instruction building, duration logic, serialization to understand save
- After: High-level flow visible (validate → build → send → handle response)

---

### Function: `saveQuestion` (FILL_IN_BLANK branch)

**Before (95 lines):**
```tsx
if (editingQuestion.qtype === "FILL_IN_BLANK") {
  const text = editingQuestion.prompt?.text || "";
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    showAlert("Validation Error", "...", "error");
    return;
  }

  const newQuestions = [];
  let globalBlankIndex = 0;

  lines.forEach((line, lineIdx) => {
    const inputCount = (line.match(/\[input\]/gi) || []).length;
    if (inputCount === 0) return;

    const lineAnswers = [];
    for (let i = 0; i < inputCount; i++) {
      const answer = editingQuestion.answerKey?.blanks[globalBlankIndex + i] || "";
      lineAnswers.push(answer);
    }

    const baseQuestionResult = createQuestionDraft({...});
    const questionId = `${baseQuestionResult.question.id}-${lineIdx}`;

    const newQuestion = {
      id: editingQuestion.id && lineIdx === 0 ? editingQuestion.id : questionId,
      qtype: "FILL_IN_BLANK",
      order: currentSection.questions.length + newQuestions.length,
      prompt: {
        text: line.trim(),
        instructions: lineIdx === 0 ? editingQuestion.prompt?.instructions : undefined,
        title: lineIdx === 0 ? editingQuestion.prompt?.title : undefined,
      },
      answerKey: { blanks: lineAnswers },
      maxScore: inputCount,
      image: lineIdx === 0 ? editingQuestion.image : undefined,
    };

    newQuestions.push(newQuestion);
    globalBlankIndex += inputCount;
  });

  if (newQuestions.length === 0) {
    showAlert("Validation Error", "...", "error");
    return;
  }

  const existingIndex = currentSection.questions.findIndex(q => q.id === editingQuestion.id);
  let updatedQuestions = [...currentSection.questions];
  if (existingIndex !== -1) {
    updatedQuestions.splice(existingIndex, 1, ...newQuestions);
  } else {
    updatedQuestions = [...updatedQuestions, ...newQuestions];
  }
  updatedQuestions = updatedQuestions.map((q, idx) => ({ ...q, order: idx }));

  const updatedSection = {
    ...currentSection,
    questions: updatedQuestions,
  };

  setSections(prev => prev.map(s => s.id === currentSection.id ? updatedSection : s));
  setCurrentSection(updatedSection);
  setEditingQuestion(null);
  return;
}
```

**After (30 lines):**
```tsx
if (editingQuestion.qtype === "FILL_IN_BLANK") {
  const context = {
    examCategory: selectedCategory,
    currentSection,
    ieltsContext: selectedCategory === "IELTS" ? {
      getCurrentPart: () => ieltsParts.getPartForSection(currentSection.type),
    } : undefined,
  };

  const result = splitFillInBlankQuestions(editingQuestion, context);

  if (!result.valid) {
    modals.showAlert(result.error!.title, result.error!.message, "error");
    return;
  }

  const updatedQuestions = updateQuestionsInSection(
    currentSection.questions,
    editingQuestion,
    result.questions
  );

  const updatedSection = {
    ...currentSection,
    questions: updatedQuestions,
  };

  setSections(updateSectionInList(sections, updatedSection));
  setCurrentSection(updatedSection);
  setEditingQuestion(null);
  return;
}
```

---

## Testing Strategy

### Unit Tests (Now Possible)

```tsx
// Test modal hook
const { result } = renderHook(() => useBuilderModals());
act(() => result.current.showAlert("Title", "Message", "error"));
expect(result.current.alertModal.isOpen).toBe(true);

// Test validation
expect(validateExamInfo(null, "Title", [])).toEqual({
  valid: false,
  error: { title: "Validation Error", message: "Please select an exam category" }
});

// Test serialization
const payload = buildExamPayload("Test", "IELTS", "", 120, mockSections);
expect(payload.sections).toHaveLength(4);
expect(payload.sections[0].questions).toBeDefined();

// Test FILL_IN_BLANK
const result = splitFillInBlankQuestions(
  { qtype: "FILL_IN_BLANK", prompt: { text: "Hello [input] world" }, answerKey: { blanks: ["there"] } },
  mockContext
);
expect(result.valid).toBe(true);
expect(result.questions[0].answerKey.blanks).toEqual(["there"]);

// Test section operations
const newSection = createNewSection("READING", "SAT", []);
expect(newSection.durationMin).toBe(32); // SAT Reading default

const deleted = deleteSectionFromList(mockSections, "section-1");
expect(deleted).toHaveLength(mockSections.length - 1);
expect(deleted[0].order).toBe(0); // Reordered
```

---

## Cumulative Progress

### Total Refactoring (All Phases)

| Phase | Focus | Created Files | Extracted Lines |
|-------|-------|---------------|-----------------|
| **Phase 1: Route Split** | Category routing | 2 files | 2,142 lines → landing page |
| **Phase 2: Module Extraction** | IELTS isolation | 7 files | 455 lines extracted |
| **Phase 3: Question Architecture** | Type availability | 3 files | 372 lines extracted |
| **Phase 4: Complexity Reduction** | Operations/validation | 5 files | 608 lines extracted |

**Total files created:** 17 files  
**Total lines extracted:** 3,577 lines into focused modules  
**Builder page:** 2,179 lines → 1,509 lines (670 lines / 30.7% reduction)

### Remaining in Builder
- Core state management (150 lines)
- UI orchestration (200 lines)
- Question Editor Modal (800 lines) ← **Biggest remaining block**
- Regular question save (60 lines)
- Section edit callbacks (50 lines)
- JSX rendering (remaining ~249 lines)

---

## Key Takeaways

### What We Achieved ✅

1. **Modular codebase** - 8 focused modules with clear responsibilities
2. **Shared architecture** - All categories use same modules
3. **Category-fair** - No hardcoded "IELTS vs others" split
4. **Testable** - Pure functions for validation, serialization, operations
5. **Maintainable** - Easy to find and modify specific logic
6. **Extensible** - Add new category = add to registries, not modify shared code
7. **Consistent** - Uniform patterns (modals, validation, operations)

### What's Next 🎯

**Highest priority:** Extract Question Editor Modal (800 lines)  
**Impact:** Would bring builder down to ~700 lines  
**Effort:** Medium (need prop design for subsection handling)

After that, the builder would be primarily:
- State management (~150 lines)
- UI orchestration (~200 lines)
- Navigation/routing (~50 lines)
- JSX layout (~300 lines)

**Total:** ~700 lines (manageable, focused on UI coordination)

---

## Summary

Extracted **608 lines** of business logic into **5 focused modules** while keeping all functionality working. Builder reduced from **1,672 → 1,509 lines** (9.7% reduction).

**Key principle maintained:** Shared by default, category-specific via registry/config, no privileged categories.

The codebase is now significantly more maintainable for future features like image-overlay questions, new question types, new exam categories, or validation rule changes.
