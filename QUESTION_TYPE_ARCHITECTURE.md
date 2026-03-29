# Question Type Architecture - Implementation Complete

## Overview

Implemented a **single source of truth** for question type availability with a **shared pipeline** that keeps `QuestionTypeModal` dumb and prevents drift between modal options and validation.

---

## The New Flow: Modal → Rules → AddQuestion

```
User clicks "Add Question"
        │
        ▼
┌───────────────────────────────────────┐
│ Builder computes context:             │
│ - examCategory                        │
│ - sectionType                         │
│ - ieltsContext (if IELTS)             │
└─────────────┬─────────────────────────┘
              │
              ▼
┌───────────────────────────────────────┐
│ getGroupedQuestionTypes(context)      │
│ ↓ calls getAllowedQuestionTypes()     │
│ ↓ applies restrictions                │
│ ↓ returns filtered groups             │
└─────────────┬─────────────────────────┘
              │
              ▼
┌───────────────────────────────────────┐
│ QuestionTypeModal                     │
│ - receives allowedGroups              │
│ - renders only allowed types          │
│ - user selects type                   │
│ - emits: onSelect(type)               │
└─────────────┬─────────────────────────┘
              │
              ▼
┌───────────────────────────────────────┐
│ Builder calls addQuestion(type)       │
└─────────────┬─────────────────────────┘
              │
              ▼
┌───────────────────────────────────────┐
│ createQuestionDraft(input)            │
│ ↓ 1. Validate via                     │
│      isQuestionTypeAllowed()          │
│      (SAME rules as modal)            │
│ ↓ 2. Generate ID via                  │
│      generateQuestionIdWithBehavior() │
│      (category registry)              │
│ ↓ 3. Get defaults from factories      │
│ ↓ 4. Apply category adjustments       │
│ ↓ 5. Return { question, valid }       │
└─────────────┬─────────────────────────┘
              │
              ▼
┌───────────────────────────────────────┐
│ Builder checks result.valid           │
│ - if invalid: show error              │
│ - if valid: setEditingQuestion()      │
└───────────────────────────────────────┘
```

**Key guarantee:** Modal and addQuestion use **the same `getAllowedQuestionTypes()` function** with **the same context**, so they can never drift.

---

## Files Created (3 new modules)

### 1. `questionTypeRules.ts` (109 lines)
**Responsibility:** Single source of truth for question type availability

**Exports:**
- `QuestionTypeContext` - interface for availability context
- `getAllowedQuestionTypes(context)` - core function, returns `QuestionType[]`
- `isQuestionTypeAllowed(context, type)` - validation helper (wraps getAllowedQuestionTypes)
- `getGroupedQuestionTypes(context)` - filters groups for modal display

**Rules defined:**
- **SPEAKING section:** Only SPEAKING_RECORDING, SHORT_TEXT, ESSAY
- **WRITING section:** Only ESSAY, SHORT_TEXT
- **SPEAKING_RECORDING type:** Only for IELTS Speaking sections
- **All other sections:** All types except context-restricted ones

**Why this design:**
- Data-driven restrictions (easy to add new rules)
- Context-specific types use predicate functions (flexible)
- Single function returns allowed list (no duplication)

---

### 2. `categoryBehaviors.ts` (102 lines)
**Responsibility:** Category-specific adjustments via registry pattern

**Exports:**
- `CategoryContext` - interface for category context
- `CategoryBehavior` - interface for behavior plugins
- `getCategoryBehavior(category)` - retrieves behavior or empty default
- `generateQuestionIdWithBehavior(context)` - ID generation with overrides
- `applyCategoryAdjustments(question, context)` - post-creation adjustments

**Registry:**
```tsx
const CATEGORY_BEHAVIORS = {
  IELTS: {
    adjustQuestionId: (baseId, ctx) => {
      // IELTS part prefix logic
      const part = ctx.ieltsContext.getCurrentPart();
      return ctx.sectionType === "WRITING" 
        ? `q-task${part}-timestamp` 
        : `q-part${part}-timestamp`;
    },
  },
  // Other categories: no behavior = default behavior
};
```

