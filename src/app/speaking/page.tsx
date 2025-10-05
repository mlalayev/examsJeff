'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Clock, Mic, MicOff, Play, Pause, Volume2, Brain, Star } from 'lucide-react';
import Link from 'next/link';
import { getSpeakingFeedback } from '@/lib/ai-feedback';

interface SpeakingTask {
  id: number;
  title: string;
  description: string;
  timeLimit: number;
  prompt: string;
  preparationTime?: number;
}

interface AIFeedback {
  fluency: number;
  coherence: number;
  lexicalResource: number;
  grammaticalRange: number;
  pronunciation: number;
  overallScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

const speakingTasks: SpeakingTask[] = [
  {
    id: 1,
    title: 'Part 1: Introduction and Interview',
    description: 'Answer questions about yourself and familiar topics.',
    timeLimit: 5,
    prompt: 'Tell me about your hometown. What do you like most about it?'
  },
  {
    id: 2,
    title: 'Part 2: Individual Long Turn',
    description: 'Speak for 2 minutes on a given topic.',
    timeLimit: 2,
    preparationTime: 1,
    prompt: 'Describe a memorable trip you have taken. You should say:\n- Where you went\n- Who you went with\n- What you did there\n- And explain why it was memorable'
  },
  {
    id: 3,
    title: 'Part 3: Two-way Discussion',
    description: 'Discuss abstract ideas related to the topic in Part 2.',
    timeLimit: 5,
    prompt: 'Let\'s discuss travel and tourism. Do you think tourism has a positive or negative impact on local communities?'
  }
];

export default function SpeakingPage() {
  const [currentTask, setCurrentTask] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(speakingTasks[currentTask].timeLimit * 60);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0 && isRecording) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTaskChange = (taskIndex: number) => {
    setCurrentTask(taskIndex);
    setTimeLeft(speakingTasks[taskIndex].timeLimit * 60);
    setAudioBlob(null);
    setAudioUrl(null);
    setAiFeedback(null);
    setIsRecording(false);
    setIsPlaying(false);
    setRecordingTime(0);
  };

  const analyzeRecording = async () => {
    if (!audioBlob) return;
    
    setIsAnalyzing(true);
    
    try {
      const feedback = await getSpeakingFeedback(audioBlob);
      setAiFeedback(feedback);
    } catch (error) {
      console.error('Error getting feedback:', error);
      alert('Failed to get AI feedback. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTaskData = speakingTasks[currentTask];

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
            <span className="font-medium">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Speaking Tasks</h2>
              <div className="space-y-3">
                {speakingTasks.map((task, index) => (
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
                      {task.timeLimit} minutes {task.preparationTime && `• ${task.preparationTime} min prep`}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recording Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Recording Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Recording Time:</span>
                  <span className="font-medium">{formatTime(recordingTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Time Remaining:</span>
                  <span className="font-medium">{formatTime(timeLeft)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`font-medium ${isRecording ? 'text-red-600' : 'text-gray-600'}`}>
                    {isRecording ? 'Recording' : 'Stopped'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <Mic className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">
                  {currentTaskData.title}
                </h2>
              </div>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Task Instructions:</h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {currentTaskData.prompt}
                </p>
              </div>

              {/* Recording Controls */}
              <div className="flex items-center justify-center space-x-4 mb-6">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={timeLeft <= 0}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </button>
                
                {audioUrl && (
                  <button
                    onClick={playRecording}
                    className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>
                )}
              </div>

              {/* Audio Player */}
              {audioUrl && (
                <div className="mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <Volume2 className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="text-sm text-gray-600">Your Recording</span>
                  </div>
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full"
                    controls
                  />
                </div>
              )}

              {/* Analysis Button */}
              {audioBlob && !aiFeedback && (
                <div className="text-center">
                  <button
                    onClick={analyzeRecording}
                    disabled={isAnalyzing}
                    className="flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mx-auto"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Get AI Feedback
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* AI Feedback */}
              {aiFeedback && (
                <div className="mt-6 border-t pt-6">
                  <div className="flex items-center mb-4">
                    <Brain className="h-6 w-6 text-purple-600 mr-2" />
                    <h3 className="text-xl font-semibold text-gray-800">AI Feedback</h3>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center mb-2">
                      <Star className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="text-lg font-semibold text-gray-800">
                        Overall Score: {aiFeedback.overallScore}/9
                      </span>
                    </div>
                    <p className="text-gray-700">{aiFeedback.feedback}</p>
                  </div>

                  {/* Detailed Scores */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{aiFeedback.fluency}</div>
                      <div className="text-xs text-gray-600">Fluency</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{aiFeedback.coherence}</div>
                      <div className="text-xs text-gray-600">Coherence</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{aiFeedback.lexicalResource}</div>
                      <div className="text-xs text-gray-600">Lexical Resource</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{aiFeedback.grammaticalRange}</div>
                      <div className="text-xs text-gray-600">Grammar</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{aiFeedback.pronunciation}</div>
                      <div className="text-xs text-gray-600">Pronunciation</div>
                    </div>
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

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => {
                        setAudioBlob(null);
                        setAudioUrl(null);
                        setAiFeedback(null);
                        setRecordingTime(0);
                      }}
                      className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Record Again
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
    </div>
  );
}
