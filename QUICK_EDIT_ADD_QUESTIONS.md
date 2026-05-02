# Quick Edit Questions - Full Question Editing Feature

## Summary
Added the ability to add and edit questions with the full-featured question editing modal directly from the "Quick Edit Questions" interface. This includes all question types with specialized editors, including HTML/CSS interactive questions with live preview.

## Changes Made

### 1. ExamEditModal Component (`src/components/modals/ExamEditModal.tsx`)

#### New Imports
- Added `Plus` icon from `lucide-react`
- Added `QuestionTypeModal` component for selecting question types
- Added `QuestionEditModal` - the full-featured question editor with all fields
- Added helper functions: `getDefaultPrompt`, `getDefaultOptions`, `getDefaultAnswerKey`
- Added `QuestionType` type
- Removed basic `ImageUpload` component (now handled by the full modal)

#### New State
- `showQuestionTypeModal`: Controls the visibility of the question type selection modal
- `uploadingImage`: Tracks image upload status

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
- Replaced basic edit modal with full `QuestionEditModal` component
- Added Question Type Selection Modal

#### Full Question Editor Features (now integrated)
The editing modal now includes all specialized question editors:

**For HTML_CSS questions:**
- Instructions banner with examples of `data-answer` and `data-correct` attributes
- Question Instructions field (tells students what to do)
- HTML Code editor with syntax examples
- CSS Code editor (optional)
- Live preview in iframe showing how it will appear during exam
- Auto-extraction of answer keys from HTML attributes

**For other question types:**
- MCQ: Multiple choice options with correct answer selection
- DND_GAP: Drag-and-drop with word bank
- ORDER_SENTENCE: Sentence ordering
- FILL_IN_BLANK: Text with [input] placeholders
- IMAGE_INTERACTIVE: Clickable hotspots on images
- SPEAKING_RECORDING: Speaking prompts
- And more...

**Common features:**
- Question Type display (non-editable once selected)
- Optional image upload
- Question text/prompt editor (specific to each type)
- Options editor (for applicable types)
- Answer key editor (specific to each type)
- Live question preview
- Validation before saving

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

### Adding a New Question

1. User clicks "Quick Edit Questions" on exam edit page
2. Selects a section (e.g., Listening) and optionally a part (e.g., Part 1)
3. Clicks "Add Question to Part 1" button (gradient blue button at top)
4. Question Type Modal appears with all available question types grouped by category:
   - Variantlı sual (MCQ, True/False, etc.)
   - Açıq sual (Short text, Essay, Fill in blank)
   - Drag and Drop
   - Interactive (Image interactive)
   - Kodlama (HTML/CSS)
   - IELTS Speaking
5. User selects a question type (e.g., HTML_CSS)
6. Full Edit Question Modal opens with:
   - Question type label (at top, locked)
   - Specialized editor for that question type
   - For HTML_CSS: Instructions banner, HTML editor, CSS editor, live preview
   - Default values pre-filled
7. User edits the question using the specialized interface
8. User clicks "Save Question" button
9. Validation runs (e.g., for IMAGE_INTERACTIVE, checks for hotspots)
10. Question is added to local state AND saved to database via API
11. Success message is shown
12. Modal closes and the new question appears in the questions list

### Editing an Existing Question

1. From the Quick Edit Questions modal
2. Find the question in the list
3. Click the Edit icon (pencil) on the right
4. Same full Edit Question Modal opens
5. All fields are pre-populated with current values
6. User makes changes
7. Click "Save Question"
8. Question is updated in local state AND saved to database
9. Success/error message is shown

## Benefits

- ✅ **Full-featured editing**: Complete question editor with all specialized fields for each question type
- ✅ **HTML/CSS support**: Interactive questions with live preview, syntax help, and auto-grading setup
- ✅ **Quick access**: Add/edit questions directly from Quick Edit modal without navigating away
- ✅ **Smart placement**: Questions are added to the correct part/section with proper ordering
- ✅ **Instant persistence**: Changes are immediately saved to the database
- ✅ **All question types**: MCQ, HTML_CSS, DND_GAP, IMAGE_INTERACTIVE, SPEAKING_RECORDING, and more
- ✅ **Visual feedback**: Live preview for HTML_CSS questions, question preview for all types
- ✅ **Validation**: Built-in validation (e.g., IMAGE_INTERACTIVE requires hotspots)
- ✅ **Professional UI**: Consistent design with the main exam editor
- ✅ **Image support**: Upload images for any question type
- ✅ **Clear feedback**: Loading states and success/error alerts guide the user