**Why this design:**
- **Extensible:** Add TOEFL behavior by adding to registry (no if/else in shared code)
- **Optional:** Categories without behavior get default implementation
- **Type-safe:** Interface enforces contract
- **Testable:** Each behavior is isolated function

---

### 3. `addQuestionFlow.ts` (93 lines)
**Responsibility:** Orchestrate question creation pipeline

**Exports:**
- `AddQuestionInput` - interface for input
- `AddQuestionResult` - interface for result (question + valid + error)
- `createQuestionDraft(input)` - **main pipeline function**

**Pipeline steps:**
1. **Validate:** `isQuestionTypeAllowed()` - fail fast if type not allowed
2. **Get defaults:** `getDefaultPrompt/Options/AnswerKey()` from factories
3. **Special handling:** ORDER_SENTENCE rawText (existing logic preserved)
4. **Generate ID:** `generateQuestionIdWithBehavior()` with category context
5. **Apply adjustments:** `applyCategoryAdjustments()` (currently no-op for all, but extensible)
6. **Return:** { question, valid: true } or { valid: false, error }

**Why this design:**
- **Single flow:** All categories go through same steps
- **Validation first:** Fast fail before expensive operations
- **Composition:** Each step is a function call (testable)
- **Extensibility:** New steps can be added without changing callers

---

## Files Modified (2 files)

### 1. `QuestionTypeModal.tsx`
**Changes:**
- Added optional prop: `allowedGroups?: Record<string, QuestionType[]>`
- Falls back to default groups if not provided (backward compatible)
- Renders only the types in allowedGroups

**Before:**
```tsx
<QuestionTypeModal 
  isOpen={...} 
  onClose={...} 
  onSelect={...} 
/>
// Always showed all types from QUESTION_TYPE_GROUPS constant
```

**After:**
```tsx
<QuestionTypeModal 
  isOpen={...} 
  onClose={...} 
  onSelect={...}
  allowedGroups={getGroupedQuestionTypes(context)} 
/>
// Shows only types allowed for current context
```

**Why this change:**
- Modal stays presentational (no business logic)
- Allows filtering without modal knowing category rules
- Backward compatible (allowedGroups is optional)

---

### 2. `create/[category]/page.tsx`
**Changes:**

**Imports added:**
- `getGroupedQuestionTypes`, `QuestionTypeContext` from `questionTypeRules`
- `createQuestionDraft` from `addQuestionFlow`

**Imports removed:**
- `getDefaultPrompt`, `getDefaultOptions`, `getDefaultAnswerKey` (now used internally by flow)
- `generateQuestionId` (replaced by behavior system)

**Function `addQuestion()` refactored:**

**Before** (28 lines):
```tsx
const addQuestion = (qtype) => {
  const defaultPrompt = getDefaultPrompt(qtype);
  if (ORDER_SENTENCE) defaultPrompt.rawText = ...;
  
  const currentPart = ... // IELTS branch
  const questionId = generateQuestionId(...); // IELTS branch inside
  
  const newQuestion = {
    id: questionId,
    qtype,
    order: ...,
    prompt: defaultPrompt,
    options: getDefaultOptions(qtype),
    answerKey: getDefaultAnswerKey(qtype),
    maxScore: 1,
  };
  
  setEditingQuestion(newQuestion);
  setShowQuestionTypeModal(false);
};
```

**After** (20 lines):
```tsx
const addQuestion = (qtype) => {
  if (!currentSection || !selectedCategory) return;

  const result = createQuestionDraft({
    questionType: qtype,
    examCategory: selectedCategory,
    sectionType: currentSection.type,
    currentSection,
    ieltsContext: selectedCategory === "IELTS" ? {
      getCurrentPart: () => ieltsParts.getPartForSection(...),
    } : undefined,
  });

  if (!result.valid) {
    showAlert("Invalid Question Type", result.error, "error");
    return;
  }

  setEditingQuestion(result.question);
  setShowQuestionTypeModal(false);
};
```

**FILL_IN_BLANK split logic:**
- Also uses `createQuestionDraft()` to generate IDs for each line
- Same context, same validation, same ID pattern

**Modal integration:**
- Passes `allowedGroups` computed from `getGroupedQuestionTypes(context)`
- Context built from current section + category + IELTS parts

