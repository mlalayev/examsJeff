# Code Refactoring Plan - Exam Builder & Results Pages

## Overview
Both pages are extremely large (1866+ lines) and need to be broken down into smaller, maintainable components.

## File 1: `/src/app/dashboard/admin/exams/create/[category]/page.tsx` (1866 lines)

### Current Issues:
- ❌ Single massive component with 1866 lines
- ❌ Question editing modal is 1000+ lines inline
- ❌ Multiple question type handlers in one file
- ❌ Hard to maintain and test
- ❌ Poor code reusability

### Refactoring Strategy:

#### A. Main Page Component (150 lines)
**File:** `src/app/dashboard/admin/exams/create/[category]/page.tsx`
- State management
- Top-level handlers (addQuestion, saveQuestion, deleteQuestion, saveExam)
- Route rendering logic
- Import and use sub-components

#### B. Question Edit Modal (100 lines)
**File:** `src/components/admin/exams/create/questionModal/QuestionEditModal.tsx`
**Status:** ✅ CREATED
- Modal container
- Question type display
- Calls sub-components for each section
- Save/Cancel buttons

#### C. Question Field Components

##### 1. Image Upload Field (60 lines)
**File:** `src/components/admin/exams/create/questionModal/questionFields/QuestionImageUpload.tsx`
**Status:** ✅ CREATED
- Image preview
- Upload handler
- Remove image button

##### 2. Prompt Field Router (60 lines)
**File:** `src/components/admin/exams/create/questionModal/questionFields/QuestionPromptField.tsx`
**Status:** ✅ CREATED
- Routes to specific prompt component based on `qtype`
- Container for all prompt types

##### 3. Individual Prompt Components (50-150 lines each)

**Status:** ✅ PARTIAL (3/9 created)

Created:
- `prompts/PromptOrderSentence.tsx` ✅
- `prompts/PromptShortText.tsx` ✅
- `prompts/PromptEssay.tsx` ✅

To Create:
- `prompts/PromptFillInBlank.tsx` - Fill in blank with [input] placeholders
- `prompts/PromptDndGap.tsx` - Drag and drop gap fill
- `prompts/PromptInlineSelect.tsx` - Inline select dropdown
- `prompts/PromptSpeakingRecording.tsx` - IELTS speaking
- `prompts/PromptImageInteractive.tsx` - Interactive image with hotspots
- `prompts/PromptDefault.tsx` - Default text prompt for MCQ, TF, etc.

##### 4. Options Field Router (80 lines)
**File:** `src/components/admin/exams/create/questionModal/questionFields/QuestionOptionsField.tsx`
**To Create:**
- Routes to specific options component
- Handles MCQ_SINGLE, MCQ_MULTI, INLINE_SELECT

##### 5. Answer Key Field Router (80 lines)
**File:** `src/components/admin/exams/create/questionModal/questionFields/QuestionAnswerKeyField.tsx`
**To Create:**
- Routes to specific answer key component
- Handles all question types

#### D. Section Management Components

##### 1. Active Section Editor (200 lines)
**File:** `src/components/admin/exams/create/sections/ActiveSectionEditor.tsx`
**To Create:**
- Section header with breadcrumb
- Section content (passage/audio)
- Part selector for IELTS
- Questions list
- Add question button

##### 2. Loading Skeleton (80 lines)
**File:** `src/components/admin/exams/create/LoadingSkeleton.tsx`
**To Create:**
- Header skeleton
- Content skeleton
- Reusable across pages

#### E. Exam Actions Component (60 lines)
**File:** `src/components/admin/exams/create/ExamActions.tsx`
**To Create:**
- Cancel button
- Save exam button with validation
- Loading states

---

## File 2: `/src/app/attempts/[attemptId]/results/page.tsx` (1566 lines)

### Current Issues:
- ❌ Single massive component with 1566 lines
- ❌ Complex rendering logic for different question types
- ❌ Repeated code for teacher/student views
- ❌ Hard to maintain and test

### Refactoring Strategy:

