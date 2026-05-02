# Quick Edit Questions - Add Question Feature

## Summary
Added the ability to add new questions directly from the "Quick Edit Questions" modal in the exam edit page.

## Changes Made

### 1. ExamEditModal Component (`src/components/modals/ExamEditModal.tsx`)

#### New Imports
- Added `Plus` icon from `lucide-react`
- Added `QuestionTypeModal` component
- Added helper functions: `getDefaultPrompt`, `getDefaultOptions`, `getDefaultAnswerKey`
- Added `QuestionType` type

#### New State
- `showQuestionTypeModal`: Controls the visibility of the question type selection modal

#### New Functions

**`handleAddQuestion(qtype: QuestionType)`**
- Creates a new question with the selected type
- Calculates the correct order for the new question based on:
  - For IELTS exams with parts: Finds the last question in the selected part and adds 1
  - For other exams: Uses the total number of questions + 1
- Assigns a temporary ID (`temp-${Date.now()}`)
- Uses default values for prompt, options, and answerKey based on question type
- Opens the edit modal for the new question

**Updated `handleSaveQuestion()`**
- Now checks if the question is new (has a temporary ID starting with `temp-`)
- For new questions: Adds to the questions array
- For existing questions: Updates the existing question
- Calls `onSave` with the updated questions array

#### UI Changes
- Added "Add Question" button at the top of the questions list
  - Shows which part/section the question will be added to
  - Gradient blue background with Plus icon
  - Full width design
- Updated empty state message to include "Click 'Add Question' to create one"
- Added Question Type Selection Modal at the bottom

### 2. Edit Exam Page (`src/app/dashboard/admin/exams/[id]/edit/page.tsx`)

#### Updated `onSave` Callback
- Changed from synchronous to `async` function
- Now saves changes to the database immediately after updating local state
- Shows loading state while saving
- Displays success/error alerts
- Handles both new questions (with temporary IDs) and existing questions
- Properly filters out temporary IDs when saving to the database

#### Save Logic
- Flattens subsections for the API
- Includes all exam metadata (title, category, track, reading/writing types)
- Properly formats section data with instructions, audio, passage, etc.
- Filters out temporary IDs (`q-`, `temp-`, `section-`, `subsection-`) before sending to API
- Maintains question order and all properties

## How It Works

1. User clicks "Quick Edit Questions" on exam edit page
2. Selects a section (e.g., Listening) and optionally a part (e.g., Part 1)
3. Clicks "Add Question to Part 1" button
4. Question Type Modal appears with all available question types
5. User selects a question type (e.g., MCQ_SINGLE, HTML_CSS, etc.)
6. Edit Question Modal opens with default values pre-filled
7. User edits the question (prompt, options, answer key, image, etc.)
8. User clicks "Save Question"
9. Question is added to the local state AND saved to the database
10. Success message is shown
11. The new question appears in the questions list

## Benefits

- ✅ Can add questions directly from Quick Edit modal (no need to use the full editor)
- ✅ Questions are added to the correct part/section
- ✅ Questions are immediately saved to the database
- ✅ Works with all question types (MCQ, HTML_CSS, DND_GAP, etc.)
- ✅ Proper order calculation for new questions
- ✅ Clean UI with gradient button design
- ✅ Clear feedback with loading states and success/error alerts

## Testing Recommendations

1. **Add question to empty part**: Try adding a question to a part with no questions
2. **Add question to populated part**: Add a question to a part that already has questions
3. **Different question types**: Test with MCQ, HTML_CSS, DND_GAP, etc.
4. **IELTS vs SAT**: Test with different exam categories
5. **Subsections**: Test with sections that have subsections (Listening, Reading, Writing)
6. **Database persistence**: Refresh the page after adding a question to verify it was saved
7. **Edit after add**: Add a question, then edit it again to verify it works correctly

## Known Limitations

- Questions can only be added one at a time (not bulk import)
- Question order is automatically calculated (cannot manually specify order during creation)
- Deleting questions is not yet implemented in this modal (must use full editor)

## Future Enhancements

- Add ability to delete questions from Quick Edit modal
- Add ability to reorder questions via drag-and-drop
- Add bulk import/export functionality
- Add duplicate question functionality