---

## Architecture Guarantees

### 1. Modal and Validation Use Same Rules ✓
**Problem:** Modal shows types that addQuestion might reject

**Solution:**
- `getAllowedQuestionTypes()` is the **only** definition
- Modal filters groups via `getGroupedQuestionTypes()` → calls `getAllowedQuestionTypes()`
- `addQuestion` validates via `isQuestionTypeAllowed()` → calls `getAllowedQuestionTypes()`
- **Same input (context) → same output (allowed types)**

**Test this guarantee:**
```tsx
const context = { examCategory: "IELTS", sectionType: "SPEAKING", ieltsContext: { part: 1 } };
const modalTypes = getAllowedQuestionTypes(context);
const canAdd = isQuestionTypeAllowed(context, "MCQ_SINGLE");
// If "MCQ_SINGLE" in modalTypes, canAdd must be true
// If canAdd is false, "MCQ_SINGLE" must not be in modalTypes
```

---

### 2. Category Behaviors Are Isolated ✓
**Problem:** IELTS logic scattered everywhere

**Solution:**
- `categoryBehaviors.ts` registry with **behavior objects**
- IELTS has `adjustQuestionId` implementation
- Other categories: no entry = default behavior
- Shared code calls `getCategoryBehavior()` → runs behavior if exists → returns default otherwise

**To add TOEFL custom ID:**
```tsx
const CATEGORY_BEHAVIORS = {
  IELTS: { ... },
  TOEFL: {
    adjustQuestionId: (baseId, ctx) => {
      // TOEFL-specific ID pattern
      return `toefl-${baseId}`;
    },
  },
};
```

---

### 3. Question Creation is One Pipeline ✓
**Problem:** Duplicated logic in addQuestion and FILL_IN_BLANK split

**Solution:**
- `createQuestionDraft()` is the **only** way to create questions
- Takes context, returns result
- Validation → factories → ID → adjustments
- Both regular add and FILL_IN_BLANK split call the **same function**

---

### 4. Modal Stays Dumb ✓
**Problem:** Modal might need category knowledge

**Solution:**
- Modal receives **pre-filtered groups** as prop
- Modal doesn't know about categories, sections, IELTS, parts
- Modal just renders `allowedGroups` and emits `onSelect`
- **Zero business logic in modal**

---

## What's Shared vs Category-Specific

### Shared (Works for All Categories)

| Module | What It Does |
|--------|--------------|
| `questionTypeRules.ts` | Determines allowed types (uses context) |
| `addQuestionFlow.ts` | Orchestrates creation pipeline |
| `QuestionTypeModal.tsx` | Renders filtered types |
| `questionHelpers.ts` | Default prompts/options/answers (unchanged) |
| `QuestionsList.tsx` | Displays questions (handles IELTS + generic) |

### Category-Specific (Pluggable Behaviors)

| Category | Custom Behavior | Implementation |
|----------|----------------|----------------|
| **IELTS** | Part-based IDs | `categoryBehaviors.ts` → `ieltsBehavior.adjustQuestionId` |
| **TOEFL** | None (uses defaults) | No entry in registry |
| **SAT** | None (uses defaults) | No entry in registry |
| **GENERAL_ENGLISH** | None (uses defaults) | No entry in registry |
| **MATH** | None (uses defaults) | No entry in registry |
| **KIDS** | None (uses defaults) | No entry in registry |

### Context-Specific Rules

| Rule | Applies To | Implementation |
|------|------------|----------------|
| SPEAKING_RECORDING only for IELTS Speaking | IELTS + SPEAKING | `questionTypeRules.ts` → `CONTEXT_SPECIFIC_TYPES` |
| Writing section: only Essay/Short Text | All categories | `questionTypeRules.ts` → `QUESTION_TYPE_RESTRICTIONS` |
| Speaking section: limited types | All categories | `questionTypeRules.ts` → `QUESTION_TYPE_RESTRICTIONS` |

---

## How to Extend

### Add a New Question Type Restriction

**Example:** "DND_GAP only for KIDS category"

