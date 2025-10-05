# AI Mentor - IELTS Mock Exam Platform

A comprehensive Next.js application for IELTS practice with AI-powered feedback and scoring. Students can practice all four IELTS skills (Reading, Writing, Listening, Speaking) with detailed AI analysis and suggestions for improvement.

## Features

### 🎯 Core Functionality
- **Reading Practice**: Multiple choice questions with academic passages
- **Writing Practice**: Essay writing with AI feedback on structure, grammar, and content
- **Listening Practice**: Audio exercises with comprehension questions
- **Speaking Practice**: Recording functionality with AI pronunciation and fluency analysis

### 🤖 AI Integration
- ChatGPT-powered feedback for writing and speaking sections
- Detailed scoring across multiple criteria
- Personalized improvement suggestions
- Strength and weakness analysis

### 🎨 Modern UI/UX
- Responsive design for all devices
- Clean, intuitive interface
- Real-time progress tracking
- Timer functionality for exam conditions

## Technology Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **UI Components**: Radix UI
- **TypeScript**: Full type safety
- **Audio**: Web Audio API for recording

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd aimentor
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── ai-feedback/     # AI feedback API endpoint
│   ├── reading/            # Reading practice page
│   ├── writing/            # Writing practice page
│   ├── listening/          # Listening practice page
│   ├── speaking/           # Speaking practice page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── lib/
│   └── ai-feedback.ts      # AI feedback utilities
└── components/             # Reusable components
```

## Features by Section

### Reading Section
- Academic passages with comprehension questions
- Multiple choice format
- Instant scoring and explanations
- Progress tracking

### Writing Section
- Task 1 and Task 2 practice
- Word count tracking
- AI feedback on:
  - Task achievement
  - Coherence and cohesion
  - Lexical resource
  - Grammatical range and accuracy

### Listening Section
- Audio player with controls
- Multiple sections (conversations, monologues)
- Question types matching IELTS format
- Time management

### Speaking Section
- Three-part speaking test simulation
- Audio recording with browser permissions
- AI analysis of:
  - Fluency and coherence
  - Lexical resource
  - Grammatical range
  - Pronunciation

## AI Integration

The application includes a mock AI feedback system that can be easily extended to integrate with real AI services:

- **Writing Feedback**: Analyzes essay structure, grammar, vocabulary, and task achievement
- **Speaking Feedback**: Evaluates fluency, pronunciation, and coherence
- **Scoring**: Provides band scores (0-9) for each criterion

To integrate with real AI services:
1. Update the API endpoint in `src/app/api/ai-feedback/route.ts`
2. Modify the feedback functions in `src/lib/ai-feedback.ts`
3. Add your API keys and authentication

## Customization

### Adding New Questions
- Reading: Update the `questions` array in `src/app/reading/page.tsx`
- Listening: Modify `listeningSections` in `src/app/listening/page.tsx`
- Writing: Add new tasks to `writingTasks` in `src/app/writing/page.tsx`
- Speaking: Update `speakingTasks` in `src/app/speaking/page.tsx`

### Styling
- All styling uses Tailwind CSS classes
- Color scheme can be customized in `tailwind.config.js`
- Component styles are in individual page files

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For questions or support, please open an issue in the GitHub repository.

---

**Note**: This is a demo application. For production use, ensure you have proper AI service integration, user authentication, and data persistence.