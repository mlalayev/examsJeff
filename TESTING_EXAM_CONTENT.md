# Quick Testing Guide for Exam Content

Follow these steps to test the exam content management system.

## Prerequisites

1. Dev server running: `npm run dev`
2. Logged in as TEACHER
3. Have your browser's developer tools open (F12) to get session cookie

## Step 1: Get Your Session Cookie

1. Open browser DevTools (F12)
2. Go to Application/Storage → Cookies
3. Find `next-auth.session-token` or similar
4. Copy the entire cookie header (or use fetch in console - easier!)

## Step 2: Create Exam with Sections (Using Browser Console)

**Option A: Using Browser Console (Easiest)**

1. While logged in as teacher, open browser console (F12)
2. Paste and run:

```javascript
const createExam = async () => {
  const response = await fetch('/api/exams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'IELTS Academic Mock Exam #1',
      examType: 'IELTS',
      sections: [
        { type: 'READING', durationMin: 60, order: 0 },
        { type: 'LISTENING', durationMin: 30, order: 1 },
        { type: 'WRITING', durationMin: 60, order: 2 },
        { type: 'SPEAKING', durationMin: 15, order: 3 }
      ]
    })
  });
  const data = await response.json();
  console.log('✅ Exam created:', data);
  return data.exam.id; // Save this ID!
};

const examId = await createExam();
console.log('📝 Your Exam ID:', examId);
```

3. **Save the Exam ID** from console output!

## Step 3: Import Questions