```tsx
// In questionTypeRules.ts
const CONTEXT_SPECIFIC_TYPES = {
  SPEAKING_RECORDING: (ctx) => ctx.examCategory === "IELTS" && ctx.sectionType === "SPEAKING",
  DND_GAP: (ctx) => ctx.examCategory === "KIDS", // NEW RULE
};
```

**That's it.** Modal and validation automatically respect it.

---

### Add Category-Specific ID Pattern

**Example:** "TOEFL questions should have `toefl-` prefix"

```tsx
// In categoryBehaviors.ts
const CATEGORY_BEHAVIORS = {
  IELTS: ieltsBehavior,
  TOEFL: { // NEW
    adjustQuestionId: (baseId, context) => {
      return `toefl-${baseId}`;
    },
  },
};
```

**That's it.** Pipeline automatically calls it for TOEFL exams.

---

### Add Category-Specific Question Adjustment

**Example:** "SAT questions default to maxScore: 2"

```tsx
// In categoryBehaviors.ts
const CATEGORY_BEHAVIORS = {
  IELTS: ieltsBehavior,
  SAT: { // NEW
    adjustQuestion: (question, context) => {
      return { ...question, maxScore: 2 };
    },
  },
};
```

**That's it.** Pipeline automatically applies it after creation.

---

## Files Changed Summary

### Created (3 files - 304 lines total)

1. **`questionTypeRules.ts`** (109 lines)
   - `getAllowedQuestionTypes()` - core rules engine
   - `isQuestionTypeAllowed()` - validation wrapper
   - `getGroupedQuestionTypes()` - modal filter helper

2. **`categoryBehaviors.ts`** (102 lines)
   - Category behavior registry
   - IELTS behavior implementation
   - Generic behavior (default)
   - ID generation with behaviors
   - Question adjustment hook

3. **`addQuestionFlow.ts`** (93 lines)
   - `createQuestionDraft()` - single pipeline
   - Input/result interfaces
   - 5-step orchestration

### Modified (2 files)

1. **`QuestionTypeModal.tsx`**
   - Added `allowedGroups` optional prop
   - Backward compatible (defaults to all types)
   - **Still dumb** - no business logic added

2. **`create/[category]/page.tsx`**
   - `addQuestion()` - now calls `createQuestionDraft()`
   - FILL_IN_BLANK split - uses `createQuestionDraft()` for IDs
   - Modal integration - passes `allowedGroups` from rules
   - Removed direct calls to questionHelpers (now internal to flow)

**Line count:**
- Before: 1,677 lines
- After: 1,672 lines (5 lines saved - removed duplicate state + cleaner addQuestion)

---

## What's No Longer Duplicated

### Before
- Modal had hardcoded `QUESTION_TYPE_GROUPS`
- `addQuestion` had inline default fetching
- FILL_IN_BLANK had separate ID generation logic
- No validation that modal and addQuestion agree

### After
- Modal receives **filtered groups from rules**
- `addQuestion` calls **single pipeline**
- FILL_IN_BLANK calls **same pipeline**
- **Validation guaranteed** (same function, same context)

---

## What's Still Coupled

### Question Editor Modal (800 lines)
**Status:** Still inline in page
**Why:** Not addressed in this phase
**Next step:** Extract to `QuestionEditorModal.tsx`

### Question Save Logic (120 lines)
**Status:** Still inline in `saveQuestion()`
**Why:** Not addressed in this phase
**Next step:** Extract to `questionOperations.ts`

### Exam Serialization (115 lines)
**Status:** Still inline in `saveExam()`
**Why:** Not addressed in this phase
**Next step:** Extract to `examSerializer.ts`

**These were intentionally not touched** to keep changes focused and incremental.

---

## Technical Debt Addressed

### ✅ Modal Drift Prevention
**Before:** Modal and addQuestion had separate type lists  
**After:** Both use `getAllowedQuestionTypes()` - **impossible to drift**

### ✅ Question ID Generation
**Before:** Inline logic with category checks in 2+ places  
**After:** Registry pattern with `generateQuestionIdWithBehavior()` - **one implementation per category**

### ✅ Category Extensibility
**Before:** Would need to add `if (category === "NEW")` in multiple places  
**After:** Add to `CATEGORY_BEHAVIORS` registry - **localized changes**

