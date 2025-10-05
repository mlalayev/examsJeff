'use client';

import { useState } from 'react';
import { ArrowLeft, Clock, CheckCircle, XCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const mockReadingPassage = `
The Impact of Climate Change on Global Agriculture

Climate change represents one of the most significant challenges facing global agriculture in the 21st century. Rising temperatures, changing precipitation patterns, and increased frequency of extreme weather events are fundamentally altering the conditions under which crops are grown worldwide.

According to recent studies by the Intergovernmental Panel on Climate Change (IPCC), global average temperatures have increased by approximately 1.1°C since pre-industrial times. This warming trend has profound implications for agricultural productivity. In temperate regions, some crops may benefit from longer growing seasons and increased carbon dioxide levels. However, in tropical and subtropical areas, rising temperatures are already causing significant yield reductions for staple crops such as rice, wheat, and maize.

Precipitation patterns are also shifting dramatically. Some regions are experiencing more frequent and intense rainfall, leading to flooding and soil erosion, while others face prolonged droughts that devastate crops and livestock. The United Nations Food and Agriculture Organization (FAO) estimates that climate change could reduce global agricultural productivity by 2-6% per decade, with developing countries bearing the brunt of these impacts.

Adaptation strategies are becoming increasingly important for farmers worldwide. These include developing drought-resistant crop varieties, implementing water-efficient irrigation systems, and adopting sustainable farming practices that enhance soil health and carbon sequestration. However, the effectiveness of these strategies varies significantly depending on local conditions, available resources, and government support.

The economic implications of climate change on agriculture are substantial. Crop failures and reduced yields lead to food price volatility, affecting both producers and consumers. Smallholder farmers, who often lack access to resources and technology, are particularly vulnerable to these changes. International cooperation and investment in agricultural research and development are crucial for building resilience in global food systems.

Despite these challenges, there are opportunities for innovation. Precision agriculture, using technologies such as satellite monitoring and artificial intelligence, can help farmers optimize their practices in response to changing conditions. Additionally, the transition to more sustainable agricultural systems could provide environmental benefits while maintaining or improving productivity.
`;

const questions: Question[] = [
  {
    id: 1,
    question: "According to the passage, what is the approximate global temperature increase since pre-industrial times?",
    options: [
      "0.8°C",
      "1.1°C", 
      "1.5°C",
      "2.0°C"
    ],
    correctAnswer: 1,
    explanation: "The passage states that 'global average temperatures have increased by approximately 1.1°C since pre-industrial times.'"
  },
  {
    id: 2,
    question: "Which regions are most likely to benefit from climate change according to the passage?",
    options: [
      "Tropical regions",
      "Subtropical regions", 
      "Temperate regions",
      "Polar regions"
    ],
    correctAnswer: 2,
    explanation: "The passage mentions that 'In temperate regions, some crops may benefit from longer growing seasons and increased carbon dioxide levels.'"
  },
  {
    id: 3,
    question: "What percentage reduction in global agricultural productivity does the FAO estimate due to climate change?",
    options: [
      "1-3% per decade",
      "2-6% per decade",
      "5-10% per decade", 
      "10-15% per decade"
    ],
    correctAnswer: 1,
    explanation: "The passage states that 'The United Nations Food and Agriculture Organization (FAO) estimates that climate change could reduce global agricultural productivity by 2-6% per decade.'"
  },
  {
    id: 4,
    question: "Which group is mentioned as being particularly vulnerable to climate change impacts?",
    options: [
      "Large-scale commercial farmers",
      "Government agricultural agencies",
      "Smallholder farmers",
      "Agricultural researchers"
    ],
    correctAnswer: 2,
    explanation: "The passage specifically mentions that 'Smallholder farmers, who often lack access to resources and technology, are particularly vulnerable to these changes.'"
  }
];

export default function ReadingPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 * 20); // 20 minutes

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === questions[index].correctAnswer) {
        correct++;
      }
    });
    return { correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) };
  };

  const score = calculateScore();

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Reading Passage */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <BookOpen className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Reading Passage</h2>
            </div>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {mockReadingPassage}
              </p>
            </div>
          </div>

          {/* Questions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Questions</h2>
              <span className="text-sm text-gray-500">
                {currentQuestion + 1} of {questions.length}
              </span>
            </div>

            {!showResults ? (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    {questions[currentQuestion].question}
                  </h3>
                  <div className="space-y-3">
                    {questions[currentQuestion].options.map((option, index) => (
                      <label
                        key={index}
                        className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          answers[currentQuestion] === index
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion}`}
                          value={index}
                          checked={answers[currentQuestion] === index}
                          onChange={() => handleAnswerSelect(currentQuestion, index)}
                          className="sr-only"
                        />
                        <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center mr-3">
                          {answers[currentQuestion] === index && (
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          )}
                        </span>
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                    disabled={currentQuestion === questions.length - 1}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setShowResults(true)}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Submit Answers
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-800 mb-2">
                    {score.percentage}%
                  </div>
                  <div className="text-gray-600">
                    {score.correct} out of {score.total} correct
                  </div>
                </div>

                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">Question {index + 1}</span>
                        {answers[index] === question.correctAnswer ? (
                          <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 ml-2" />
                        )}
                      </div>
                      <p className="text-gray-800 mb-2">{question.question}</p>
                      <p className="text-sm text-gray-600 mb-2">
                        Your answer: {answers[index] !== -1 ? question.options[answers[index]] : 'Not answered'}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Correct answer: {question.options[question.correctAnswer]}
                      </p>
                      <p className="text-sm text-blue-600">{question.explanation}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      setShowResults(false);
                      setCurrentQuestion(0);
                      setAnswers(new Array(questions.length).fill(-1));
                    }}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Retake Test
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