#### A. Main Results Page Component (120 lines)
**File:** `src/app/attempts/[attemptId]/results/page.tsx`
- Data fetching
- State management
- Top-level handlers
- Import and use sub-components

#### B. Results Header Component (80 lines)
**File:** `src/components/attempts/results/ResultsHeader.tsx`
**To Create:**
- Back button
- Exam title
- Student name
- Submission date
- Status badge

#### C. Results Summary Component (100 lines)
**File:** `src/components/attempts/results/ResultsSummary.tsx`
**To Create:**
- Overall score card
- Progress bar
- Percentage display
- Score breakdown

#### D. Section Results List (100 lines)
**File:** `src/components/attempts/results/SectionResultsList.tsx`
**To Create:**
- List of sections with scores
- Section icons
- Expandable sections
- IELTS Listening parts breakdown

#### E. Question Results Components

##### 1. Questions Grid/List (120 lines)
**File:** `src/components/attempts/results/QuestionsGrid.tsx`
**To Create:**
- Grid/list of questions
- Question cards
- Correct/incorrect indicators
- Answer display

##### 2. Individual Question Card (80 lines)
**File:** `src/components/attempts/results/QuestionCard.tsx`
**To Create:**
- Question number and type
- Prompt display
- Student answer
- Correct answer
- Explanation
- Teacher grading (if applicable)

##### 3. Question Answer Formatters
**File:** `src/components/attempts/results/formatters/`
**To Create (one file per type):**
- `formatMCQAnswer.tsx` - Format MCQ answers
- `formatTFAnswer.tsx` - Format True/False
- `formatTextAnswer.tsx` - Format text answers
- `formatDndAnswer.tsx` - Format drag and drop
- `formatImageInteractive.tsx` - Format interactive image answers

#### F. IELTS Writing/Speaking Components

##### 1. Writing Submission Card (150 lines)
**File:** `src/components/attempts/results/WritingSubmissionCard.tsx`
**To Create:**
- Task 1 & 2 responses
- Word counts
- AI scores (if available)
- Band scores
- Feedback

##### 2. Speaking Results Card (120 lines)
**File:** `src/components/attempts/results/SpeakingResultsCard.tsx`
**To Create:**
- Speaking scores
- Audio playback
- AI feedback
- Band breakdown

#### G. Teacher Grading Components

##### 1. Teacher Grading Panel (150 lines)
**File:** `src/components/attempts/results/TeacherGradingPanel.tsx`
**To Create:**
- Score input
- Feedback textarea
- Save button
- Loading states

##### 2. AI Feedback Request Component (80 lines)
**File:** `src/components/attempts/results/AIFeedbackRequest.tsx`
**To Create:**
- Request AI feedback button
- Loading state
- Error handling

#### H. UI Components

##### 1. Loading Skeleton (80 lines)
**File:** `src/components/attempts/results/ResultsLoadingSkeleton.tsx`
**To Create:**
- Header skeleton
- Summary skeleton
- Questions skeleton

##### 2. Restricted Access Message (60 lines)
**File:** `src/components/attempts/results/RestrictedAccessMessage.tsx`
**To Create:**
- Teacher-only message
- Icon and text
- Styling

---

## Implementation Priority

### Phase 1: Create Exam Page (High Priority)
1. ✅ QuestionEditModal.tsx (base modal)
2. ✅ QuestionImageUpload.tsx
3. ✅ QuestionPromptField.tsx (router)
4. ✅ PromptOrderSentence.tsx
5. ✅ PromptShortText.tsx
6. ✅ PromptEssay.tsx
7. ⚠️ Remaining 6 prompt components
8. ⚠️ QuestionOptionsField.tsx
9. ⚠️ QuestionAnswerKeyField.tsx
10. ⚠️ ActiveSectionEditor.tsx
11. ⚠️ LoadingSkeleton.tsx
12. ⚠️ ExamActions.tsx
13. ⚠️ Update main page.tsx to use new components