### ✅ Validation Consistency
**Before:** No guarantee modal options match addQuestion acceptance  
**After:** `isQuestionTypeAllowed()` uses same rules as modal - **guaranteed consistency**

---

## Remaining Technical Debt

### ⚠️ Not Yet Addressed

1. **Question type restrictions** are hardcoded in `questionTypeRules.ts`
   - **Future:** Could move to database/config if rules change frequently
   - **Current:** Fine for static rules (SPEAKING only for IELTS)

2. **Category behaviors** are registry-based but still in one file
   - **Future:** Could split into `behaviors/ielts.ts`, `behaviors/toefl.ts`
   - **Current:** Fine for 1-2 behaviors, would refactor if 5+

3. **Question editor modal** still inline (800 lines)
   - **Impact:** High - biggest remaining block
   - **Effort:** Medium - requires prop threading

4. **Defaults from factories** are generic
   - **Future:** Category-specific defaults via behavior system
   - **Current:** All categories share same defaults (seems fine)

---

## Testing Strategy

### Unit Tests (Now Possible)

```tsx
// Test rules
const context = { examCategory: "IELTS", sectionType: "SPEAKING", ieltsContext: { part: 1 } };
const allowed = getAllowedQuestionTypes(context);
expect(allowed).toContain("SPEAKING_RECORDING");
expect(allowed).not.toContain("MCQ_SINGLE");

// Test behavior
const behavior = getCategoryBehavior("IELTS");
const id = behavior.adjustQuestionId!("base", mockContext);
expect(id).toMatch(/^q-part\d+-\d+$/);

// Test pipeline
const result = createQuestionDraft({ questionType: "MCQ_SINGLE", examCategory: "IELTS", ... });
expect(result.valid).toBe(true);
expect(result.question.id).toMatch(/^q-part\d+-\d+$/);
```

### Integration Test

```tsx
// 1. Open builder for IELTS Speaking Part 2
// 2. Click "Add Question"
// 3. Modal should show: SPEAKING_RECORDING, SHORT_TEXT, ESSAY
// 4. Modal should NOT show: MCQ, TF, DND, etc.
// 5. Select SPEAKING_RECORDING
// 6. addQuestion should succeed
// 7. Question ID should be: q-part2-{timestamp}
```

---

## Flow Diagram

```
┌─────────────────────────────────────────────────┐
│         questionTypeRules.ts                    │
│                                                  │
│  QUESTION_TYPE_RESTRICTIONS                     │
│  CONTEXT_SPECIFIC_TYPES                         │
│                                                  │
│  ┌─────────────────────────────────┐            │
│  │ getAllowedQuestionTypes()       │◄───┬───┬─  │
│  └─────────────────────────────────┘    │   │   │
│           │                              │   │   │
│           ├─► isQuestionTypeAllowed()    │   │   │
│           └─► getGroupedQuestionTypes()  │   │   │
└───────────────────────────────────────────┼───┼─ │
                                            │   │   │
                                            │   │   │
┌───────────────────────────────────────────┼───┼─ │
│         categoryBehaviors.ts              │   │   │
│                                           │   │   │
│  CATEGORY_BEHAVIORS = {                  │   │   │
│    IELTS: { adjustQuestionId, ... }      │   │   │
│  }                                        │   │   │
│                                           │   │   │
│  ┌─────────────────────────────────┐     │   │   │
│  │ generateQuestionIdWithBehavior()│◄────┼───┼─  │
│  └─────────────────────────────────┘     │   │   │
│  ┌─────────────────────────────────┐     │   │   │
│  │ applyCategoryAdjustments()      │◄────┼───┼─  │
│  └─────────────────────────────────┘     │   │   │
└───────────────────────────────────────────┼───┼─ │
                                            │   │   │
                                            │   │   │
┌───────────────────────────────────────────┼───┼─ │
│         addQuestionFlow.ts                │   │   │
│                                           │   │   │
│  ┌─────────────────────────────────┐     │   │   │
│  │ createQuestionDraft()           │     │   │   │
│  │   1. isQuestionTypeAllowed()────┼─────┘   │   │
│  │   2. getDefaultPrompt/Options() │         │   │
│  │   3. generateIdWithBehavior()───┼─────────┘   │
│  │   4. applyCategoryAdjustments() │             │
│  │   5. return result              │             │
│  └─────────────────────────────────┘             │
└───────────────────────────────────────────────── │
                       │                            │
                       ▼                            │
         ┌─────────────────────────┐               │
         │  Builder Page           │               │
         │                         │               │
         │  addQuestion(type) {    │               │
         │    result = create...() │───────────────┘
         │    if (valid) set...    │
         │  }                      │
         │                         │
         │  <QuestionTypeModal     │
         │    allowedGroups={      │
         │      getGrouped...()────┼───────────────┐
         │    }                    │               │
         │  />                     │               │
         └─────────────────────────┘               │
                                                   │
                                     Uses same ────┘
                                     rules!
```

