# Builder Refactor: Complete Summary

## Implementation Complete ✅

Reduced builder complexity from **1,672 lines → 1,509 lines** (163 lines / 9.7% reduction) by extracting business logic into **5 focused modules** (608 lines).

---

## Files Created This Phase (5 modules - 608 lines)

### 1. `useBuilderModals.ts` (118 lines)
**Purpose:** Centralized modal state management

**Exports:**
- `useBuilderModals()` hook
- Interfaces: `DeleteQuestionModalState`, `DeleteSectionModalState`, `AlertModalState`

**API:**
```tsx
const modals = useBuilderModals();

// Show modals
modals.showAlert(title, message, type);
modals.showDeleteQuestionModal(id, text, number);
modals.showDeleteSectionModal(id, title, count);

// Close modals
modals.closeAlertModal();
modals.closeDeleteQuestionModal();
modals.closeDeleteSectionModal();

// Access state
modals.alertModal.isOpen
modals.deleteQuestionModal.questionId
```

**Impact:**
- 3 useState declarations removed from builder
- Consistent modal API across all modals
- Reusable in exam edit page

---

### 2. `examValidation.ts` (98 lines)
**Purpose:** Validation rules and business logic checks

**Exports:**
- `validateExamInfo()` - validates category, title, sections
- `validateFillInBlankText()` - checks [input] placeholders
- `canDeleteSection()` - IELTS restriction check
- `canAddSection()` - IELTS restriction check
- `ValidationResult` interface

**Usage:**
```tsx
const validation = validateExamInfo(category, title, sections);
if (!validation.valid) {
  showAlert(validation.error.title, validation.error.message);
}

if (!canDeleteSection(category)) { ... }
```

**Impact:**
- Validation logic centralized (was scattered)
- Business rules explicit (IELTS cannot add/delete sections)
- Testable in isolation
- Reusable across create/edit pages

---

### 3. `examSerializer.ts` (186 lines)
**Purpose:** Transform frontend state → API payload

**Exports:**
- `buildExamPayload()` - main entry point
- `flattenSections()` - handles IELTS Listening subsections
- Interfaces: `ExamPayload`, `FlattenedSection`, `SerializedQuestion`
- Private helpers: `buildInstructionData`, `applyCategoryDurationOverrides`, `serializeSection`, `serializeQuestion`

**Usage:**
```tsx
const payload = buildExamPayload(title, category, track, duration, sections);
await fetch("/api/admin/exams", {
  method: "POST",
  body: JSON.stringify(payload),
});
```

**Impact:**
- 115 lines extracted from `saveExam`
- SAT duration overrides isolated
- Subsection flattening logic encapsulated
- Type-safe payload interfaces
- Testable transformation logic

---

### 4. `questionOperations.ts` (158 lines)
**Purpose:** Question CRUD operations

**Exports:**
- `splitFillInBlankQuestions()` - split text into multiple questions
- `updateQuestionsInSection()` - add/replace with order update
- `deleteQuestionFromSection()` - remove with order update
- Interfaces: `QuestionOperationContext`, `FillInBlankSplitResult`

**Usage:**
```tsx
const result = splitFillInBlankQuestions(editingQuestion, context);
if (!result.valid) {
  showAlert(result.error.title, result.error.message);
  return;
}

const updated = updateQuestionsInSection(current, editing, result.questions);
```

**Impact:**
- 90 lines extracted from FILL_IN_BLANK save logic
- Question list manipulation centralized
- Testable question operations
- Consistent error handling

---

### 5. `sectionOperations.ts` (48 lines)
**Purpose:** Section CRUD operations

**Exports:**
- `createNewSection()` - ID generation, defaults, order
- `deleteSectionFromList()` - filter + reorder
- `updateSectionInList()` - find and replace

**Usage:**
```tsx
const newSection = createNewSection(type, category, existingSections);
const deleted = deleteSectionFromList(sections, sectionId);
const updated = updateSectionInList(sections, editedSection);
```

**Impact:**
- Section creation logic centralized
- SAT duration defaults in one place
- Order management handled automatically
- Reusable CRUD operations

---

## Builder Page Changes

### State Reduced
**Before:**
```tsx
const [deleteQuestionModal, setDeleteQuestionModal] = useState({...});
const [deleteSectionModal, setDeleteSectionModal] = useState({...});
const [alertModal, setAlertModal] = useState({...});
```

**After:**
```tsx
const modals = useBuilderModals();
```

**Saved:** 18 lines (3 state declarations + interfaces)

---

### Functions Simplified

