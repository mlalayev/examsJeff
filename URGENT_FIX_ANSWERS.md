# URGENT FIX - Answers Not Saving

## THE PROBLEM
Your HTML inputs are missing `name` or `id` attributes!

The code **requires** either `name` or `id` to track answers.
Without them, inputs are **IGNORED** and answers **NEVER SAVE**.

## YOUR CURRENT HTML (BROKEN):
```html
<input type="text" data-answer="30th March 1988 | March 30th 1988 | March 30 1988" />
```

## FIXED HTML (ADD name="q1", name="q2", etc.):
```html
<div class="page">
  <div class="top">
    <div>PART 1</div>
    <div>Questions <b>1 - 10</b></div>
  </div>

  <div class="instructions">
    Complete the form below.<br /><br />
    Write <strong>NO MORE THAN TWO WORDS AND/OR A NUMBER</strong> for each answer.
  </div>

  <div class="box">
    <h2 style="text-align:center;">International Student Travel Agency</h2>
    <h3 style="text-align:center;">Enquiry Form</h3>

    <div><b>Name:</b> Sarah Brown</div>

    <div>
      <b>Date of birth:</b>
      <b>1</b>
      <input type="text" name="q1" data-answer="30th March 1988 | March 30th 1988 | March 30 1988" />
    </div>

    <div><b>Address:</b> 21 Waverley Road, Radstone, RD4 6WV</div>

    <div>
      <b>Contact tel. no.:</b>
      <b>2</b>
      <input type="text" name="q2" data-answer="0903775115" />
    </div>

    <div style="margin-top:10px;"><b>Notes:</b></div>

    <ul>
      <li>
        wants to travel in
        <b>3</b>
        <input type="text" name="q3" data-answer="Northern" />
        Europe
      </li>

      <li>
        hopes to travel by
        <b>4</b>
        <input type="text" name="q4" data-answer="train" />
      </li>

      <li>
        interested in working in a
        <b>5</b>
        <input type="text" name="q5" data-answer="hotel" />
      </li>

      <li>
        recommended to consider an alternative e.g.
        <b>6</b>
        <input type="text" name="q6" data-answer="farm" />
        work
      </li>

      <li>
        advised to buy a European
        <b>7</b>
        <input type="text" name="q7" data-answer="pass" />
        for travelling
      </li>

      <li>
        given a
        <b>8</b>
        <input type="text" name="q8" data-answer="booklet" />
        with accommodation details
      </li>

      <li>
        agreed to take out
        <b>9</b>
        <input type="text" name="q9" data-answer="insurance" />
        from the Agency
      </li>

      <li>
        told to use an
        <b>10</b>
        <input type="text" name="q10" data-answer="internet cafe" />
        for contacting people
      </li>
    </ul>
  </div>
</div>
```

## WHAT TO ADD:
Add `name="q1"`, `name="q2"`, ... `name="q10"` to EVERY input.

**PATTERN:**
- Question 1 → `name="q1"`
- Question 2 → `name="q2"`
- Question 3 → `name="q3"`
- etc.

## WHY THIS HAPPENS:
The code looks for `name` or `id`:
```typescript
const key = el.name || el.id;
if (!key) {
  return; // SKIPS THIS INPUT!
}
```

Without `name` or `id`, the input is **SKIPPED** and answers **DON'T SAVE**.

## HOW TO FIX NOW:

1. **Go to your exam edit page**
2. **Click "Quick Edit Questions"**
3. **Select the Listening section, Part 1**
4. **Click Edit (pencil icon) on the HTML/CSS question**
5. **In the HTML Code editor, add `name="q1"` to the first input**
6. **Add `name="q2"` to the second input**
7. **Continue for all 10 inputs**
8. **Click "Save Question"**
9. **DONE!** Answers will now save.

## VERIFICATION:
After fixing:
1. Take the test
2. Fill in some answers
3. Open browser console (F12)
4. Look for: `✅ Successfully bound to 10 inputs`
5. Type in an answer
6. Check console for answer updates
7. Submit test
8. Check admin results page - answers should appear!

## IF STILL NOT WORKING:
Check browser console for errors like:
- `❌ Failed to find inputs after 20 attempts`
- `🔄 Setup attempt 0: found 0 inputs`

This means the HTML is not loading properly.

---

**BOTTOM LINE:** 
Every `<input>`, `<textarea>`, or `<select>` MUST have either:
- `name="q1"` (recommended)
- OR `id="q1"`

Otherwise, answers will NOT be saved!
