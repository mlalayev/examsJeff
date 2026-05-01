# HTML_CSS Question Fix - Action Required

## TL;DR - The Problem

Your HTML_CSS question is **pasting a full HTML document** (with `<!DOCTYPE>`, `<html>`, `<head>`, `<body>` tags) into the HTML Code field. This causes the iframe to fail finding the inputs.

## The Solution (2 Steps)

### Step 1: Edit Your Question in Admin Panel

1. Go to **Admin → Exams → [Your Exam] → Edit**
2. Find the HTML_CSS question
3. Click **Edit**

### Step 2: Split HTML and CSS

**REMOVE from HTML Code field**: Everything related to `<!DOCTYPE>`, `<html>`, `<head>`, `<title>`, and `<style>` tags

**IN HTML Code field, paste ONLY**:
```html
<div class="page">
  <div class="top">
    <div>PART 1</div>
    <div>Questions <b>1 - 10</b></div>
  </div>

  <div class="instructions">
    Complete the notes below.<br /><br />
    Write <strong>ONE WORD AND/OR A NUMBER</strong> for each answer.
  </div>

  <div class="box">
    <h1>Family presents</h1>
    <h2>Company specialises in educational toys</h2>

    <div class="section">
      <div class="section-title">Presents for Peter:</div>
      <div>
        A wooden <b>1</b>
        <input name="q1" data-answer="truck" class="medium" type="text" /> (a model)
      </div>
      <ul>
        <li>includes a sheet of stickers</li>
        <li>
          helps children to understand basic <b>2</b>
          <input name="q2" data-answer="technology" class="medium" type="text" />
        </li>
        <li>price: £17.50</li>
      </ul>
    </div>

    <div class="section">
      <div>
        A <b>3</b>
        <input name="q3" data-answer="bird" class="medium" type="text" /> feeder
      </div>
      <ul>
        <li>includes paints and brush</li>
        <li>
          price: <b>4</b>
          <input name="q4" data-answer="8.99" class="short" type="text" />
        </li>
      </ul>
    </div>

    <div class="section">
      <div class="section-title">Present for Natalie:</div>
      <div><strong>A chocolate pack</strong></div>
      <ul>
        <li>
          kit includes chocolate, moulds and some small <b>5</b>
          <input name="q5" data-answer="boxes" class="medium" type="text" />
        </li>
        <li>develops artistic skills</li>
        <li>
          helps children to understand effects of <b>6</b>
          <input name="q6" data-answer="temperature" class="medium" type="text" />
        </li>
        <li>price: £6.00</li>
      </ul>
    </div>

    <div class="section">
      <div class="section-title">Ordering toys</div>
      <ul>
        <li>
          web address - www. <b>7</b>
          <input name="q7" data-answer="rimona" class="medium" type="text" /> .com
        </li>
        <li>
          order before Friday to get free <b>8</b>
          <input name="q8" data-answer="postage" class="medium" type="text" />
        </li>
        <li>can be wrapped and sent straight to children</li>
        <li>
          under 'Packaging options' choose <b>9</b>
          <input name="q9" data-answer="gift" class="medium" type="text" />
        </li>
        <li>
          possible to include a <b>10</b>
          <input name="q10" data-answer="message" class="medium" type="text" />
        </li>
      </ul>
    </div>
  </div>
</div>
```

**IN CSS Code field, paste**:
```css
body {
  font-family: "Times New Roman", serif;
  background: #fff;
  color: #222;
  padding: 30px;
}

.page {
  width: 620px;
  margin: 0 auto;
}

.top {
  display: flex;
  gap: 120px;
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 28px;
}

.instructions {
  font-size: 15px;
  line-height: 1.5;
  margin-bottom: 18px;
}

.box {
  border: 2px solid #555;
  padding: 28px 38px;
  min-height: 580px;
}

h1 {
  text-align: center;
  font-size: 20px;
  margin: 0 0 4px;
}

h2 {
  text-align: center;
  font-size: 18px;
  margin: 0 0 20px;
}

.section {
  margin-bottom: 20px;
  font-size: 15px;
  line-height: 1.45;
}

.section-title {
  font-weight: bold;
  margin-bottom: 3px;
}

ul {
  margin: 0;
  padding-left: 20px;
}

li {
  margin: 2px 0;
}

input {
  border: none;
  border-bottom: 1px dotted #333;
  outline: none;
  font-family: "Times New Roman", serif;
  font-size: 15px;
  width: 120px;
  background: transparent;
}

.short { width: 70px; }
.medium { width: 110px; }
```

### Step 3: Test

1. **Save the question**
2. **Refresh the browser** (Ctrl+F5)
3. **Open DevTools Console** (F12)
4. **Go to the question**
5. You should see:
   ```
   🔍 QHtmlCss render: { inputCount: 10, ... }
   🔄 Setup attempt 0: found 10 inputs
   ✅ Successfully bound to 10 inputs
   ```
6. **Type in an input**
7. **Wait 3 seconds**
8. **Check console**: Should see API save call

## Why This Fix Works

**Before**:
```
Full HTML document → sanitizeHtmlCssMarkup() tries to extract <body>
→ Something goes wrong → Empty HTML → 0 inputs found
```

**After**:
```
Just the body content → sanitizeHtmlCssMarkup() does nothing
→ Content renders directly → 10 inputs found → Saving works
```

## What I've Added for Debugging

New console logs will show:
- `🔍` Original vs sanitized HTML lengths
- `🔄` Each setup attempt and how many inputs found
- `✅` Success message when inputs are bound
- `❌` Error with iframe content if it fails

This will help us see exactly what's happening.

## If It Still Doesn't Work

After doing the HTML/CSS split, refresh and check console. Send me:

1. The `🔍 QHtmlCss render` log
2. The `🔄 Setup attempt` logs
3. Whether you see `✅ Successfully bound` or `❌ Failed to find inputs`
4. Screenshot of the question in the browser

## Summary

**The issue**: Full HTML document breaks iframe input detection

**The fix**: Split into body-only HTML + separate CSS

**Time to fix**: 2 minutes

**What's preserved**: All your inputs, all your `name` attributes, all your `data-answer` attributes - everything is correct, just needs to be reorganized.