---

## Comparison: Before vs After

### Adding a Question (Before)

```tsx
// In page.tsx addQuestion()
const defaultPrompt = getDefaultPrompt(qtype);
if (ORDER_SENTENCE) defaultPrompt.rawText = join(tokens);

let questionId = `q-${Date.now()}`;
if (selectedCategory === "IELTS") {
  if (sectionType === "LISTENING") questionId = `q-part${selectedListeningPart}-...`;
  else if (sectionType === "READING") questionId = `q-part${selectedReadingPart}-...`;
  else if (sectionType === "WRITING") questionId = `q-task${selectedWritingPart}-...`;
  else if (sectionType === "SPEAKING") questionId = `q-part${selectedSpeakingPart}-...`;
}

const newQuestion = {
  id: questionId,
  qtype,
  order: currentSection.questions.length,
  prompt: defaultPrompt,
  options: getDefaultOptions(qtype),
  answerKey: getDefaultAnswerKey(qtype),
  maxScore: 1,
};

setEditingQuestion(newQuestion);
```

**Issues:**
- Category branches inline
- Duplicated in FILL_IN_BLANK split
- No validation
- Hard to add new categories

### Adding a Question (After)

```tsx
// In page.tsx addQuestion()
const result = createQuestionDraft({
  questionType: qtype,
  examCategory: selectedCategory,
  sectionType: currentSection.type,
  currentSection,
  ieltsContext: isIELTS ? { getCurrentPart } : undefined,
});

if (!result.valid) {
  showAlert(result.error);
  return;
}

setEditingQuestion(result.question);
```

**Benefits:**
- No category branches (handled in registry)
- Used by both regular add and FILL_IN_BLANK (DRY)
- Validation included
- Adding new category = add to registry only

---

## Summary

### What We Built

A **category-fair architecture** where:
- **Shared by default:** Question type rules, add pipeline, modal
- **Category-specific only where needed:** IELTS has custom ID behavior, others use defaults
- **Extensible:** New categories add to registry, don't modify shared code
- **Validated:** Modal options and addQuestion use same source of truth

### Key Files

| File | Lines | Role |
|------|-------|------|
| `questionTypeRules.ts` | 109 | **Single source of truth** for availability |
| `addQuestionFlow.ts` | 93 | **Single pipeline** for creation |
| `categoryBehaviors.ts` | 102 | **Registry** for category overrides |
| `QuestionTypeModal.tsx` | 68 | **Dumb picker** (receives filtered types) |

**Total new architecture code:** 372 lines (focused, testable, reusable)

### What We Guaranteed

1. ✅ **QuestionTypeModal stays dumb** - no category logic added
2. ✅ **Modal and validation cannot drift** - same function, same context
3. ✅ **IELTS behavior isolated** - registry entry, not scattered checks
4. ✅ **Other categories treated fairly** - default behavior unless they need custom
5. ✅ **Extensibility** - new rules/behaviors = add to registry/map
6. ✅ **No duplication** - addQuestion and FILL_IN_BLANK use same pipeline

### What's Still TODO

- ⚠️ Extract 800-line question editor modal
- ⚠️ Extract 120-line save logic
- ⚠️ Extract 115-line serialization

**But** the **modal-rules-addQuestion contract is complete and solid.**