```javascript
const importQuestions = async (examId) => {
  const questions = {
    items: [
      {
        sectionType: 'READING',
        qtype: 'multiple_choice',
        prompt: {
          text: 'What is the main idea of the passage?',
          passage: 'Climate change is one of the most pressing issues of our time. Scientists around the world have documented rising temperatures, melting ice caps, and extreme weather events. The scientific consensus is clear: human activities are the primary cause of recent climate changes.'
        },
        options: {
          A: 'Climate change is not real',
          B: 'Climate change is a pressing global issue caused by human activities',
          C: 'Climate change only affects polar regions',
          D: 'Scientists disagree about climate change'
        },
        answerKey: {
          correct: 'B',
          explanation: 'The passage clearly states that climate change is a pressing issue and human activities are the primary cause.'
        },
        maxScore: 1,
        order: 1
      },
      {
        sectionType: 'READING',
        qtype: 'true_false_not_given',
        prompt: {
          text: 'The passage states that renewable energy is the only solution to climate change.',
          passage: 'Climate change is one of the most pressing issues of our time...'
        },
        answerKey: {
          correct: 'NOT GIVEN',
          explanation: 'The passage does not mention solutions or renewable energy.'
        },
        maxScore: 1,
        order: 2
      },
      {
        sectionType: 'READING',
        qtype: 'fill_in_blank',
        prompt: {
          text: 'Scientists around the world have documented rising _____, melting ice caps, and extreme weather events.',
          passage: 'Climate change is one of the most pressing issues of our time...'
        },
        answerKey: {
          correct: ['temperatures', 'temperature']
        },
        maxScore: 1,
        order: 3
      },
      {
        sectionType: 'LISTENING',
        qtype: 'multiple_choice',
        prompt: {
          text: 'What is the speaker\'s main recommendation?',
          audioUrl: 'https://example.com/audio/lecture1.mp3'
        },
        options: {
          A: 'Take comprehensive notes',
          B: 'Read the textbook first',
          C: 'Join a study group',
          D: 'All of the above'
        },
        answerKey: {
          correct: 'D'
        },
        maxScore: 1,
        order: 4
      },
      {
        sectionType: 'LISTENING',
        qtype: 'note_completion',
        prompt: {
          text: 'Complete the notes: Main topic: _____',
          audioUrl: 'https://example.com/audio/lecture2.mp3'
        },
        answerKey: {
          correct: ['Environmental Conservation', 'environment']
        },
        maxScore: 1,
        order: 5
      },
      {
        sectionType: 'WRITING',
        qtype: 'essay',
        prompt: {
          text: 'Some people believe that technology has made our lives more complicated rather than simpler. To what extent do you agree or disagree? Give reasons for your answer and include relevant examples from your own knowledge or experience.',
          wordLimit: 250,
          timeLimit: 40
        },
        answerKey: {
          rubric: {
            taskResponse: 'Addresses all parts of the task with a clear position',
            coherence: 'Logical organization with clear progression',
            lexicalResource: 'Wide range of vocabulary used flexibly',
            grammaticalRange: 'Wide range of structures with few errors'
          }
        },
        maxScore: 9,
        order: 6
      },
      {
        sectionType: 'WRITING',
        qtype: 'essay',
        prompt: {
          text: 'The chart below shows the percentage of households with internet access in different countries between 2010 and 2020. Summarize the information by selecting and reporting the main features.',
          wordLimit: 150,
          timeLimit: 20,
          chartUrl: 'https://example.com/charts/internet-access.png'
        },
        answerKey: {
          rubric: {
            taskAchievement: 'Covers key features and overview',
            coherence: 'Logical organization',
            lexicalResource: 'Appropriate vocabulary for data description',
            grammaticalRange: 'Accurate structures'
          }
        },
        maxScore: 9,
        order: 7
      },
      {
        sectionType: 'SPEAKING',
        qtype: 'short_answer',
        prompt: {
          text: 'Part 1: Let\'s talk about your hometown. Where is your hometown? What is it famous for? Do you enjoy living there?'
        },
        answerKey: {
          criteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range and Accuracy', 'Pronunciation'],
          duration: '4-5 minutes'
        },
        maxScore: 9,
        order: 8
      },
      {
        sectionType: 'SPEAKING',
        qtype: 'long_answer',
        prompt: {
          text: 'Part 2: Describe a memorable journey you have taken. You should say: where you went, who you went with, what you did there, and explain why it was memorable.',
          preparationTime: 1,
          speakingTime: 2
        },
        answerKey: {
          criteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range and Accuracy', 'Pronunciation']
        },
        maxScore: 9,
        order: 9
      },
      {
        sectionType: 'SPEAKING',
        qtype: 'discussion',
        prompt: {
          text: 'Part 3: Let\'s discuss travel and tourism. How has tourism changed in your country over the years? What are the benefits and drawbacks of tourism?'
        },
        answerKey: {
          criteria: ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range and Accuracy', 'Pronunciation'],
          duration: '4-5 minutes'
        },
        maxScore: 9,
        order: 10
      }
    ]
  };

  const response = await fetch(`/api/exams/${examId}/questions/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(questions)
  });
  const data = await response.json();
  console.log('✅ Questions imported:', data);
};

await importQuestions(examId);
```

## Step 4: Import Band Mappings

```javascript
const importBands = async () => {
  const bands = {
    items: [
      // IELTS Reading band scores
      { examType: 'IELTS', section: 'READING', minRaw: 0, maxRaw: 2, band: 2.0 },
      { examType: 'IELTS', section: 'READING', minRaw: 3, maxRaw: 5, band: 3.0 },
      { examType: 'IELTS', section: 'READING', minRaw: 6, maxRaw: 9, band: 4.0 },
      { examType: 'IELTS', section: 'READING', minRaw: 10, maxRaw: 14, band: 5.0 },
      { examType: 'IELTS', section: 'READING', minRaw: 15, maxRaw: 22, band: 6.0 },
      { examType: 'IELTS', section: 'READING', minRaw: 23, maxRaw: 29, band: 7.0 },
      { examType: 'IELTS', section: 'READING', minRaw: 30, maxRaw: 34, band: 8.0 },
      { examType: 'IELTS', section: 'READING', minRaw: 35, maxRaw: 40, band: 9.0 },
      // IELTS Listening band scores
      { examType: 'IELTS', section: 'LISTENING', minRaw: 0, maxRaw: 2, band: 2.0 },
      { examType: 'IELTS', section: 'LISTENING', minRaw: 3, maxRaw: 5, band: 3.0 },
      { examType: 'IELTS', section: 'LISTENING', minRaw: 6, maxRaw: 9, band: 4.0 },
      { examType: 'IELTS', section: 'LISTENING', minRaw: 10, maxRaw: 15, band: 5.0 },
      { examType: 'IELTS', section: 'LISTENING', minRaw: 16, maxRaw: 22, band: 6.0 },
      { examType: 'IELTS', section: 'LISTENING', minRaw: 23, maxRaw: 29, band: 7.0 },
      { examType: 'IELTS', section: 'LISTENING', minRaw: 30, maxRaw: 34, band: 8.0 },
      { examType: 'IELTS', section: 'LISTENING', minRaw: 35, maxRaw: 40, band: 9.0 }
    ]
  };

  const response = await fetch('/api/bands/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bands)
  });
  const data = await response.json();
  console.log('✅ Band mappings imported:', data);
};

