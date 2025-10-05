'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Clock, Play, Pause, Volume2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const listeningSections = [
  {
    id: 1,
    title: 'Section 1: Conversation',
    description: 'A conversation between two people in an everyday social context.',
    duration: 5,
    audioUrl: '/api/audio/section1', // Placeholder - would be actual audio file
    questions: [
      {
        id: 1,
        question: "What is the man's main reason for calling?",
        options: [
          "To book a hotel room",
          "To cancel a reservation", 
          "To change a booking",
          "To ask about facilities"
        ],
        correctAnswer: 0,
        explanation: "The man mentions he wants to book a room for the weekend."
      },
      {
        id: 2,
        question: "How many nights does the man want to stay?",
        options: [
          "One night",
          "Two nights",
          "Three nights",
          "Four nights"
        ],
        correctAnswer: 1,
        explanation: "The man specifically asks for 'Friday and Saturday night' which is two nights."
      }
    ]
  },
  {
    id: 2,
    title: 'Section 2: Monologue',
    description: 'A talk by one person about a general topic.',
    duration: 8,
    audioUrl: '/api/audio/section2',
    questions: [
      {
        id: 3,
        question: "What is the main topic of the talk?",
        options: [
          "University facilities",
          "Student accommodation",
          "Campus security",
          "Library services"
        ],
        correctAnswer: 0,
        explanation: "The speaker introduces the topic as 'campus facilities and services'."
      },
      {
        id: 4,
        question: "When is the library open on weekends?",
        options: [
          "9 AM to 5 PM",
          "10 AM to 6 PM",
          "8 AM to 4 PM",
          "11 AM to 7 PM"
        ],
        correctAnswer: 1,
        explanation: "The speaker clearly states 'weekend hours are 10 AM to 6 PM'."
      }
    ]
  }
];

export default function ListeningPage() {
  const [currentSection, setCurrentSection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(4).fill(-1));
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes total
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentQuestions = listeningSections[currentSection].questions;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          setShowResults(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      const allQuestions = listeningSections.flatMap(section => section.questions);
      if (answer === allQuestions[index].correctAnswer) {
        correct++;
      }
    });
    return { correct, total: answers.length, percentage: Math.round((correct / answers.length) * 100) };
  };

  const score = calculateScore();

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
          {/* Audio Player */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Volume2 className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">
                {listeningSections[currentSection].title}
              </h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              {listeningSections[currentSection].description}
            </p>

            {/* Audio Controls */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-4">
                <button
                  onClick={handlePlayPause}
                  className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-1" />
                  )}
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Section Navigation */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-800 mb-3">Sections</h3>
              {listeningSections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(index)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                    currentSection === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-800">{section.title}</div>
                  <div className="text-sm text-gray-600">{section.description}</div>
                  <div className="text-xs text-gray-500">{section.duration} minutes</div>
                </button>
              ))}
            </div>

            {/* Hidden Audio Element */}
            <audio
              ref={audioRef}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              src={listeningSections[currentSection].audioUrl}
            />
          </div>

          {/* Questions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Questions</h2>
              <span className="text-sm text-gray-500">
                Section {currentSection + 1}
              </span>
            </div>

            {!showResults ? (
              <div className="space-y-6">
                {currentQuestions.map((question, index) => {
                  const globalIndex = listeningSections.slice(0, currentSection).reduce((acc, section) => acc + section.questions.length, 0) + index;
                  return (
                    <div key={question.id} className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">
                        {globalIndex + 1}. {question.question}
                      </h3>
                      <div className="space-y-3">
                        {question.options.map((option, optionIndex) => (
                          <label
                            key={optionIndex}
                            className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                              answers[globalIndex] === optionIndex
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${globalIndex}`}
                              value={optionIndex}
                              checked={answers[globalIndex] === optionIndex}
                              onChange={() => handleAnswerSelect(globalIndex, optionIndex)}
                              className="sr-only"
                            />
                            <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center mr-3">
                              {answers[globalIndex] === optionIndex && (
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              )}
                            </span>
                            <span className="text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}

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
                  {listeningSections.flatMap(section => section.questions).map((question, index) => (
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
                      setAnswers(new Array(4).fill(-1));
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
