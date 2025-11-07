"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, BookOpen, Save, Edit } from "lucide-react";

type ExamCategory = "IELTS" | "TOEFL" | "SAT" | "GENERAL_ENGLISH" | "MATH" | "KIDS";
type SectionType = "READING" | "LISTENING" | "WRITING" | "SPEAKING" | "GRAMMAR" | "VOCABULARY";
type QuestionType = 
  | "MCQ_SINGLE" 
  | "MCQ_MULTI" 
  | "TF" 
  | "SELECT" 
  | "GAP" 
  | "ORDER_SENTENCE" 
  | "DND_GAP" 
  | "SHORT_TEXT" 
  | "ESSAY"
  | "INLINE_SELECT";

interface Section {
  id: string;
  type: SectionType;
  title: string;
  instruction: string;
  durationMin: number;
  order: number;
  questions: Question[];
  passage?: string; // Reading section üçün
  audio?: string; // Listening section üçün (MP3 file path)
}

interface Question {
  id: string;
  qtype: QuestionType;
  order: number;
  prompt: any;
  options?: any;
  answerKey: any;
  maxScore: number;
  explanation?: any;
  image?: string; // SAT və MATH üçün şəkil (file path)
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MCQ_SINGLE: "Multiple Choice (Single)",
  MCQ_MULTI: "Multiple Choice (Multiple)",
  TF: "True/False",
  SELECT: "Select (Dropdown)",
  INLINE_SELECT: "Inline Select",
  GAP: "Gap Fill (Text Input)",
  ORDER_SENTENCE: "Order Sentence (Drag & Drop)",
  DND_GAP: "Drag & Drop Gap Fill",
  SHORT_TEXT: "Short Text Answer",
  ESSAY: "Essay",
};

const QUESTION_TYPE_GROUPS = {
  "Variantlı sual": ["MCQ_SINGLE", "MCQ_MULTI", "TF", "SELECT", "INLINE_SELECT"],
  "Açıq sual": ["GAP", "SHORT_TEXT", "ESSAY"],
  "Drag and Drop": ["ORDER_SENTENCE", "DND_GAP"],
};

// Category-ə görə icazə verilən section tipləri
const ALLOWED_SECTIONS_BY_CATEGORY: Record<ExamCategory, SectionType[]> = {
  IELTS: ["READING", "LISTENING", "WRITING", "SPEAKING"],
  TOEFL: ["READING", "LISTENING", "WRITING", "SPEAKING"],
  SAT: ["READING", "WRITING"], // SAT-də LISTENING və SPEAKING yoxdur
  GENERAL_ENGLISH: ["READING", "LISTENING", "WRITING", "GRAMMAR", "VOCABULARY"], // SPEAKING yoxdur
  MATH: ["GRAMMAR", "VOCABULARY"], // MATH üçün READING, LISTENING, WRITING, SPEAKING yoxdur
  KIDS: ["READING", "LISTENING", "GRAMMAR", "VOCABULARY"], // KIDS üçün WRITING və SPEAKING yoxdur
};

// Section type label-ləri
const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  READING: "Reading",
  LISTENING: "Listening",
  WRITING: "Writing",
  SPEAKING: "Speaking",
  GRAMMAR: "Grammar",
  VOCABULARY: "Vocabulary",
};