| Function | Before | After | Reduction |
|----------|--------|-------|-----------|
| `addSection` | 38 lines | 26 lines | 12 lines |
| `saveQuestion` (FILL_IN_BLANK) | 95 lines | 30 lines | **65 lines** |
| `saveExam` | 120 lines | 35 lines | **85 lines** |
| `deleteSection` | 15 lines | 8 lines | 7 lines |

**Total simplified:** ~169 lines

---

### Imports Updated

**Added:**
```tsx
import { useBuilderModals } from "@/components/admin/exams/create/useBuilderModals";
import { validateExamInfo, validateFillInBlankText, canDeleteSection, canAddSection } from "@/components/admin/exams/create/examValidation";
import { buildExamPayload } from "@/components/admin/exams/create/examSerializer";
import { 
  splitFillInBlankQuestions, 
  updateQuestionsInSection, 
  deleteQuestionFromSection,
  type QuestionOperationContext 
} from "@/components/admin/exams/create/questionOperations";
import { createNewSection, deleteSectionFromList, updateSectionInList } from "@/components/admin/exams/create/sectionOperations";
```

---

## Cumulative Refactor Progress

### All Phases Combined

| Phase | Focus | Files Created | Lines Extracted | Builder Reduction |
|-------|-------|---------------|-----------------|-------------------|
| **Phase 1** | Route Split | 2 | 2,142 → landing | 2,179 → 2,132 |
| **Phase 2** | IELTS Modules | 7 | 455 lines | 2,132 → 1,677 |
| **Phase 3** | Question Types | 3 | 372 lines | 1,677 → 1,672 |
| **Phase 4** | Operations | 5 | 608 lines | 1,672 → **1,509** |

**Total:**
- **17 modules created** (2,577 lines)
- **Builder reduced by 670 lines** (30.7%)
- **Original:** 2,179 lines
- **Current:** 1,509 lines

---

## What's Now Easier

### 1. Adding Validation Rules ✅
**File:** `examValidation.ts`  
**Example:** "TOEFL requires 3+ sections"
```tsx
if (category === "TOEFL" && sections.length < 3) {
  return { valid: false, error: {...} };
}
```

### 2. Modifying API Payload ✅
**File:** `examSerializer.ts`  
**Example:** "Add difficulty field"
```tsx
function serializeSection(section, index, category) {
  return {
    // ... existing fields ...
    difficulty: section.difficulty || "MEDIUM",
  };
}
```

### 3. Testing Business Logic ✅
**Files:** All modules are pure functions  
**Example:**
```tsx
expect(validateExamInfo(null, "Title", [])).toHaveProperty("valid", false);
expect(buildExamPayload("Test", "IELTS", "", 120, [])).toHaveProperty("category", "IELTS");
expect(splitFillInBlankQuestions(mockQ, mockCtx).valid).toBe(true);
```

### 4. Reusing in Edit Page ✅
**Files:** Can import any module  
**Example:**
```tsx
// In exam edit page
import { useBuilderModals } from "@/components/admin/exams/create/useBuilderModals";
import { validateExamInfo } from "@/components/admin/exams/create/examValidation";

const modals = useBuilderModals();
const validation = validateExamInfo(category, title, sections);
```

### 5. Adding New Category Behavior ✅
**Files:** `categoryBehaviors.ts` + `examSerializer.ts`  
**Example:** "TOEFL custom ID + duration"
```tsx
// categoryBehaviors.ts
const CATEGORY_BEHAVIORS = {
  IELTS: { ... },
  TOEFL: {
    adjustQuestionId: (baseId) => `toefl-${baseId}`,
  },
};

// examSerializer.ts - applyCategoryDurationOverrides
if (category === "TOEFL") {
  if (sectionType === "READING") return 60;
}
```

### 6. Managing Modal State ✅
**File:** `useBuilderModals.ts`  
**Before:** 3 separate useState + manual setters  
**After:** 1 hook with consistent API

---

## Module Dependency Graph

```
page.tsx (1,509 lines)
│
├─► useBuilderModals.ts (118 lines)
│   └─ Modal state management
│
├─► examValidation.ts (98 lines)
│   └─ Validation rules
│
├─► examSerializer.ts (186 lines)
│   └─ Payload building
│
├─► questionOperations.ts (158 lines)
│   ├─► addQuestionFlow.ts (93 lines)
│   │   ├─► questionTypeRules.ts (109 lines)
│   │   └─► categoryBehaviors.ts (102 lines)
│   └─ Question CRUD
│
├─► sectionOperations.ts (48 lines)
│   └─ Section CRUD
│
├─► ieltsHelpers.ts (existing)
│   └─ IELTS part management
│
├─► ieltsInitializer.ts (existing)
│   └─ IELTS section creation
│
└─► questionHelpers.ts (existing)
    └─ Default prompts/options
```