### Phase 2: Results Page (Medium Priority)
1. ⚠️ ResultsHeader.tsx
2. ⚠️ ResultsSummary.tsx
3. ⚠️ SectionResultsList.tsx
4. ⚠️ QuestionsGrid.tsx
5. ⚠️ QuestionCard.tsx
6. ⚠️ Answer formatters (8 files)
7. ⚠️ WritingSubmissionCard.tsx
8. ⚠️ SpeakingResultsCard.tsx
9. ⚠️ TeacherGradingPanel.tsx
10. ⚠️ AIFeedbackRequest.tsx
11. ⚠️ Loading/UI components
12. ⚠️ Update main results page.tsx

### Phase 3: Testing & Optimization
1. Test all new components
2. Check for linter errors
3. Verify functionality matches original
4. Test edge cases
5. Performance optimization

---

## Benefits of Refactoring

### Code Quality
- ✅ **Maintainability**: Smaller, focused components
- ✅ **Reusability**: Components can be reused across pages
- ✅ **Testability**: Easier to write unit tests
- ✅ **Readability**: Clear component hierarchy

### Developer Experience
- ✅ **Faster debugging**: Isolated component issues
- ✅ **Easier onboarding**: Clear structure for new developers
- ✅ **Better collaboration**: Multiple developers can work on different components
- ✅ **Version control**: Smaller diffs, easier reviews

### Performance
- ✅ **Code splitting**: Better bundle sizes
- ✅ **Lazy loading**: Load components when needed
- ✅ **Memoization**: Easier to optimize renders

---

## File Structure (After Refactoring)

```
src/
├── app/
│   ├── dashboard/admin/exams/create/[category]/
│   │   └── page.tsx (150 lines) ← Refactored
│   └── attempts/[attemptId]/results/
│       └── page.tsx (120 lines) ← Refactored
│
├── components/
│   ├── admin/exams/create/
│   │   ├── questionModal/
│   │   │   ├── QuestionEditModal.tsx ✅
│   │   │   └── questionFields/
│   │   │       ├── QuestionImageUpload.tsx ✅
│   │   │       ├── QuestionPromptField.tsx ✅
│   │   │       ├── QuestionOptionsField.tsx
│   │   │       ├── QuestionAnswerKeyField.tsx
│   │   │       └── prompts/
│   │   │           ├── PromptOrderSentence.tsx ✅
│   │   │           ├── PromptShortText.tsx ✅
│   │   │           ├── PromptEssay.tsx ✅
│   │   │           ├── PromptFillInBlank.tsx
│   │   │           ├── PromptDndGap.tsx
│   │   │           ├── PromptInlineSelect.tsx
│   │   │           ├── PromptSpeakingRecording.tsx
│   │   │           ├── PromptImageInteractive.tsx
│   │   │           └── PromptDefault.tsx
│   │   ├── sections/
│   │   │   └── ActiveSectionEditor.tsx
│   │   ├── ExamActions.tsx
│   │   └── LoadingSkeleton.tsx
│   │
│   └── attempts/results/
│       ├── ResultsHeader.tsx
│       ├── ResultsSummary.tsx
│       ├── SectionResultsList.tsx
│       ├── QuestionsGrid.tsx
│       ├── QuestionCard.tsx
│       ├── WritingSubmissionCard.tsx
│       ├── SpeakingResultsCard.tsx
│       ├── TeacherGradingPanel.tsx
│       ├── AIFeedbackRequest.tsx
│       ├── ResultsLoadingSkeleton.tsx
│       ├── RestrictedAccessMessage.tsx
│       └── formatters/
│           ├── formatMCQAnswer.tsx
│           ├── formatTFAnswer.tsx
│           ├── formatTextAnswer.tsx
│           ├── formatDndAnswer.tsx
│           └── formatImageInteractive.tsx
```

---

## Next Steps

I've created the foundation components for the refactoring. To continue:

1. **Complete remaining prompt components** (6 files)
2. **Create options and answer key field components** (2 files)
3. **Create section management components** (2 files)
4. **Update main create exam page** to use new components
5. **Start results page refactoring** (follow same pattern)

Would you like me to:
- A) Continue creating the remaining create exam components?
- B) Start refactoring the results page?
- C) Update the main create exam page.tsx to integrate the new components?

Let me know which direction you'd like to proceed!