export default function CreateExamPage() {
  const router = useRouter();
  const [step, setStep] = useState<"category" | "sections" | "questions">("category");
  const [examTitle, setExamTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ExamCategory | null>(null);
  const [track, setTrack] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSection, setCurrentSection] = useState<Section | null>(null);
  const [showQuestionTypeModal, setShowQuestionTypeModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedSectionType, setSelectedSectionType] = useState<SectionType | "">("");
  const [saving, setSaving] = useState(false);
  const [showSectionEditModal, setShowSectionEditModal] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const categories: ExamCategory[] = ["IELTS", "TOEFL", "SAT", "GENERAL_ENGLISH", "MATH", "KIDS"];

  // Seçilmiş category üçün icazə verilən section tipləri
  const allowedSectionTypes = selectedCategory 
    ? ALLOWED_SECTIONS_BY_CATEGORY[selectedCategory] 
    : [];

  const handleCategorySelect = (category: ExamCategory) => {
    setSelectedCategory(category);
    
    // Category dəyişəndə, əgər artıq section-lar varsa və onlar yeni category-ə uyğun deyilsə, təmizlə
    const allowedTypes = ALLOWED_SECTIONS_BY_CATEGORY[category];
    const hasInvalidSections = sections.some(section => !allowedTypes.includes(section.type));
    
    if (hasInvalidSections) {
      if (confirm("Changing category will remove sections that are not allowed for this exam type. Continue?")) {
        setSections([]);
        setCurrentSection(null);
        setStep("sections");
      } else {
        return; // İstifadəçi ləğv etdi
      }
    } else {
      setStep("sections");
    }
  };

  const addSection = (type: SectionType) => {
    // Category seçilməyibsə və ya section type icazə verilməyibsə, əlavə etmə
    if (!selectedCategory) {
      alert("Please select an exam category first");
      return;
    }
    
    const allowedTypes = ALLOWED_SECTIONS_BY_CATEGORY[selectedCategory];
    if (!allowedTypes.includes(type)) {
      alert(`This section type is not allowed for ${selectedCategory} exams`);
      return;
    }
    
    const newSection: Section = {
      id: `section-${Date.now()}`,
      type,
      title: `${SECTION_TYPE_LABELS[type]} Section`,
      instruction: `Complete the ${SECTION_TYPE_LABELS[type].toLowerCase()} section`,
      durationMin: 15,
      order: sections.length,
      questions: [],
      passage: type === "READING" ? undefined : undefined,
      audio: type === "LISTENING" ? undefined : undefined,
    };
    setSections([...sections, newSection]);
    setCurrentSection(newSection);
    setStep("questions");
  };

  const addQuestion = (qtype: QuestionType) => {
    if (!currentSection) return;

    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      qtype,
      order: currentSection.questions.length,
      prompt: getDefaultPrompt(qtype),
      options: getDefaultOptions(qtype),
      answerKey: getDefaultAnswerKey(qtype),
      maxScore: 1,
    };

    setEditingQuestion(newQuestion);
    setShowQuestionTypeModal(false);
  };

  const saveQuestion = () => {
    if (!currentSection || !editingQuestion) return;

    const updatedSections = sections.map((s) =>
      s.id === currentSection.id
        ? {
            ...s,
            questions: editingQuestion.id.startsWith("q-") && s.questions.find((q) => q.id === editingQuestion.id)
              ? s.questions.map((q) => (q.id === editingQuestion.id ? editingQuestion : q))
              : [...s.questions, editingQuestion],
          }
        : s
    );
    setSections(updatedSections);
    setCurrentSection(updatedSections.find((s) => s.id === currentSection.id) || null);
    setEditingQuestion(null);
  };

  const editQuestion = (question: Question) => {
    setEditingQuestion({ ...question });
  };

  const deleteQuestion = (questionId: string) => {
    if (!currentSection) return;
    const updatedSections = sections.map((s) =>
      s.id === currentSection.id
        ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) }
        : s
    );
    setSections(updatedSections);
    setCurrentSection(updatedSections.find((s) => s.id === currentSection.id) || null);
  };

  const deleteSection = (sectionId: string) => {
    if (confirm("Are you sure you want to delete this section? All questions in this section will be deleted.")) {
      const updatedSections = sections.filter((s) => s.id !== sectionId);
      setSections(updatedSections);
      if (currentSection?.id === sectionId) {
        setCurrentSection(null);
        setStep("sections");
      }
    }
  };

  const getDefaultPrompt = (qtype: QuestionType): any => {
    switch (qtype) {
      case "TF":
        return { text: "Enter the statement here" };
      case "MCQ_SINGLE":
      case "MCQ_MULTI":
        return { text: "Enter the question here" };
      case "SELECT":
      case "INLINE_SELECT":
        return { text: "Enter the question here" };
      case "GAP":
        return { text: "Enter the sentence with blanks (use ___ for blanks)" };
      case "ORDER_SENTENCE":
        return { tokens: ["token1", "token2", "token3"] };
      case "DND_GAP":
        return { textWithBlanks: "Enter text with blanks (use ___ for blanks)" };
      case "SHORT_TEXT":
      case "ESSAY":
        return { text: "Enter the question here" };
      default:
        return { text: "" };
    }
  };

  const getDefaultOptions = (qtype: QuestionType): any => {
    switch (qtype) {
      case "MCQ_SINGLE":
      case "MCQ_MULTI":
        return { choices: ["Option 1", "Option 2", "Option 3", "Option 4"] };
      case "SELECT":
      case "INLINE_SELECT":
        return { choices: ["Option 1", "Option 2", "Option 3"] };
      case "DND_GAP":
        return { bank: ["word1", "word2", "word3"] };
      default:
        return undefined;
    }
  };

  const getDefaultAnswerKey = (qtype: QuestionType): any => {
    switch (qtype) {
      case "TF":
        return { value: true };
      case "MCQ_SINGLE":
      case "SELECT":
      case "INLINE_SELECT":
        return { index: 0 };
      case "MCQ_MULTI":
        return { indices: [0, 1] };
      case "GAP":
        return { answers: ["answer"] };
      case "ORDER_SENTENCE":
        return { order: [] };
      case "DND_GAP":
        return { blanks: ["word1", "word2"] };
      case "SHORT_TEXT":
      case "ESSAY":
        return { answers: [] };
      default:
        return {};
    }
  };

  const saveExam = async () => {
    if (!selectedCategory || !examTitle.trim() || sections.length === 0) {
      alert("Please fill in all required fields and add at least one section");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: examTitle,
          category: selectedCategory,
          track: track || null,
          sections: sections.map((s) => {
            // Combine instruction, passage, and audio into instruction JSON
            const instructionData: any = {
              text: s.instruction,
            };
            if (s.passage) {
              instructionData.passage = s.passage;
            }
            if (s.audio) {
              instructionData.audio = s.audio;
            }
            
            return {
              type: s.type,
              title: s.title,
              instruction: JSON.stringify(instructionData),
              durationMin: s.durationMin,
              order: s.order,
              passage: s.passage || null,
              audio: s.audio || null,
              questions: s.questions.map((q) => ({
              qtype: q.qtype,
              order: q.order,
              prompt: q.prompt,
              options: q.options,
              answerKey: q.answerKey,
              maxScore: q.maxScore,
              explanation: q.explanation,
              image: q.image || null,
            })),
            };
          }),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/admin/exams/${data.exam.id}`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create exam");
      }
    } catch (error) {
      console.error("Failed to create exam:", error);
      alert("Failed to create exam");
    } finally {
      setSaving(false);
    }
  };

  if (step === "category") {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8 sm:mb-12">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-xl sm:text-2xl font-medium text-gray-900">Create New Exam</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Select the exam category</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategorySelect(category)}
              className="p-4 sm:p-6 border border-gray-200 rounded-md hover:border-gray-300 hover:bg-gray-50 transition text-left"
            >
              <div className="font-medium text-gray-900 mb-1">{category}</div>
              <div className="text-xs sm:text-sm text-gray-500">
                {category === "GENERAL_ENGLISH" && "Unit-based exams"}
                {category === "IELTS" && "International English Language Testing System"}
                {category === "TOEFL" && "Test of English as a Foreign Language"}
                {category === "SAT" && "Scholastic Assessment Test"}
                {category === "MATH" && "Mathematics exams"}
                {category === "KIDS" && "Kids exams"}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Minimal Header */}
      <div className="mb-8 sm:mb-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-xl sm:text-2xl font-medium text-gray-900">Create New Exam</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Build your exam step by step</p>
      </div>

      {/* Exam Info */}
      <div className="bg-white border border-gray-200 rounded-md p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Exam Title *
            </label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="e.g., General English A2 - Unit 1"
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
          {selectedCategory === "GENERAL_ENGLISH" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Track (Level) *
              </label>
              <input
                type="text"
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                placeholder="e.g., A1, A2, B1, B1+, B2"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900">Sections</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <select
              value={selectedSectionType}
              onChange={(e) => setSelectedSectionType(e.target.value as SectionType | "")}
              disabled={!selectedCategory || allowedSectionTypes.length === 0}
              className="flex-1 sm:flex-none px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 min-w-[160px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {!selectedCategory 
                  ? "Select exam category first" 
                  : allowedSectionTypes.length === 0 
                  ? "No sections available" 
                  : "Select Section Type..."}
              </option>
              {allowedSectionTypes.map((type) => (
                <option key={type} value={type}>
                  {SECTION_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (selectedSectionType) {
                  addSection(selectedSectionType);
                  setSelectedSectionType("");
                }
              }}
              disabled={!selectedSectionType}
              className="px-3 sm:px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Section</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {sections.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-md p-8 sm:p-12 text-center">
            <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2 text-sm sm:text-base">No sections added yet</p>
            <p className="text-xs sm:text-sm text-gray-500">Select a section type and click "Add Section" to get started</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {sections.map((section, idx) => {
              const isActive = currentSection?.id === section.id && step === "questions";
              return (
                <div
                  key={section.id}
                  className={`bg-white border rounded-md p-4 sm:p-6 transition ${
                    isActive
                      ? "border-slate-900 bg-slate-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                          Section {idx + 1}: {section.title}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                          {section.type}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500">
                          ({section.questions.length} {section.questions.length === 1 ? "question" : "questions"})
                        </span>
                        {isActive && (
                          <span className="text-xs px-2 py-1 bg-slate-900 text-white rounded-full font-medium">
                            Editing
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600">{section.instruction}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setCurrentSection(section);
                          setStep("questions");
                        }}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 ${
                          isActive
                            ? "bg-slate-900 text-white hover:bg-slate-800"
                            : "bg-gray-900 text-white hover:bg-gray-800"
                        }`}
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{isActive ? "Continue Editing" : "Edit Section"}</span>
                        <span className="sm:hidden">Edit</span>
                      </button>
                      <button
                        onClick={() => deleteSection(section.id)}
                        disabled={isActive}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Questions Editor */}
      {currentSection && step === "questions" && (
        <div className="bg-white border-2 border-slate-900 rounded-md p-4 sm:p-6 mb-6 relative">
          {/* Editing Indicator */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-1 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.4s' }}></span>
              <span className="w-1 h-1 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.4s' }}></span>
              <span className="w-1 h-1 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.4s' }}></span>
            </div>
            <span className="text-xs sm:text-sm font-medium text-slate-900">Editing</span>
          </div>

          {/* Breadcrumb */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
              <button
                onClick={() => {
                  setCurrentSection(null);
                  setStep("sections");
                }}
                className="text-gray-900 hover:text-gray-700 font-medium"
              >
                ← Back to Sections
              </button>
              <span>/</span>
              <span className="text-gray-900 font-medium">
                {currentSection.title} ({currentSection.type})
              </span>
            </div>
          </div>

          {/* Section Content (Reading Passage / Listening Audio) */}
          {(currentSection.type === "READING" || currentSection.type === "LISTENING") && (
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  {currentSection.type === "READING" ? "Reading Passage" : "Listening Audio"}
                </label>
                <button
                  onClick={() => {
                    setEditingSection(currentSection);
                    setShowSectionEditModal(true);
                  }}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  Edit
                </button>
              </div>
              {currentSection.type === "READING" && currentSection.passage && (
                <div className="text-sm text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {currentSection.passage.substring(0, 200)}...
                </div>
              )}
              {currentSection.type === "LISTENING" && currentSection.audio && (
                <div className="text-sm text-gray-600">
                  Audio: {currentSection.audio}
                </div>
              )}
              {(!currentSection.passage && currentSection.type === "READING") && (
                <p className="text-xs text-gray-500">No passage added yet. Click Edit to add.</p>
              )}
              {(!currentSection.audio && currentSection.type === "LISTENING") && (
                <p className="text-xs text-gray-500">No audio uploaded yet. Click Edit to upload.</p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                <h3 className="text-lg sm:text-xl font-medium text-gray-900">{currentSection.title}</h3>
                <span className="text-xs px-2 py-1 bg-slate-900 text-white rounded-full font-medium">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">{currentSection.type} • {currentSection.questions.length} questions</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowQuestionTypeModal(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 flex items-center gap-1.5 sm:gap-2"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add Question</span>
                <span className="sm:hidden">Add</span>
              </button>
              <button
                onClick={() => {
                  setCurrentSection(null);
                  setStep("sections");
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <span className="hidden sm:inline">Finish Editing</span>
                <span className="sm:hidden">Finish</span>
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-3 sm:space-y-4">
            {currentSection.questions.map((q, idx) => (
              <div key={q.id} className="border border-gray-200 rounded-md p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Q{idx + 1}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                      {QUESTION_TYPE_LABELS[q.qtype]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => editQuestion(q)}
                      className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {typeof q.prompt === "object" && q.prompt.text
                    ? q.prompt.text
                    : typeof q.prompt === "string"
                    ? q.prompt
                    : JSON.stringify(q.prompt)}
                </div>
                {q.image && (
                  <div className="mt-2 text-xs text-gray-500">
                    Image: {q.image}
                  </div>
                )}
              </div>
            ))}
            {currentSection.questions.length === 0 && (
              <div className="text-center py-8 sm:py-12 text-gray-500 border border-dashed border-gray-300 rounded-md bg-gray-50">
                <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <p className="font-medium text-gray-700 mb-2 text-sm sm:text-base">No questions in this section yet</p>
                <p className="text-xs sm:text-sm">Click "Add Question" above to add your first question</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Question Type Modal */}
      {showQuestionTypeModal && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQuestionTypeModal(false)}
        >
          <div
            className="bg-white border border-gray-200 rounded-md p-4 sm:p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Select Question Type</h3>
              <button
                onClick={() => setShowQuestionTypeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {Object.entries(QUESTION_TYPE_GROUPS).map(([groupName, types]) => (
                <div key={groupName}>
                  <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{groupName}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {types.map((type) => (
                      <button
                        key={type}
                        onClick={() => addQuestion(type as QuestionType)}
                        className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-md hover:border-gray-300 hover:bg-gray-50 text-left transition text-sm"
                      >
                        <div className="font-medium text-gray-900">
                          {QUESTION_TYPE_LABELS[type as QuestionType]}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section Edit Modal (for Reading Passage / Listening Audio) */}
      {showSectionEditModal && editingSection && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowSectionEditModal(false);
            setEditingSection(null);
          }}
        >
          <div
            className="bg-white border border-gray-200 rounded-md p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">
                {editingSection.type === "READING" ? "Edit Reading Passage" : "Edit Listening Audio"}
              </h3>
              <button
                onClick={() => {
                  setShowSectionEditModal(false);
                  setEditingSection(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {editingSection.type === "READING" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Reading Passage *
                  </label>
                  <textarea
                    value={editingSection.passage || ""}
                    onChange={(e) => {
                      setEditingSection({
                        ...editingSection,
                        passage: e.target.value,
                      });
                    }}
                    placeholder="Enter the reading passage text..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                    rows={10}
                  />
                </div>
              )}

              {editingSection.type === "LISTENING" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Listening Audio (MP3) *
                  </label>
                  <div className="space-y-2">
                    {editingSection.audio && (
                      <div className="p-2 bg-gray-50 rounded-md text-sm text-gray-600">
                        Current: {editingSection.audio}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="audio/mpeg,audio/mp3,.mp3"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        if (!file.name.toLowerCase().endsWith('.mp3')) {
                          alert("Please upload an MP3 file");
                          return;
                        }
                        
                        setUploadingAudio(true);
                        try {
                          const formData = new FormData();
                          formData.append("file", file);
                          formData.append("type", "audio");
                          
                          const res = await fetch("/api/admin/upload", {
                            method: "POST",
                            body: formData,
                          });
                          
                          if (res.ok) {
                            const data = await res.json();
                            setEditingSection({
                              ...editingSection,
                              audio: data.path,
                            });
                          } else {
                            alert("Failed to upload audio");
                          }
                        } catch (error) {
                          console.error("Upload error:", error);
                          alert("Failed to upload audio");
                        } finally {
                          setUploadingAudio(false);
                        }
                      }}
                      disabled={uploadingAudio}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 disabled:opacity-50"
                    />
                    {uploadingAudio && (
                      <p className="text-xs text-gray-500">Uploading...</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowSectionEditModal(false);
                  setEditingSection(null);
                }}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingSection.type === "READING" && !editingSection.passage?.trim()) {
                    alert("Please enter a reading passage");
                    return;
                  }
                  if (editingSection.type === "LISTENING" && !editingSection.audio) {
                    alert("Please upload an audio file");
                    return;
                  }
                  
                  // Update section in sections array
                  const updatedSections = sections.map((s) =>
                    s.id === editingSection.id ? editingSection : s
                  );
                  setSections(updatedSections);
                  
                  // Update currentSection if it's the same
                  if (currentSection?.id === editingSection.id) {
                    setCurrentSection(editingSection);
                  }
                  
                  setShowSectionEditModal(false);
                  setEditingSection(null);
                }}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Edit Modal */}
      {editingQuestion && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
          onClick={() => setEditingQuestion(null)}
        >
          <div
            className="bg-white border border-gray-200 rounded-md p-4 sm:p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">
                {editingQuestion.id.startsWith("q-") && currentSection?.questions.find((q) => q.id === editingQuestion.id)
                  ? "Edit Question"
                  : "Add Question"}
              </h3>
              <button
                onClick={() => setEditingQuestion(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Question Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Question Type
                </label>
                <div className="px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-600">
                  {QUESTION_TYPE_LABELS[editingQuestion.qtype]}
                </div>
              </div>

              {/* Image Upload (for SAT and MATH) */}
              {(selectedCategory === "SAT" || selectedCategory === "MATH") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Question Image (Optional)
                  </label>
                  <div className="space-y-2">
                    {editingQuestion.image && (
                      <div className="p-2 bg-gray-50 rounded-md text-sm text-gray-600">
                        Current: {editingQuestion.image}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        setUploadingImage(true);
                        try {
                          const formData = new FormData();
                          formData.append("file", file);
                          formData.append("type", "image");
                          
                          const res = await fetch("/api/admin/upload", {
                            method: "POST",
                            body: formData,
                          });
                          
                          if (res.ok) {
                            const data = await res.json();
                            setEditingQuestion({
                              ...editingQuestion,
                              image: data.path,
                            });
                          } else {
                            alert("Failed to upload image");
                          }
                        } catch (error) {
                          console.error("Upload error:", error);
                          alert("Failed to upload image");
                        } finally {
                          setUploadingImage(false);
                        }
                      }}
                      disabled={uploadingImage}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 disabled:opacity-50"
                    />
                    {uploadingImage && (
                      <p className="text-xs text-gray-500">Uploading...</p>
                    )}
                  </div>
                </div>
              )}

              {/* Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Question Text / Prompt *
                </label>
                {editingQuestion.qtype === "ORDER_SENTENCE" ? (
                  <div className="space-y-2">
                    <textarea
                      value={Array.isArray(editingQuestion.prompt?.tokens) ? editingQuestion.prompt.tokens.join("\n") : ""}
                      onChange={(e) => {
                        const tokens = e.target.value.split("\n").filter((t) => t.trim());
                        setEditingQuestion({
                          ...editingQuestion,
                          prompt: { tokens },
                          answerKey: { order: tokens.map((_, idx) => idx) },
                        });
                      }}
                      placeholder="Enter tokens (one per line)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                      rows={5}
                    />
                    <p className="text-xs text-gray-500">Enter tokens one per line. They will be shuffled for students.</p>
                  </div>
                ) : editingQuestion.qtype === "DND_GAP" ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingQuestion.prompt?.textWithBlanks || ""}
                      onChange={(e) => {
                        setEditingQuestion({
                          ...editingQuestion,
                          prompt: { textWithBlanks: e.target.value },
                        });
                      }}
                      placeholder="Enter text with blanks (use ___ for blanks)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                    />
                    <p className="text-xs text-gray-500">Use ___ to indicate blanks where students will drag words.</p>
                  </div>
                ) : (
                  <textarea
                    value={editingQuestion.prompt?.text || ""}
                    onChange={(e) => {
                      setEditingQuestion({
                        ...editingQuestion,
                        prompt: { ...editingQuestion.prompt, text: e.target.value },
                      });
                    }}
                    placeholder="Enter the question text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                    rows={3}
                  />
                )}
              </div>

              {/* Options (for MCQ, SELECT, etc.) */}
              {(editingQuestion.qtype === "MCQ_SINGLE" ||
                editingQuestion.qtype === "MCQ_MULTI" ||
                editingQuestion.qtype === "SELECT" ||
                editingQuestion.qtype === "INLINE_SELECT" ||
                editingQuestion.qtype === "DND_GAP") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {editingQuestion.qtype === "DND_GAP" ? "Word Bank" : "Options"}
                  </label>
                  <div className="space-y-2">
                    {(editingQuestion.options?.choices || editingQuestion.options?.bank || []).map((opt: string, idx: number) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...(editingQuestion.options?.choices || editingQuestion.options?.bank || [])];
                            newOptions[idx] = e.target.value;
                            setEditingQuestion({
                              ...editingQuestion,
                              options: {
                                ...editingQuestion.options,
                                [editingQuestion.qtype === "DND_GAP" ? "bank" : "choices"]: newOptions,
                              },
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                          placeholder={`Option ${idx + 1}`}
                        />
                        <button
                          onClick={() => {
                            const newOptions = [...(editingQuestion.options?.choices || editingQuestion.options?.bank || [])];
                            newOptions.splice(idx, 1);
                            setEditingQuestion({
                              ...editingQuestion,
                              options: {
                                ...editingQuestion.options,
                                [editingQuestion.qtype === "DND_GAP" ? "bank" : "choices"]: newOptions,
                              },
                            });
                          }}
                          className="px-2 py-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-md"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newOptions = [...(editingQuestion.options?.choices || editingQuestion.options?.bank || []), ""];
                        setEditingQuestion({
                          ...editingQuestion,
                          options: {
                            ...editingQuestion.options,
                            [editingQuestion.qtype === "DND_GAP" ? "bank" : "choices"]: newOptions,
                          },
                        });
                      }}
                      className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:bg-gray-50 text-sm"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
                      Add Option
                    </button>
                  </div>
                </div>
              )}

              {/* Answer Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correct Answer *
                </label>
                {editingQuestion.qtype === "TF" && (
                  <select
                    value={editingQuestion.answerKey?.value ? "true" : "false"}
                    onChange={(e) => {
                      setEditingQuestion({
                        ...editingQuestion,
                        answerKey: { value: e.target.value === "true" },
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                )}
                {(editingQuestion.qtype === "MCQ_SINGLE" ||
                  editingQuestion.qtype === "SELECT" ||
                  editingQuestion.qtype === "INLINE_SELECT") && (
                  <select
                    value={editingQuestion.answerKey?.index ?? 0}
                    onChange={(e) => {
                      setEditingQuestion({
                        ...editingQuestion,
                        answerKey: { index: parseInt(e.target.value) },
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                  >
                    {(editingQuestion.options?.choices || []).map((opt: string, idx: number) => (
                      <option key={idx} value={idx}>
                        {opt || `Option ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                )}
                {editingQuestion.qtype === "MCQ_MULTI" && (
                  <div className="space-y-2">
                    {(editingQuestion.options?.choices || []).map((opt: string, idx: number) => (
                      <label key={idx} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(editingQuestion.answerKey?.indices || []).includes(idx)}
                          onChange={(e) => {
                            const indices = [...(editingQuestion.answerKey?.indices || [])];
                            if (e.target.checked) {
                              indices.push(idx);
                            } else {
                              const pos = indices.indexOf(idx);
                              if (pos > -1) indices.splice(pos, 1);
                            }
                            setEditingQuestion({
                              ...editingQuestion,
                              answerKey: { indices: indices.sort() },
                            });
                          }}
                          className="w-4 h-4"
                        />
                        <span>{opt || `Option ${idx + 1}`}</span>
                      </label>
                    ))}
                  </div>
                )}
                {editingQuestion.qtype === "GAP" && (
                  <input
                    type="text"
                    value={Array.isArray(editingQuestion.answerKey?.answers) ? editingQuestion.answerKey.answers[0] : ""}
                    onChange={(e) => {
                      setEditingQuestion({
                        ...editingQuestion,
                        answerKey: { answers: [e.target.value] },
                      });
                    }}
                    placeholder="Correct answer"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                  />
                )}
                {editingQuestion.qtype === "DND_GAP" && (
                  <div className="space-y-2">
                    {(editingQuestion.prompt?.textWithBlanks || "").split("___").length > 1 &&
                      Array.from({ length: (editingQuestion.prompt?.textWithBlanks || "").split("___").length - 1 }).map((_, idx) => (
                        <input
                          key={idx}
                          type="text"
                          value={Array.isArray(editingQuestion.answerKey?.blanks) ? editingQuestion.answerKey.blanks[idx] || "" : ""}
                          onChange={(e) => {
                            const blanks = [...(editingQuestion.answerKey?.blanks || [])];
                            blanks[idx] = e.target.value;
                            setEditingQuestion({
                              ...editingQuestion,
                              answerKey: { blanks },
                            });
                          }}
                          placeholder={`Blank ${idx + 1} answer`}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                        />
                      ))}
                  </div>
                )}
                {editingQuestion.qtype === "ORDER_SENTENCE" && (
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-gray-500">
                      The correct order is determined by the token order. Students will see them shuffled.
                    </p>
                    {Array.isArray(editingQuestion.prompt?.tokens) && editingQuestion.prompt.tokens.length > 0 && (
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs font-medium text-gray-700 mb-2">Current order (correct answer):</p>
                        <div className="flex flex-wrap gap-2">
                          {editingQuestion.prompt.tokens.map((token: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {idx + 1}. {token}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Answer key: {JSON.stringify(editingQuestion.prompt.tokens.map((_: any, idx: number) => idx))}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Max Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Max Score
                </label>
                <input
                  type="number"
                  value={editingQuestion.maxScore}
                  onChange={(e) => {
                    setEditingQuestion({
                      ...editingQuestion,
                      maxScore: parseInt(e.target.value) || 1,
                    });
                  }}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setEditingQuestion(null)}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveQuestion}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800"
              >
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      {sections.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
          <button
            onClick={() => router.back()}
            className="px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={saveExam}
            disabled={saving || !examTitle.trim()}
            className="px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Exam"}
          </button>
        </div>
      )}
    </div>
  );
}