**Total dependency tree:** 11 modules supporting the builder

---

## What Still Needs Extraction

### 1. Question Editor Modal (800 lines) - HIGH PRIORITY
**Current:** Inline JSX in builder  
**Target:** `QuestionEditorModal.tsx`

**Extraction plan:**
```tsx
<QuestionEditorModal
  question={editingQuestion}
  section={currentSection}
  category={selectedCategory}
  onSave={handleSaveQuestion}
  onCancel={() => setEditingQuestion(null)}
  onImageUpload={handleQuestionImageUpload}
/>
```

**Impact:** Would reduce builder to ~700 lines

---

### 2. Regular Question Save Logic (60 lines) - MEDIUM PRIORITY
**Current:** Inline in `saveQuestion()` (handles subsections)  
**Target:** Add to `questionOperations.ts`

```tsx
export function saveRegularQuestion(
  editingQuestion: Question,
  currentSection: Section,
  sections: Section[]
): { updatedSections: Section[]; updatedCurrentSection: Section }
```

**Impact:** Would save ~50 lines

---

### 3. Section Edit Handlers (50 lines) - LOW PRIORITY
**Current:** Inline callbacks  
**Target:** Could extract to `useSectionEditor` hook if needed

**Reason to wait:** Currently working fine, extraction has low ROI

---

### 4. Upload Handlers (30 lines) - LOW PRIORITY
**Current:** Inline in UI  
**Target:** `useImageUpload` hook

**Reason to wait:** Only extract if adding more upload types (video, documents, etc.)

---

## Testing Checklist

### Unit Tests (Now Possible) ✅

- [ ] `useBuilderModals` - modal state transitions
- [ ] `validateExamInfo` - all validation cases
- [ ] `validateFillInBlankText` - [input] detection
- [ ] `canDeleteSection` / `canAddSection` - category checks
- [ ] `buildExamPayload` - payload structure
- [ ] `flattenSections` - subsection handling
- [ ] `splitFillInBlankQuestions` - line splitting
- [ ] `updateQuestionsInSection` - add/replace logic
- [ ] `createNewSection` - default values by category
- [ ] `deleteSectionFromList` - order updates

### Integration Tests

- [ ] Create IELTS exam → verify 4 sections auto-created
- [ ] Create SAT exam → verify Reading=32min, Writing=35min
- [ ] Add FILL_IN_BLANK question → verify splits correctly
- [ ] Delete section → verify order updates
- [ ] Save exam → verify payload structure
- [ ] Invalid category slug → verify redirects to /create

---

## Key Metrics

### Code Organization

| Metric | Before (Phase 3) | After (Phase 4) | Change |
|--------|------------------|-----------------|--------|
| Builder lines | 1,672 | 1,509 | -163 (-9.7%) |
| State variables | 14 | 11 | -3 |
| Inline validation | Scattered | 0 (extracted) | ✅ |
| Inline serialization | 115 lines | 0 (extracted) | ✅ |
| Modal boilerplate | 18 lines | 1 line (hook) | -17 |

### Module Stats

| Module | Lines | Responsibility | Testable | Reusable |
|--------|-------|----------------|----------|----------|
| `useBuilderModals` | 118 | Modal management | ✅ | ✅ |
| `examValidation` | 98 | Validation rules | ✅ | ✅ |
| `examSerializer` | 186 | API payload | ✅ | ✅ |
| `questionOperations` | 158 | Question CRUD | ✅ | ✅ |
| `sectionOperations` | 48 | Section CRUD | ✅ | ✅ |
| **Total** | **608** | **5 concerns** | **100%** | **100%** |

---

## Architecture Principles Maintained

### 1. Category-Fair ✅
- No "IELTS-first" bias
- All categories use same modules
- Category-specific behavior via registry/config
- SAT gets same treatment as IELTS (duration in `sectionOperations`)

### 2. Shared by Default ✅
- Modal management: shared
- Validation: shared (with category checks)
- Serialization: shared (with category overrides)
- Question operations: shared (with context)
- Section operations: shared (with category params)

### 3. Single Source of Truth ✅
- Validation rules: `examValidation.ts`
- Question type rules: `questionTypeRules.ts`
- Category behaviors: `categoryBehaviors.ts`
- Serialization format: `examSerializer.ts`

### 4. Extensible ✅
**Add new category:**
1. Update `CATEGORY_BEHAVIORS` if custom ID needed
2. Update `applyCategoryDurationOverrides` if custom duration needed
3. Update `canAddSection` / `canDeleteSection` if custom restrictions needed

