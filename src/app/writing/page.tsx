'use client';

import { useState } from 'react';
import { ArrowLeft, Clock, Send, PenTool, Brain, Star } from 'lucide-react';
import Link from 'next/link';
import { getWritingFeedback } from '@/lib/ai-feedback';

interface AIFeedback {
  score: number;
  feedback: string;
  suggestions: string[];
  strengths: string[];
  improvements: string[];
}

const writingTasks = [
  {
    id: 1,
    type: 'Task 1',
    title: 'Academic Writing Task 1',
    description: 'Write a report describing the information shown in the chart below.',
    timeLimit: 20,
    wordCount: 150,
    prompt: `The chart below shows the percentage of households in different income brackets in Country X from 2010 to 2020.

Write a report for a university lecturer describing the information shown in the chart.

You should:
- Summarize the main trends
- Make comparisons where relevant
- Write at least 150 words

[Note: In a real implementation, you would include an actual chart image here]`
  },
  {
    id: 2,
    type: 'Task 2',
    title: 'Academic Writing Task 2',
    description: 'Write an essay responding to the given question.',
    timeLimit: 40,
    wordCount: 250,
    prompt: `Some people believe that technology has made our lives more complicated, while others argue that it has simplified our daily routines.

Discuss both views and give your own opinion.

You should:
- Present both sides of the argument
- Give your own opinion with reasons
- Use examples to support your ideas
- Write at least 250 words`
  }
];

export default function WritingPage() {
  const [currentTask, setCurrentTask] = useState(0);
  const [essay, setEssay] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
  const [timeLeft, setTimeLeft] = useState(writingTasks[currentTask].timeLimit * 60);

  const handleTaskChange = (taskIndex: number) => {
    setCurrentTask(taskIndex);
    setEssay('');
    setAiFeedback(null);
    setTimeLeft(writingTasks[taskIndex].timeLimit * 60);
  };

  const handleSubmit = async () => {
    if (!essay.trim()) {
      alert('Please write your essay before submitting.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const feedback = await getWritingFeedback(essay);
      setAiFeedback(feedback);
    } catch (error) {
      console.error('Error getting feedback:', error);
      alert('Failed to get AI feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const wordCount = essay.trim().split(/\s+/).filter(word => word.length > 0).length;
  const isWordCountMet = wordCount >= writingTasks[currentTask].wordCount;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center text-gray-600">
            <Clock className="h-5 w-5 mr-2" />
            <span className="font-medium">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Writing Tasks</h2>
              <div className="space-y-3">
                {writingTasks.map((task, index) => (
                  <button
                    key={task.id}
                    onClick={() => handleTaskChange(index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      currentTask === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-800">{task.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      {task.timeLimit} minutes • {task.wordCount} words minimum
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Word Count */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Word Count</span>
                <span className={`text-sm font-bold ${isWordCountMet ? 'text-green-600' : 'text-red-600'}`}>
                  {wordCount} / {writingTasks[currentTask].wordCount}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isWordCountMet ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, (wordCount / writingTasks[currentTask].wordCount) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Writing Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <PenTool className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">
                  {writingTasks[currentTask].title}
                </h2>
              </div>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Task Instructions:</h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {writingTasks[currentTask].prompt}
                </p>
              </div>

              <textarea
                value={essay}
                onChange={(e) => setEssay(e.target.value)}
                placeholder="Start writing your essay here..."
                className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Minimum {writingTasks[currentTask].wordCount} words required
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!isWordCountMet || isSubmitting}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit for AI Review
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Feedback */}
            {aiFeedback && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <Brain className="h-6 w-6 text-purple-600 mr-2" />
                  <h3 className="text-xl font-semibold text-gray-800">AI Feedback</h3>
                </div>

                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <Star className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="text-lg font-semibold text-gray-800">Overall Score: {aiFeedback.score}/9</span>
                  </div>
                  <p className="text-gray-700">{aiFeedback.feedback}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-3">Strengths</h4>
                    <ul className="space-y-2">
                      {aiFeedback.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700 text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-orange-600 mb-3">Areas for Improvement</h4>
                    <ul className="space-y-2">
                      {aiFeedback.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700 text-sm">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold text-blue-600 mb-3">Specific Suggestions</h4>
                  <ul className="space-y-2">
                    {aiFeedback.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      setEssay('');
                      setAiFeedback(null);
                    }}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <Link
                    href="/"
                    className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-700 transition-colors text-center"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
