"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Loader2,
  Lock,
  Save,
  Send
} from "lucide-react";
import AudioPlayer from "@/components/audio/AudioPlayer";
import QDndGroup from "@/components/questions/QDndGroup";
import { QOpenText } from "@/components/questions/QOpenText";
import { QMcqSingle } from "@/components/questions/QMcqSingle";
import { QMcqMulti } from "@/components/questions/QMcqMulti";
import { QTF } from "@/components/questions/QTF";
import { QInlineSelect } from "@/components/questions/QInlineSelect";
import { QDndGap } from "@/components/questions/QDndGap";
import { QOrderSentence } from "@/components/questions/QOrderSentence";

interface Question {
  id: string;
  qtype: string;
  prompt: any;
  options: any;
  answerKey: any;
  order: number;
  maxScore: number;
}

interface Section {
  id: string;
  type: string;
  title: string;
  questions: Question[];
  order: number;
  status?: string;
  audio?: string | null;
}

interface AttemptData {
  id: string;
  examTitle: string;
  status: string;
  sections: Section[];
  savedAnswers: Record<string, Record<string, any>>;
}

export default function AttemptRunnerPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const [data, setData] = useState<AttemptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, Record<string, any>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lockedSections, setLockedSections] = useState<Set<string>>(new Set());

  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchAttempt();
  }, [attemptId]);

  const fetchAttempt = async () => {
    try {
      const res = await fetch(`/api/attempts/${attemptId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      
      console.log("Attempt data:", json);
      setData(json);
      setAnswers(json.savedAnswers || {});
      
      // Set first section as active
      if (json.sections && json.sections.length > 0) {
        setActiveSection(json.sections[0].type);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load exam");
      router.push("/dashboard/student/exams");
    } finally {
      setLoading(false);
    }
  };

  const saveSection = useCallback(
    async (sectionType: string, answersToSave: Record<string, any>) => {
      setSaving(sectionType);
      try {
        const res = await fetch(`/api/attempts/${attemptId}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionType,
            answers: answersToSave,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to save");
        setLastSaved(new Date());
      } catch (e) {
        console.error(e);
      } finally {
        setSaving(null);
      }
    },
    [attemptId]
  );

  const setAnswer = (sectionType: string, questionId: string, value: any) => {
    if (lockedSections.has(sectionType)) return;

    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [sectionType]: { ...(prev[sectionType] || {}), [questionId]: value },
      };

      // Debounced autosave (3 seconds)
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      autosaveTimerRef.current = setTimeout(() => {
        saveSection(sectionType, newAnswers[sectionType]);
      }, 3000);

      return newAnswers;
    });
  };

  const handleEndSection = async (sectionType: string) => {
    if (!confirm(`Are you sure you want to end the ${sectionType} section? You won't be able to edit it after.`)) {
      return;
    }

    // Save current answers first
    await saveSection(sectionType, answers[sectionType] || {});
    
    // Lock section
    setLockedSections((prev) => new Set([...prev, sectionType]));
  };

  const handleSubmit = async () => {
    if (!confirm("Submit your exam? You cannot change answers after submission.")) {
      return;
    }

    setSubmitting(true);
    try {
      // IMPORTANT: Save all sections before submitting
      const savePromises = Object.keys(answers).map(sectionType => 
        saveSection(sectionType, answers[sectionType] || {})
      );
      await Promise.all(savePromises);
      
      // Now submit
      const res = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        console.error("Submit error response:", json);
        const errorMsg = json.details ? `${json.error}: ${json.details}` : (json.error || "Failed to submit");
        throw new Error(errorMsg);
      }

      alert("Exam submitted successfully!");
      router.push(`/attempts/${attemptId}/results`);
    } catch (err: any) {
      console.error("Submit error:", err);
      alert(err.message || "Failed to submit exam");
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionComponent = (q: Question, value: any, onChange: (v: any) => void, readOnly: boolean, showWordBank?: boolean) => {
    const props = { question: q, value, onChange, readOnly, showWordBank };

    switch (q.qtype) {
      case "MCQ_SINGLE":
        return <QMcqSingle {...props} />;
      case "MCQ_MULTI":
        return <QMcqMulti {...props} />;
      case "TF":
        return <QTF {...props} />;
      case "INLINE_SELECT":
        return <QInlineSelect {...props} />;
      case "GAP":
        // Normal gap_fill uses QOpenText (text input field)
        // For preposition/time expression questions with multiple blanks, use QDndGap
        if (q.prompt?.text && q.prompt.text.includes('________')) {
          return <QDndGap {...props} />;
        }
        // All other GAP questions use QOpenText for text input
        return <QOpenText {...props} />;
      case "ORDER_SENTENCE":
        return <QOrderSentence {...props} />;
      case "DND_GAP":
        return <QDndGap {...props} />;
      case "OPEN_TEXT":
      case "SHORT_TEXT":
        return <QOpenText {...props} />;
       case "ESSAY":
         return (
           <textarea
             value={value || ""}
             onChange={(e) => onChange(e.target.value)}
             disabled={readOnly}
             className="mt-2 w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 min-h-[150px] disabled:bg-gray-50"
             placeholder="Write your essay here"
           />
         );
       default:
         return <div className="text-sm text-gray-500">Unsupported question type: {q.qtype}</div>;
    }
  };

  const getShortSectionTitle = (title: string) => {
    const shortTitles: Record<string, string> = {
      'READING': 'Reading',
      'LISTENING': 'Listening', 
      'WRITING': 'Writing',
      'SPEAKING': 'Speaking',
      'GRAMMAR': 'Grammar',
      'VOCABULARY': 'Vocabulary',
      'Reading Comprehension': 'Reading',
      'Listening Comprehension': 'Listening',
      'Writing Task': 'Writing',
      'Speaking Task': 'Speaking',
      'Grammar Exercise': 'Grammar',
      'Vocabulary Test': 'Vocabulary',
      'Reading Section': 'Reading',
      'Listening Section': 'Listening',
      'Writing Section': 'Writing',
      'Speaking Section': 'Speaking',
      'Grammar Section': 'Grammar',
      'Vocabulary Section': 'Vocabulary'
    };
    
    return shortTitles[title] || title.substring(0, 10) + (title.length > 10 ? '...' : '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-3">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Skeleton */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="rounded-xl shadow-sm border p-4 bg-white border-gray-200">
                {/* Exam Info Skeleton */}
                <div className="mb-4">
                  <div className="h-5 bg-gray-400 rounded w-32 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-400 rounded w-24 mb-3 animate-pulse"></div>
                  <div className="h-2 bg-gray-400 rounded w-full mb-1 animate-pulse"></div>
                  <div className="h-2 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                </div>
                
                {/* Sections List Skeleton */}
                <div className="space-y-2 flex-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-400 rounded animate-pulse"></div>
                          <div className="h-4 bg-gray-400 rounded w-20 animate-pulse"></div>
                        </div>
                        <div className="w-4 h-4 bg-gray-400 rounded animate-pulse"></div>
                      </div>
                      <div className="h-3 bg-gray-400 rounded w-16 animate-pulse"></div>
                    </div>
                  ))}
                </div>
                
                {/* Submit Button Skeleton */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="h-12 bg-gray-400 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Questions Area Skeleton */}
            <div className="flex-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {/* Title Skeleton */}
                <div className="mb-6">
                  <div className="h-8 bg-gray-400 rounded w-48 animate-pulse"></div>
                </div>
                
                {/* Questions Skeleton */}
                <div className="space-y-5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gray-400 rounded-lg animate-pulse"></div>
                        <div className="flex-1 space-y-3">
                          <div className="h-4 bg-gray-400 rounded w-full animate-pulse"></div>
                          <div className="h-4 bg-gray-400 rounded w-5/6 animate-pulse"></div>
                          <div className="h-20 bg-gray-300 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Exam not found</p>
      </div>
    );
  }

  if (!data.sections || data.sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No sections found for this exam</p>
          <p className="text-sm text-gray-400">Please contact your teacher</p>
        </div>
      </div>
    );
  }

  const currentSection = data.sections?.find((s) => s.type === activeSection);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-3">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Section Tabs - Sidebar on desktop, horizontal on mobile */}
          <div className="lg:w-64 flex-shrink-0">
             <div className="rounded-xl shadow-sm border p-4 sticky top-3 flex flex-col h-[calc(100vh-1.5rem)]"
                  style={{
                    backgroundColor: 'rgba(48, 51, 128, 0.01)',
                    borderColor: 'rgba(48, 51, 128, 0.1)'
                  }}>
              {/* Exam Info - Top */}
              <div className="mb-4">
                <h2 className="text-sm font-semibold mb-1 truncate" title={data.examTitle}
                    style={{ color: 'rgba(48, 51, 128, 0.9)' }}>
                  {data.examTitle}
                </h2>
                <p className="text-xs" style={{ color: 'rgba(48, 51, 128, 0.6)' }}>Exam Sections</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1"
                       style={{ color: 'rgba(48, 51, 128, 0.7)' }}>
                    <span>Progress</span>
                    <span>
                      {data.sections?.reduce((total, section) => {
                        const sectionAnswers = answers[section.type] || {};
                        const answered = section.questions.filter(q => {
                          const answer = sectionAnswers[q.id];
                          if (answer === null || answer === undefined || answer === "") return false;
                          if (typeof answer === "object") {
                            if (Array.isArray(answer)) {
                              return answer.length > 0;
                            }
                            return Object.keys(answer).length > 0;
                          }
                          return true;
                        }).length;
                        return total + answered;
                      }, 0) || 0} / {data.sections?.reduce((total, section) => total + section.questions.length, 0)} questions
                    </span>
                  </div>
                   <div className="w-full rounded-full h-2"
                        style={{ backgroundColor: 'rgba(48, 51, 128, 0.1)' }}>
                     <div 
                       className="h-2 rounded-full transition-all duration-300"
                       style={{
                         backgroundColor: '#303380',
                         width: `${((data.sections?.reduce((total, section) => {
                           const sectionAnswers = answers[section.type] || {};
                           const answered = section.questions.filter(q => {
                             const answer = sectionAnswers[q.id];
                             if (answer === null || answer === undefined || answer === "") return false;
                             if (typeof answer === "object") {
                               if (Array.isArray(answer)) {
                                 return answer.length > 0;
                               }
                               return Object.keys(answer).length > 0;
                             }
                             return true;
                           }).length;
                           return total + answered;
                         }, 0) || 0) / (data.sections?.reduce((total, section) => total + section.questions.length, 0) || 1)) * 100}%`
                       }}
                     ></div>
                   </div>
                </div>
              </div>

               {/* Sections List - Middle */}
               <div className="flex-1 overflow-y-auto custom-scrollbar">
                 <style jsx>{`
                   .custom-scrollbar {
                     scrollbar-width: thin;
                     scrollbar-color: #cbd5e1 #f1f5f9;
                   }
                   .custom-scrollbar::-webkit-scrollbar {
                     width: 4px;
                   }
                   .custom-scrollbar::-webkit-scrollbar-track {
                     background: transparent;
                   }
                   .custom-scrollbar::-webkit-scrollbar-thumb {
                     background: #cbd5e1;
                     border-radius: 2px;
                   }
                   .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                     background: #94a3b8;
                   }
                 `}</style>
                 <div className="space-y-2 pr-1">
                {data.sections?.map((section) => {
                  const isActive = activeSection === section.type;
                  const isLocked = lockedSections.has(section.type);
                  const answeredCount = Object.values(answers[section.type] || {}).filter(answer => {
                    if (answer === null || answer === undefined || answer === "") return false;
                    if (typeof answer === "object") {
                      if (Array.isArray(answer)) {
                        return answer.length > 0;
                      }
                      return Object.keys(answer).length > 0;
                    }
                    return true;
                  }).length;
                  const totalCount = section.questions.length;

                  return (
                    <button
                      key={section.type}
                      onClick={async () => {
                        // Save current section before switching
                        if (activeSection && answers[activeSection]) {
                          await saveSection(activeSection, answers[activeSection]);
                        }
                        setActiveSection(section.type);
                      }}
                         className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                        isActive
                             ? "border"
                             : "border border-transparent"
                         }`}
                         style={isActive ? { 
                           backgroundColor: '#E0E1EC',
                           borderColor: 'rgba(48, 51, 128, 0.2)',
                           color: '#303380'
                         } : {
                           backgroundColor: 'rgba(48, 51, 128, 0.02)',
                           borderColor: 'rgba(48, 51, 128, 0.1)',
                           color: 'rgba(48, 51, 128, 0.8)'
                         }}
                         onMouseEnter={(e) => {
                           if (!isActive) {
                             e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.05)';
                             e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.15)';
                           }
                         }}
                         onMouseLeave={(e) => {
                           if (!isActive) {
                             e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.02)';
                             e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.1)';
                           }
                         }}
                    >
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                          {isLocked ? (
                              <Lock className="w-4 h-4 text-green-600 flex-shrink-0" />
                          ) : (
                              <BookOpen className="w-4 h-4 flex-shrink-0" />
                          )}
                            <span className="font-medium text-sm truncate" title={section.title}>
                              {getShortSectionTitle(section.title)}
                            </span>
                        </div>
                        {isLocked && (
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                         <div className="mt-1 text-xs"
                              style={{ color: 'rgba(48, 51, 128, 0.6)' }}>
                           {answeredCount}/{totalCount} answered
                      </div>
                    </button>
                  );
                })}
                </div>
              </div>

              {/* Submit Button - Bottom */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                 <button
                   onClick={handleSubmit}
                   disabled={submitting}
                   className="w-full px-4 py-3 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                   style={{ backgroundColor: '#303380' }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.backgroundColor = '#252a6b';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.backgroundColor = '#303380';
                   }}
                 >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Exam
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-500 text-center mt-2">
                  You cannot change answers after submission
                </p>
              </div>
            </div>
          </div>

          {/* Questions Area */}
          <div className="flex-1">
            {currentSection && (
              <div className="bg-white rounded-xl mt-1 shadow-sm border border-slate-200 p-6">
                 <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">{currentSection.title}</h2>
                 </div>

                 {/* Audio Player for Listening Section */}
                 {currentSection.audio && (
                   <div className="mb-8">
                     <div className="text-center mb-4">
                       <h3 className="text-lg font-semibold mb-2" style={{ color: '#303380' }}>
                         🎧 Listening Audio
                       </h3>
                       <p className="text-sm" style={{ color: 'rgba(48, 51, 128, 0.7)' }}>
                         Listen to the audio and answer the questions below
                       </p>
                     </div>
                     <AudioPlayer 
                       src={currentSection.audio} 
                       className="w-full"
                     />
                   </div>
                 )}

                 {/* Reading Passage - Show once at the top for READING section */}
                 {currentSection?.questions?.[0]?.prompt?.passage && (
                   <div className="mb-6 p-6 rounded-lg"
                        style={{
                          backgroundColor: 'rgba(48, 51, 128, 0.05)',
                          borderColor: 'rgba(48, 51, 128, 0.15)',
                          border: '1px solid'
                        }}>
                     <h3 className="text-lg font-semibold mb-4" style={{ color: '#303380' }}>
                       Reading Passage
                     </h3>
                     <div className="prose prose-sm max-w-none">
                       <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                         {currentSection.questions[0].prompt.passage}
                       </p>
                     </div>
                   </div>
                 )}

                {/* Grouped DnD for preposition/time expression and short answer parts */}
                {/* Only use QDndGroup for DND_GAP questions, NOT for INLINE_SELECT (gap_fill_options) */}
                {currentSection?.questions?.[0]?.qtype === "DND_GAP" && 
                 (currentSection?.title?.toLowerCase().includes("preposition") || 
                  currentSection?.title?.toLowerCase().includes("time expression") ||
                  currentSection?.title?.toLowerCase().includes("short form")) ? (
                  <div className="bg-white rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md"
                       style={{
                         borderColor: 'rgba(15, 17, 80, 0.63)'
                       }}>
                    <div className="p-6">
                      <QDndGroup
                        questions={currentSection.questions}
                        values={answers[currentSection.type] || {}}
                        onChange={(qid, v) => setAnswer(currentSection.type, qid, v)}
                        readOnly={lockedSections.has(currentSection.type)}
                      />
                    </div>
                  </div>
                ) : (
                   <div className="space-y-5">
                   {currentSection?.questions?.map((q, idx) => {
                     const value = answers[currentSection.type]?.[q.id];
                     const isLocked = lockedSections.has(currentSection.type);

                     // Special handling for DND_GAP: split into separate question cards for each sentence
                     if (q.qtype === "DND_GAP" && q.prompt?.textWithBlanks) {
                       const text = q.prompt.textWithBlanks;
                       let sentences: string[] = [];
                       if (text.includes('\n')) {
                         sentences = text.split('\n').filter((line: string) => line.trim());
                       } else if (text.includes('1.') && text.includes('2.')) {
                         sentences = text.split(/(?=\d+\.\s)/).filter((line: string) => line.trim());
                       } else {
                         sentences = text.split(/(?<=\.)\s+(?=[A-Z])/).filter((line: string) => line.trim());
                       }

                       // Calculate base question number (sum of all previous questions)
                       let baseQuestionNum = 0;
                       for (let i = 0; i < idx; i++) {
                         const prevQ = currentSection.questions[i];
                         if (prevQ.qtype === "DND_GAP" && prevQ.prompt?.textWithBlanks) {
                           const prevText = prevQ.prompt.textWithBlanks;
                           let prevSentences: string[] = [];
                           if (prevText.includes('\n')) {
                             prevSentences = prevText.split('\n').filter((line: string) => line.trim());
                           } else if (prevText.includes('1.') && prevText.includes('2.')) {
                             prevSentences = prevText.split(/(?=\d+\.\s)/).filter((line: string) => line.trim());
                           } else {
                             prevSentences = prevText.split(/(?<=\.)\s+(?=[A-Z])/).filter((line: string) => line.trim());
                           }
                           baseQuestionNum += prevSentences.length;
                         } else {
                           baseQuestionNum += 1;
                         }
                       }

                       return (
                         <div key={q.id} className="space-y-5">
                           {sentences.map((sentence: string, sentenceIdx: number) => {
                             const questionNum = baseQuestionNum + sentenceIdx + 1;
                             const isLastSentence = sentenceIdx === sentences.length - 1;
                             // Create a modified question object for this sentence
                             const sentenceQuestion = {
                               ...q,
                               prompt: {
                                 ...q.prompt,
                                 textWithBlanks: sentence
                               }
                             };
                             
                             return (
                               <div
                                 key={`${q.id}-${sentenceIdx}`}
                                 className="bg-white rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md"
                                 style={{
                                   borderColor: 'rgba(15, 17, 80, 0.63)'
                                 }}
                               >
                                 <div className="p-6">
                                   {/* Number and question text in same flex container */}
                                   <div className="flex items-center gap-4">
                                     <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm"
                                          style={{ 
                                            backgroundColor: '#303380',
                                            color: 'white'
                                          }}>
                                       {questionNum}
                                     </div>
                                     <div className="flex-1">
                                       {renderQuestionComponent(
                                         sentenceQuestion,
                                         value,
                                         (v) => setAnswer(currentSection.type, q.id, v),
                                         isLocked,
                                         isLastSentence // Only show word bank on last sentence
                                       )}
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       );
                     }

                     // Regular question rendering for non-DND_GAP questions
                     return (
                       <div
                         key={q.id}
                         className="bg-white rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md"
                         style={{
                           borderColor: 'rgba(15, 17, 80, 0.63)'
                         }}
                       >
                         <div className="p-6">
                           {/* Question Prompt - Hide passage for READING section as it's shown above */}
                           {false && q.prompt?.passage && (
                             <div className="mb-4 p-4 rounded-lg border"
                                  style={{
                                    backgroundColor: 'rgba(48, 51, 128, 0.03)',
                                    borderColor: 'rgba(48, 51, 128, 0.12)'
                                  }}>
                               <p className="text-sm text-gray-700 italic leading-relaxed">{q.prompt.passage}</p>
                             </div>
                           )}
                           {q.prompt?.transcript && (
                             <div className="mb-4 p-4 rounded-lg border"
                                  style={{
                                    backgroundColor: 'rgba(48, 51, 128, 0.03)',
                                    borderColor: 'rgba(48, 51, 128, 0.12)'
                                  }}>
                               <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#303380' }}>🎧 Transcript</p>
                               <p className="text-sm text-gray-700 leading-relaxed">{q.prompt.transcript}</p>
                             </div>
                           )}
                           
                           {/* For INLINE_SELECT, MCQ_SINGLE, and GAP with blank markers, show number and question in same flex container */}
                           {q.qtype === "INLINE_SELECT" || q.qtype === "MCQ_SINGLE" || 
                            (q.qtype === "GAP" && q.prompt?.text && (q.prompt.text.includes("____") || q.prompt.text.includes("___"))) ? (
                             <>
                               {/* Number and question text in same div with items-center */}
                               <div className="flex items-center gap-4">
                                 <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm"
                                      style={{ 
                                        backgroundColor: '#303380',
                                        color: 'white'
                                      }}>
                                   {idx + 1}
                                 </div>
                                 <div className="flex-1">
                                   {q.qtype === "MCQ_SINGLE" ? (
                                     <p className="text-gray-800 text-base leading-relaxed font-normal" style={{ lineHeight: '1.6', margin: 0 }}>
                                       {q.prompt?.text || "Question"}
                                     </p>
                                   ) : (
                                     renderQuestionComponent(
                                       q,
                                       value,
                                       (v) => setAnswer(currentSection.type, q.id, v),
                                       isLocked
                                     )
                                   )}
                                 </div>
                               </div>
                              {/* Options in separate div for MCQ_SINGLE */}
                              {q.qtype === "MCQ_SINGLE" && (
                                <div className="mt-3">
                                  {renderQuestionComponent(
                                    q,
                                    value,
                                    (v) => setAnswer(currentSection.type, q.id, v),
                                    isLocked
                                  )}
                                </div>
                              )}
                             </>
                           ) : (
                             <div className="flex items-start gap-4 mb-4">
                               <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm"
                                    style={{
                                      backgroundColor: '#303380',
                                      color: 'white'
                                    }}>
                                 {idx + 1}
                               </div>
                               <div className="flex-1 pt-0.5">
                            {(() => {
                              const isPrepositionDnD =
                                (q.qtype === "GAP" || q.qtype === "DND_GAP") &&
                                typeof q.prompt?.text === "string" &&
                                q.prompt.text.includes("________");
                              // Hide prompt text when GAP has blank markers (QOpenText renders it inline) or DND_GAP
                              const isGapWithBlanks = 
                                q.qtype === "GAP" &&
                                typeof q.prompt?.text === "string" &&
                                (q.prompt.text.includes("____") || q.prompt.text.includes("___"));
                              if (isPrepositionDnD || isGapWithBlanks) return null;
                              return (
                                     <p className="text-gray-800 text-base leading-relaxed font-normal mb-4" style={{ lineHeight: '1.6' }}>
                                  {q.prompt?.text || "Question"}
                                </p>
                              );
                            })()}

                             {/* Question Component */}
                                 <div className="mt-4">
                             {renderQuestionComponent(
                               q,
                               value,
                               (v) => setAnswer(currentSection.type, q.id, v),
                               isLocked
                             )}
                          </div>
                               </div>
                             </div>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