await importBands();
```

## Step 5: Verify

```javascript
// Get exam sections
const sections = await fetch(`/api/exams/${examId}/sections`).then(r => r.json());
console.log('📚 Sections:', sections);

// Get all questions
const allQuestions = await fetch(`/api/exams/${examId}/questions`).then(r => r.json());
console.log('❓ All Questions:', allQuestions);

// Get reading questions only
const readingQuestions = await fetch(`/api/exams/${examId}/questions?section=READING`).then(r => r.json());
console.log('📖 Reading Questions:', readingQuestions);

// Get exam list
const exams = await fetch('/api/exams').then(r => r.json());
console.log('📝 All Exams:', exams);
```

## Expected Results

✅ Exam created with 4 sections (Reading, Listening, Writing, Speaking)  
✅ 10 questions imported (3 Reading, 2 Listening, 2 Writing, 3 Speaking)  
✅ 16 band mappings imported (8 Reading + 8 Listening)  
✅ Questions can be filtered by section  
✅ Exam appears in teacher's exam list

## Troubleshooting

**"Unauthorized" error:**
- Make sure you're logged in as TEACHER
- Try refreshing the page and running commands again

**"Exam not found" error:**
- Double-check the `examId` variable
- Make sure exam was created successfully

**Validation errors:**
- Check the JSON structure matches the schema
- Ensure all required fields are present
- Verify enum values (READING, LISTENING, WRITING, SPEAKING)

## Next Steps

Now that you have exam content:
1. View exams in teacher dashboard
2. Assign exams to students
3. Build student exam-taking interface
4. Implement auto-grading for Reading/Listening
5. Build teacher grading interface for Writing/Speaking

## Complete Test Script

Run everything at once:

```javascript
// Complete test
const testExamContent = async () => {
  console.log('🚀 Starting exam content test...\n');
  
  // 1. Create exam
  console.log('1️⃣ Creating exam...');
  const examResponse = await fetch('/api/exams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'IELTS Academic Mock Exam #1',
      examType: 'IELTS',
      sections: [
        { type: 'READING', durationMin: 60, order: 0 },
        { type: 'LISTENING', durationMin: 30, order: 1 },
        { type: 'WRITING', durationMin: 60, order: 2 },
        { type: 'SPEAKING', durationMin: 15, order: 3 }
      ]
    })
  });
  const exam = await examResponse.json();
  console.log('✅ Exam created:', exam.exam.id);
  
  const examId = exam.exam.id;
  
  // 2. Import questions (abbreviated for brevity - use full version above)
  console.log('\n2️⃣ Importing questions...');
  // ... (paste import code here)
  
  // 3. Import bands
  console.log('\n3️⃣ Importing band mappings...');
  // ... (paste import code here)
  
  // 4. Verify
  console.log('\n4️⃣ Verifying...');
  const sections = await fetch(`/api/exams/${examId}/sections`).then(r => r.json());
  const questions = await fetch(`/api/exams/${examId}/questions`).then(r => r.json());
  
  console.log(`✅ Complete! Exam has ${sections.sections.length} sections and ${questions.questions.length} questions`);
  
  return examId;
};

await testExamContent();
```

That's it! You've successfully set up exam content. 🎉