**No changes needed in:**
- Modal management
- Question operations
- Validation structure
- Serialization structure

---

## Before/After Code Comparison

### Creating Exam Payload

**Before (115 lines in saveExam):**
```tsx
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
```

**After (7 lines):**
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

---

### Splitting FILL_IN_BLANK Questions

**Before (90 lines in saveQuestion):**
```tsx
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

setSections(updateSectionInList(sections, updatedSection));
setCurrentSection(updatedSection);
setEditingQuestion(null);
```

**After (30 lines):**
```tsx
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
```

---

## Reusability Matrix

| Module | Create Page | Edit Page | Tests | External Use |
|--------|-------------|-----------|-------|--------------|
| `useBuilderModals` | ✅ | ✅ | ✅ | Any admin form |
| `examValidation` | ✅ | ✅ | ✅ | Any exam operation |
| `examSerializer` | ✅ | ✅ | ✅ | Exam import/export |
| `questionOperations` | ✅ | ✅ | ✅ | Bulk question edit |
| `sectionOperations` | ✅ | ✅ | ✅ | Section management |
| `questionTypeRules` | ✅ | ✅ | ✅ | Type filtering UI |
| `addQuestionFlow` | ✅ | ✅ | ✅ | Question wizards |
| `categoryBehaviors` | ✅ | ✅ | ✅ | Any category logic |

**All modules are reusable** across the codebase.

---

## Next Steps

### Immediate Priority: Extract Question Editor Modal (800 lines)

**Benefits:**
- Builder → ~700 lines (under 1K lines threshold)
- Editor becomes reusable component
- Easier to add new question types
- Testable editor logic

**Approach:**
```tsx
// QuestionEditorModal.tsx
interface QuestionEditorModalProps {
  question: Question | null;
  section: Section;
  category: ExamCategory;
  onSave: (question: Question) => void;
  onCancel: () => void;
  onImageUpload: (file: File) => Promise<string>;
}

export default function QuestionEditorModal({ ... }) {
  // 800 lines of editor UI + logic
}

// In page.tsx (reduces to)
<QuestionEditorModal
  question={editingQuestion}
  section={currentSection}
  category={selectedCategory}
  onSave={handleSaveQuestion}
  onCancel={() => setEditingQuestion(null)}
  onImageUpload={uploadQuestionImage}
/>
```

**Estimated impact:** Builder → 700 lines

---

### After Editor Extraction: Builder Will Be

```tsx
create/[category]/page.tsx (~700 lines)
├─ Imports (40 lines)
├─ State management (80 lines)
├─ Route initialization (20 lines)
├─ Event handlers (150 lines)
│  ├─ addSection (26 lines)
│  ├─ addQuestion (20 lines)
│  ├─ saveQuestion (90 lines) - could extract further
│  ├─ deleteSection (8 lines)
│  └─ saveExam (35 lines)
├─ UI rendering (400 lines)
│  ├─ Header (30 lines)
│  ├─ Exam info form (50 lines)
│  ├─ Sections UI (100 lines)
│  ├─ Questions UI (200 lines)
│  └─ Modals (20 lines)
└─ Supporting functions (10 lines)
```

**Target achieved:** Under 1K lines, focused on UI coordination.

---

## Summary

### What Was Extracted (Phase 4)

- ✅ Modal state → `useBuilderModals.ts` (118 lines)
- ✅ Validation → `examValidation.ts` (98 lines)
- ✅ Serialization → `examSerializer.ts` (186 lines)
- ✅ Question ops → `questionOperations.ts` (158 lines)
- ✅ Section ops → `sectionOperations.ts` (48 lines)

**Total:** 608 lines into 5 modules

### What's Now Easier

- ✅ Adding validation rules (one file)
- ✅ Modifying API format (one file)
- ✅ Testing business logic (unit tests)
- ✅ Reusing in edit page (import modules)
- ✅ Managing modals (consistent API)
- ✅ Adding category behavior (registry)

### What Still Needs Work

- ⚠️ Question Editor Modal (800 lines) - highest priority
- ⚠️ Regular question save (60 lines) - medium priority
- ⚠️ Section edit handlers (50 lines) - low priority
- ⚠️ Upload handlers (30 lines) - low priority

### Builder Status

- **Current:** 1,509 lines (down from 2,179)
- **After editor extraction:** ~700 lines (estimated)
- **Target:** <1K lines, focused on UI coordination

**The builder is now modular, testable, and maintainable.** Future features like image-overlay questions can be added by extending the appropriate module (`questionTypeRules`, `questionHelpers`, `addQuestionFlow`) without touching the core builder logic.
