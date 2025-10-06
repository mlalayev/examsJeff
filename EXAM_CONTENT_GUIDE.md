# Exam Content Management Guide

This guide explains how to create exams, add sections, and import questions using the API.

## Overview

The system supports:
- **Exam Types**: IELTS, TOEFL, SAT (customizable)
- **Section Types**: READING, LISTENING, WRITING, SPEAKING
- **Question Types**: multiple_choice, true_false_not_given, fill_in_blank, essay, short_answer, matching, note_completion, summary_completion, etc.
- **Bulk Import**: Import many questions at once via JSON

## Database Structure

```
Exam
├── sections (ExamSection[])
│   ├── type: READING | LISTENING | WRITING | SPEAKING
│   ├── durationMin: number
│   └── order: number
└── questions (Question[])
    ├── sectionType: READING | LISTENING | WRITING | SPEAKING
    ├── qtype: string (e.g., "multiple_choice")
    ├── prompt: JSON (question text + context)
    ├── options: JSON (for multiple choice, matching, etc.)
    ├── answerKey: JSON (correct answer(s) + rubric)
    ├── maxScore: number
    └── order: number

BandMap (for scoring)
├── examType: string (e.g., "IELTS")
├── section: READING | LISTENING | WRITING | SPEAKING
├── minRaw: number (minimum raw score)
├── maxRaw: number (maximum raw score)
└── band: number (0-9 for IELTS)
```

## API Endpoints

### 1. Create Exam with Sections

**POST** `/api/exams`

```json
{
  "title": "IELTS Academic Mock Exam #1",
  "examType": "IELTS",
  "sections": [
    {
      "type": "READING",
      "durationMin": 60,
      "order": 0
    },
    {
      "type": "LISTENING",
      "durationMin": 30,
      "order": 1
    },
    {
      "type": "WRITING",
      "durationMin": 60,
      "order": 2
    },
    {
      "type": "SPEAKING",
      "durationMin": 15,
      "order": 3
    }
  ]
}
```

### 2. Get Exam Sections

**GET** `/api/exams/:id/sections`

Returns all sections for an exam, ordered by `order` field.

### 3. Get Questions

**GET** `/api/exams/:id/questions?section=READING`

Query parameters:
- `section` (optional): Filter by section type

### 4. Import Questions (Bulk)

**POST** `/api/exams/:id/questions/import`

```json
{
  "items": [
    {
      "sectionType": "READING",
      "qtype": "multiple_choice",
      "prompt": {
        "text": "What is the main idea?",
        "passage": "The full passage text here..."
      },
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      },
      "answerKey": {
        "correct": "B"
      },
      "maxScore": 1,
      "order": 1
    }
  ]
}
```

See `examples/questions-import-example.json` for more question types.

### 5. Import Band Mappings

**POST** `/api/bands/import`

```json
{
  "items": [
    {
      "examType": "IELTS",
      "section": "READING",
      "minRaw": 0,
      "maxRaw": 2,
      "band": 2.0
    },
    {
      "examType": "IELTS",
      "section": "READING",
      "minRaw": 3,
      "maxRaw": 5,
      "band": 3.0
    }
  ]
}
```

See `examples/band-map-import-example.json` for complete mapping.

## Question Types & Formats

### 1. Multiple Choice

```json
{
  "qtype": "multiple_choice",
  "prompt": {
    "text": "Question text",
    "passage": "Context/passage if needed"
  },
  "options": {
    "A": "Choice A",
    "B": "Choice B",
    "C": "Choice C",
    "D": "Choice D"
  },
  "answerKey": {
    "correct": "B"
  }
}
```

### 2. True/False/Not Given

```json
{
  "qtype": "true_false_not_given",
  "prompt": {
    "text": "Statement to verify",
    "passage": "Reference passage"
  },
  "answerKey": {
    "correct": "NOT GIVEN"
  }
}
```

### 3. Fill in the Blank

```json
{
  "qtype": "fill_in_blank",
  "prompt": {
    "text": "The capital of France is _____."
  },
  "answerKey": {
    "correct": ["Paris", "paris"]
  }
}
```

### 4. Essay (Writing)

```json
{
  "qtype": "essay",
  "prompt": {
    "text": "Essay prompt here...",
    "wordLimit": 250,
    "timeLimit": 40
  },
  "answerKey": {
    "rubric": {
      "taskResponse": "Criteria description",
      "coherence": "Criteria description",
      "lexicalResource": "Criteria description",
      "grammaticalRange": "Criteria description"
    }
  },
  "maxScore": 9
}
```

### 5. Short Answer (Speaking)

```json
{
  "qtype": "short_answer",
  "prompt": {
    "text": "Describe your hometown..."
  },
  "answerKey": {
    "criteria": ["Fluency", "Vocabulary", "Grammar", "Pronunciation"]
  },
  "maxScore": 9
}
```

### 6. Matching

```json
{
  "qtype": "matching",
  "prompt": {
    "text": "Match items with descriptions",
    "items": ["Item 1", "Item 2", "Item 3"]
  },
  "options": {
    "A": "Description A",
    "B": "Description B",
    "C": "Description C"
  },
  "answerKey": {
    "correct": {
      "Item 1": "A",
      "Item 2": "C",
      "Item 3": "B"
    }
  }
}
```

## Testing with cURL

### Create Exam

```bash
curl -X POST http://localhost:3000/api/exams \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "title": "IELTS Academic Mock #1",
    "examType": "IELTS",
    "sections": [
      {"type": "READING", "durationMin": 60, "order": 0},
      {"type": "LISTENING", "durationMin": 30, "order": 1},
      {"type": "WRITING", "durationMin": 60, "order": 2},
      {"type": "SPEAKING", "durationMin": 15, "order": 3}
    ]
  }'
```

### Import Questions

```bash
curl -X POST http://localhost:3000/api/exams/YOUR_EXAM_ID/questions/import \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d @examples/questions-import-example.json
```

### Import Band Mappings

```bash
curl -X POST http://localhost:3000/api/bands/import \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d @examples/band-map-import-example.json
```

## Best Practices

1. **Order Questions Logically**: Use the `order` field to sequence questions within each section
2. **Consistent Question Types**: Use standard `qtype` values for easier processing
3. **Rich Prompts**: Include all necessary context in the `prompt` JSON
4. **Flexible Answer Keys**: Store multiple acceptable answers when appropriate
5. **Score Appropriately**: Set `maxScore` based on question difficulty

## Workflow

1. **Create Exam** with sections (4 sections for IELTS)
2. **Import Questions** in bulk (10+ questions per section)
3. **Import Band Mappings** for READING and LISTENING
4. **Verify** using GET endpoints
5. **Assign** to students via booking system

## Next Steps

- [ ] Create exams with all 4 sections
- [ ] Import 10+ questions per section
- [ ] Import band mappings for automated scoring
- [ ] Test question retrieval with section filters
- [ ] Integrate with student exam-taking interface

## Notes

- All JSON fields (`prompt`, `options`, `answerKey`) are flexible - add any custom fields you need
- Writing and Speaking typically require manual grading (teacher review)
- Reading and Listening can be auto-graded using `answerKey`
- Band mappings convert raw scores to band scores (e.g., 30/40 correct = Band 7.0)


