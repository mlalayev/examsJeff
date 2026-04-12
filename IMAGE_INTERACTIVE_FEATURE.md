# Interactive Image Question Type - Feature Guide

## Overview

The **IMAGE_INTERACTIVE** question type allows you to create questions where students click on specific areas of an image to answer. This is perfect for:
- Anatomy or biology questions (e.g., "Click on the heart")
- Geography (e.g., "Select all countries in Europe")
- Diagrams (e.g., "Click on the parts of a machine")
- Maps (e.g., "Select the correct location")
- Any visual identification tasks

## Features

### For Admins (Creating Questions)

1. **Background Image Upload**: Upload any image as the background
2. **Clickable Hotspots**: Define multiple clickable areas on the image
3. **Flexible Positioning**: Set position and size for each hotspot using percentages
4. **Two Interaction Modes**:
   - **Single Selection**: Only one correct answer (like MCQ_SINGLE)
   - **Multiple Selection**: Multiple correct answers (like MCQ_MULTI)
5. **Visual Editor**: See exactly how your hotspots look on the image
6. **Labeled Areas**: Give each hotspot a descriptive label

### For Students (Taking Exams)

1. **Interactive Image**: Click directly on areas of the image
2. **Visual Feedback**: See which areas you've selected with clear indicators
3. **Hover Effects**: Areas highlight when you hover over them
4. **Clear Instructions**: Know if you need to select one or multiple areas
5. **Selection Summary**: View your selected areas below the image

## How to Create an Interactive Image Question

### Step 1: Add Question
1. Go to the exam creation page
2. Select a section
3. Click "Add Question"
4. Choose **"Interactive Image Question"** from the **"Interactive"** group

### Step 2: Configure Question
1. **Question Text**: Enter instructions (e.g., "Click on the correct body part")
2. **Interaction Type**: Choose "Single Selection" or "Multiple Selection"
3. **Background Image**: Upload your image (JPEG, PNG, etc.)

### Step 3: Add Clickable Areas (Hotspots)
1. Click **"Add Clickable Area"** button
2. For each hotspot, configure:
   - **Label**: Name for the area (e.g., "Heart", "France", "Engine")
   - **X Position (%)**: Horizontal position from left (0-100)
   - **Y Position (%)**: Vertical position from top (0-100)
   - **Width (%)**: Width of the clickable area (1-100)
   - **Height (%)**: Height of the clickable area (1-100)
   - **Correct Answer**: Check this box if this area is a correct answer

### Step 4: Mark Correct Answers
- For **Single Selection**: Check ONLY ONE hotspot as correct
- For **Multiple Selection**: Check ALL correct hotspots

### Step 5: Preview and Save
- Use the preview at the bottom to see how students will see the question
- Click "Save Question" when done

## Example Use Cases

### Example 1: Human Anatomy
**Question**: "Click on the location of the heart"
- Upload a diagram of the human body
- Add a hotspot over the heart area
- Mark it as correct
- Set to "Single Selection"

### Example 2: Geography - Europe
**Question**: "Select all countries in the European Union"
- Upload a map of Europe
- Add hotspots for each EU country
- Mark all EU countries as correct
- Set to "Multiple Selection"

### Example 3: Machine Parts
**Question**: "Click on all moving parts of the engine"
- Upload an engine diagram
- Add hotspots for each moving part (pistons, crankshaft, etc.)
- Mark all moving parts as correct
- Set to "Multiple Selection"

## Tips for Creating Good Interactive Image Questions

### Image Quality
- Use high-resolution images (at least 1200px wide)
- Ensure text in the image is readable
- Use clear, simple diagrams when possible
- Avoid busy backgrounds that might confuse students

### Hotspot Sizing
- Make hotspots large enough to click easily (at least 5% width/height)
- Don't make them too large to avoid accidental clicks
- Leave some space between hotspots when possible

### Hotspot Labels
- Use clear, descriptive labels (e.g., "Heart" not "H")
- Keep labels short (they appear above the hotspot)
- Use consistent naming conventions

### Question Instructions
- Be specific about what to select
- Indicate if multiple selections are required
- Provide context if the image needs explanation

## Technical Details

### Data Structure

**Prompt Format**:
```json
{
  "text": "Question text here",
  "backgroundImage": "/uploads/image.jpg",
  "interactionType": "single" // or "multiple"
}
```

**Options Format**:
```json
{
  "hotspots": [
    {
      "id": "hotspot-1",
      "x": 25,
      "y": 30,
      "width": 15,
      "height": 20,
      "label": "Heart",
      "isCorrect": true
    }
  ]
}
```

**Answer Key Format**:
```json
{
  "correctHotspotIds": ["hotspot-1", "hotspot-2"]
}
```

**Student Answer Format**:
```json
{
  "selectedHotspotIds": ["hotspot-1"]
}
```

### Auto-Scoring

The question is automatically scored:
- **Single Selection**: Student gets 1 point if they selected the correct hotspot
- **Multiple Selection**: Student gets 1 point ONLY if they selected ALL correct hotspots and NO incorrect ones (strict matching)

### Compatibility

This question type works in:
- ✅ All exam categories (IELTS, TOEFL, SAT, GENERAL_ENGLISH, MATH, KIDS)
- ✅ All section types (READING, LISTENING, WRITING, SPEAKING, GRAMMAR, VOCABULARY)
- ✅ Desktop and tablet browsers
- ⚠️ Mobile devices (touchscreen friendly)

## Frequently Asked Questions

**Q: Can I have overlapping hotspots?**
A: Technically yes, but it's not recommended as it can confuse students.

**Q: What image formats are supported?**
A: JPEG, PNG, GIF, and WebP are all supported.

**Q: Can I edit hotspots after creating them?**
A: Yes, you can edit the question to adjust hotspot positions, sizes, and labels.

**Q: What's the maximum number of hotspots?**
A: There's no hard limit, but for usability, we recommend 10 or fewer hotspots per question.

**Q: Can students zoom in on the image?**
A: The image displays at full resolution up to 600px height. Students can click on the image to view it larger in supported browsers.

**Q: How are percentages calculated for positioning?**
A: Percentages are relative to the image dimensions:
- X: 0% = left edge, 100% = right edge
- Y: 0% = top edge, 100% = bottom edge
- Width/Height: Percentage of image width/height

## Troubleshooting

**Problem**: Hotspots don't appear on the image
**Solution**: Make sure you clicked "Add Clickable Area" and saved the question

**Problem**: Image doesn't upload
**Solution**: Check file size (max 10MB) and format (JPEG, PNG, GIF, WebP only)

**Problem**: Hotspots are in the wrong position
**Solution**: Adjust the X and Y percentage values. Remember: X is horizontal, Y is vertical

**Problem**: Students can't click on hotspots
**Solution**: Make sure hotspots are large enough (at least 5% width and height)

**Problem**: Question always scores 0 points
**Solution**: Make sure you checked at least one hotspot as "Correct Answer"

## Updates and Improvements

### Version 1.0 (Current)
- Basic hotspot creation and editing
- Single and multiple selection modes
- Visual preview
- Auto-scoring
- Mobile-friendly touch interface

### Planned Features
- Drag-and-drop hotspot positioning
- Shape options (circle, polygon, custom)
- Image zoom during exam
- Partial credit for multiple selection questions
- Hotspot templates for common use cases

---

**Need Help?** Contact support or refer to the main documentation for more assistance.