## Testing Recommendations

### Basic Functionality
1. **Add question to empty part**: Try adding a question to a part with no questions
2. **Add question to populated part**: Add a question to a part that already has questions
3. **Edit existing question**: Click edit on an existing question and modify it
4. **Preview question**: Use the preview button (eye icon) to see how a question looks

### Question Types
5. **MCQ questions**: Create single and multiple choice questions
6. **HTML/CSS questions**: 
   - Add text inputs with `data-answer="ans1 | ans2"`
   - Add radio buttons with `data-correct="true"`
   - Verify live preview shows correctly
   - Check that answer keys are auto-extracted
7. **DND_GAP questions**: Create drag-and-drop with word bank
8. **IMAGE_INTERACTIVE**: Add clickable hotspots to an image
9. **SPEAKING_RECORDING**: Create speaking prompts

### Exam Categories
10. **IELTS exams**: Test with Listening, Reading, Writing, Speaking sections
11. **SAT exams**: Test with Math and Verbal modules
12. **Different parts**: Test adding questions to different parts (Part 1, Part 2, etc.)

### Persistence
13. **Database persistence**: Refresh the page after adding/editing to verify it was saved
14. **Edit after add**: Add a question, then immediately edit it again
15. **Multiple questions**: Add several questions in a row
16. **Image upload**: Try uploading images for questions

### Error Handling
17. **Validation**: Try saving an IMAGE_INTERACTIVE question without hotspots
18. **Cancel**: Click cancel and verify nothing is saved
19. **Network errors**: Test behavior if API call fails

## Features Included

### Question Type Specific Editors

1. **HTML_CSS**:
   - Blue info banner with instructions and examples
   - Question instructions field
   - HTML code editor with placeholder examples
   - CSS code editor (optional)
   - Live iframe preview
   - Auto-extraction of answer keys from `data-answer` and `data-correct` attributes
   - Line count display
   - Syntax hints below editors

2. **MCQ (Single/Multi)**:
   - Options editor with add/remove buttons
   - Correct answer selection (radio for single, checkboxes for multi)
   - Option ordering

3. **DND_GAP (Drag and Drop)**:
   - Text with blanks editor
   - Word bank management
   - Blank-to-word matching

4. **IMAGE_INTERACTIVE**:
   - Background image upload
   - Hotspot editor (click to add, drag to position)
   - Correct hotspot marking
   - Visual hotspot editor

5. **FILL_IN_BLANK**:
   - Text with [input] placeholders
   - Answer key for each blank
   - Instructions field

6. **ORDER_SENTENCE**:
   - Token editor (one per line)
   - Preview of sentence ordering

7. **SPEAKING_RECORDING**:
   - Speaking prompt editor
   - Part selection (Part 1, 2, or 3)

8. **ESSAY/SHORT_TEXT**:
   - Text prompt editor
   - Optional rubric/answer guidance

### Common Features (All Question Types)
- Question type display badge
- Optional image upload for question
- Question preview at bottom
- Save/Cancel buttons
- Validation before save
- Loading states during save
- Error handling and user feedback

## Known Limitations

- Questions can only be added one at a time (not bulk import)
- Question order is automatically calculated (cannot manually specify order during creation)
- Deleting questions is not yet implemented in this modal (must use full editor)
- Question type cannot be changed after creation (must delete and recreate)

## Future Enhancements

- Add ability to delete questions from Quick Edit modal
- Add ability to reorder questions via drag-and-drop
- Add ability to change question order manually
- Add bulk import/export functionality
- Add duplicate question functionality
- Add ability to move questions between parts/sections
- Add keyboard shortcuts for faster editing
