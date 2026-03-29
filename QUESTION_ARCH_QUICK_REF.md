# Question Architecture - Quick Reference

## The Problem

❌ **Before:**
- `QuestionTypeModal` had hardcoded groups
- `addQuestion()` had inline validation + ID generation
- FILL_IN_BLANK had duplicate ID logic
- No guarantee modal and validation agree
- IELTS checks scattered in builder code

## The Solution

✅ **After:**
- **Single source of truth:** `questionTypeRules.ts` → `getAllowedQuestionTypes()`
- **Shared pipeline:** `addQuestionFlow.ts` → `createQuestionDraft()`
- **Category registry:** `categoryBehaviors.ts` → pluggable behaviors
- **Dumb modal:** Receives pre-filtered types, stays presentational
- **Guaranteed consistency:** Modal and validation use same function

---

## File Structure

```
src/components/admin/exams/create/
├── questionTypeRules.ts        [NEW] 109 lines - Single source of truth
├── addQuestionFlow.ts          [NEW]  93 lines - Shared pipeline
├── categoryBehaviors.ts        [NEW] 102 lines - Category registry
├── QuestionTypeModal.tsx       [MOD]  68 lines - Now accepts filtered groups
├── questionHelpers.ts          [---] unchanged - Still provides defaults
├── ieltsHelpers.ts             [---] unchanged - Still manages IELTS parts
└── ...

src/app/dashboard/admin/exams/create/[category]/
└── page.tsx                    [MOD] 1679 lines - Uses new pipeline
```

---

## The Flow

```
┌──────────────┐
│   Builder    │  Computes context: { category, section, ieltsContext }
└──────┬───────┘
       │
       ├─► getGroupedQuestionTypes(context) ──► QuestionTypeModal
       │                                         │
       │                                         ▼
       │                                    User selects type
       │                                         │
       ▼                                         ▼
   createQuestionDraft(context + type) ◄────────┘
       │
       ├─► 1. isQuestionTypeAllowed() ──► Validate
       ├─► 2. generateIdWithBehavior() ──► IELTS gets part-ID, others generic
       ├─► 3. getDefaults()            ──► From factories
       ├─► 4. applyCategoryAdjustments() ──► Hook for custom logic
       │
       ▼
   { question, valid }
       │
       ▼
   setEditingQuestion(result.question)
```

---

## Code Examples

### Adding Question (Simplified)

**Before:**
```tsx
const addQuestion = (qtype) => {
  const prompt = getDefaultPrompt(qtype);
  let id = `q-${Date.now()}`;
  if (category === "IELTS") {
    if (section === "LISTENING") id = `q-part${part}-...`;
    // ... more branches
  }
  const question = { id, qtype, prompt, options, answerKey, ... };
  setEditingQuestion(question);
};
```

**After:**
```tsx
const addQuestion = (qtype) => {
  const result = createQuestionDraft({ 
    questionType: qtype, 
    examCategory, 
    sectionType, 
    currentSection,
    ieltsContext: isIELTS ? { getCurrentPart } : undefined 
  });
  
  if (!result.valid) return showAlert(result.error);
  
  setEditingQuestion(result.question);
};
```

---

### Extending for New Category

**Add TOEFL custom ID prefix:**

```tsx
// categoryBehaviors.ts
const CATEGORY_BEHAVIORS = {
  IELTS: { ... },
  TOEFL: {  // ← Add this
    adjustQuestionId: (baseId, ctx) => `toefl-${baseId}`,
  },
};
```

**That's it.** No changes needed in builder, modal, or pipeline.

---

## Key Principles

1. **Shared by default** - All categories use same pipeline
2. **Category-specific via registry** - Not via if/else checks
3. **Context-driven** - Rules use context, not global state
4. **Single source of truth** - One function for "what's allowed"
5. **Fail fast** - Validation before expensive operations
6. **Extensible** - Add behavior = add to registry

---

## Next Refactor Priorities

1. **Extract Question Editor Modal** (800 lines) - Highest impact
2. **Extract Question Save Logic** (120 lines)
3. **Extract Exam Serialization** (115 lines)
4. **Extract Section Operations** (add/delete/edit)
