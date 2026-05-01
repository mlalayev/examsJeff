# HTML/CSS Questions - Grading Notes

## Current Status

HTML/CSS questions are set up for **manual grading** by instructors.

### Why Manual Grading?

HTML/CSS questions test coding knowledge and there can be many valid ways to write code. Manual review allows instructors to:
- Check code quality and style
- Verify the output matches requirements
- Give partial credit for partially correct solutions
- Provide feedback on coding practices

### What Gets Saved

**Question Data:**
- `prompt.htmlCode` - Reference HTML code shown to students
- `prompt.cssCode` - Reference CSS code shown to students  
- `prompt.text` - Instructions for students

**Student Answer:**
- Saved as key-value pairs: `{ fieldId: value }`
- All form field values (inputs, radios, checkboxes, etc.)

**Correct Answers (in HTML):**
- Text inputs: `data-answer="ans1 | ans2 | ans3"`
- Radio buttons: `data-correct="true"` on correct options
- Checkboxes: `data-answer="true/false"`

### How to Grade

1. Go to the grading page for the attempt
2. View the student's answers for the HTML/CSS question
3. Compare their answers with the correct answers embedded in your HTML
4. Award points based on correctness (0 to maxScore)

### Future Enhancement

Auto-grading could be implemented by:
1. Parsing the `prompt.htmlCode` to extract `data-answer` and `data-correct` attributes
2. Comparing student answers against these extracted values
3. Awarding points automatically

This would require updating `/src/lib/scoring.ts` with HTML parsing logic.

---

For now, HTML/CSS questions work great for assessment but require instructor review for scoring!
