"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, X, BookOpen, Save, Edit } from "lucide-react";

type ExamCategory = "IELTS" | "TOEFL" | "SAT" | "GENERAL_ENGLISH" | "MATH" | "KIDS";
type SectionType = "READING" | "LISTENING" | "WRITING" | "SPEAKING" | "GRAMMAR" | "VOCABULARY";
type QuestionType = 
  | "MCQ_SINGLE" 
  | "MCQ_MULTI" 
  | "TF" 
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
  passage?: string;
  audio?: string;
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
  image?: string;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MCQ_SINGLE: "Multiple Choice (Single)",
  MCQ_MULTI: "Multiple Choice (Multiple)",
  TF: "True/False",
  INLINE_SELECT: "Inline Select",
  ORDER_SENTENCE: "Order Sentence (Drag & Drop)",
  DND_GAP: "Drag and Drop Gap Fill",
  SHORT_TEXT: "Short Text Answer",
  ESSAY: "Essay",
};

const QUESTION_TYPE_GROUPS = {
  "Variantlı sual": ["MCQ_SINGLE", "MCQ_MULTI", "TF", "INLINE_SELECT"],
  "Açıq sual": ["SHORT_TEXT", "ESSAY"],
  "Drag and Drop": ["ORDER_SENTENCE", "DND_GAP"],
};

const ALLOWED_SECTIONS_BY_CATEGORY: Record<ExamCategory, SectionType[]> = {
  IELTS: ["READING", "LISTENING", "WRITING", "SPEAKING"],
  TOEFL: ["READING", "LISTENING", "WRITING", "SPEAKING"],
  SAT: ["READING", "WRITING"],
  GENERAL_ENGLISH: ["READING", "LISTENING", "WRITING", "GRAMMAR", "VOCABULARY"],
  MATH: ["GRAMMAR", "VOCABULARY"],
  KIDS: ["READING", "LISTENING", "GRAMMAR", "VOCABULARY"],
};

const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  READING: "Reading",
  LISTENING: "Listening",
  WRITING: "Writing",
  SPEAKING: "Speaking",
  GRAMMAR: "Grammar",
  VOCABULARY: "Vocabulary",
};

export default function EditExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchExam();
  }, [examId]);

  const fetchExam = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/exams/${examId}`);
      if (res.ok) {
        const data = await res.json();
        const exam = data.exam;
        
        setExamTitle(exam.title);
        setSelectedCategory(exam.category);
        setTrack(exam.track || "");
        
        // Parse sections and questions
        const parsedSections: Section[] = exam.sections.map((s: any) => {
          let instructionData: any = { text: "" };
          if (s.instruction) {
            try {
              instructionData = typeof s.instruction === "string" ? JSON.parse(s.instruction) : s.instruction;
            } catch {
              instructionData = { text: s.instruction || "" };
            }
          }
          
          return {
            id: s.id,
            type: s.type,
            title: s.title,
            instruction: instructionData.text || "",
            durationMin: s.durationMin,
            order: s.order,
            passage: instructionData.passage || "",
            audio: instructionData.audio || "",
            questions: s.questions.map((q: any) => ({
              id: q.id,
              qtype: q.qtype,
              order: q.order,
              prompt: q.prompt,
              options: q.options,
              answerKey: q.answerKey,
              maxScore: q.maxScore,
              explanation: q.explanation,
              image: q.prompt?.image || null,
            })),
          };
        });
        
        setSections(parsedSections);
        if (parsedSections.length > 0) {
          setStep("sections");
        }
      } else {
        alert("Failed to load exam");
        router.push("/dashboard/admin/exams");
      }
    } catch (error) {
      console.error("Error fetching exam:", error);
      alert("Failed to load exam");
      router.push("/dashboard/admin/exams");
    } finally {
      setLoading(false);
    }
  };

  // Rest of the component logic is the same as create page
  // I'll copy the necessary functions from create page

  const categories: ExamCategory[] = ["IELTS", "TOEFL", "SAT", "GENERAL_ENGLISH", "MATH", "KIDS"];
  const allowedSectionTypes = selectedCategory 
    ? ALLOWED_SECTIONS_BY_CATEGORY[selectedCategory] 
    : [];

  const handleCategorySelect = (category: ExamCategory) => {
    setSelectedCategory(category);
    setStep("sections");
  };

  const addSection = (type: SectionType) => {
    if (!selectedCategory) return;
    
    const newSection: Section = {
      id: `section-${Date.now()}`,
      type,
      title: `${SECTION_TYPE_LABELS[type]} Section`,
      instruction: "",
      durationMin: 15,
      order: sections.length,
      questions: [],
    };
    
    setSections([...sections, newSection]);
    setCurrentSection(newSection);
    setStep("questions");
  };

  const deleteSection = (sectionId: string) => {
    const updated = sections.filter(s => s.id !== sectionId);
    setSections(updated);
    if (currentSection?.id === sectionId) {
      setCurrentSection(updated.length > 0 ? updated[0] : null);
    }
  };

  const setActiveSection = (section: Section) => {
    setCurrentSection(section);
    setStep("questions");
  };

  const addQuestion = (qtype: QuestionType) => {
    if (!currentSection) return;

    const defaultPrompt = getDefaultPrompt(qtype);
    const defaultOptions = getDefaultOptions(qtype);
    const defaultAnswerKey = getDefaultAnswerKey(qtype);

    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      qtype,
      order: currentSection.questions.length,
      prompt: defaultPrompt,
      options: defaultOptions,
      answerKey: defaultAnswerKey,
      maxScore: 1,
    };

    const updatedSections = sections.map(s =>
      s.id === currentSection.id
        ? { ...s, questions: [...s.questions, newQuestion] }
        : s
    );

    setSections(updatedSections);
    setCurrentSection(updatedSections.find(s => s.id === currentSection.id) || null);
    setEditingQuestion(newQuestion);
    setShowQuestionTypeModal(false);
  };

  const editQuestion = (question: Question) => {
    const questionToEdit = { ...question };
    if (question.qtype === "ORDER_SENTENCE" && Array.isArray(question.prompt?.tokens)) {
      questionToEdit.prompt = {
        ...question.prompt,
        rawText: question.prompt.tokens.join("\n"),
      };
    }
    setEditingQuestion(questionToEdit);
  };

  const saveQuestion = () => {
    if (!currentSection || !editingQuestion) return;

    // Remove rawText from prompt before saving (it's only for display)
    const questionToSave = {
      ...editingQuestion,
      prompt: editingQuestion.prompt?.rawText !== undefined
        ? { ...editingQuestion.prompt, rawText: undefined }
        : editingQuestion.prompt,
    };
    // Clean up undefined rawText
    if (questionToSave.prompt && 'rawText' in questionToSave.prompt) {
      delete (questionToSave.prompt as any).rawText;
    }

    const updatedSections = sections.map((s) =>
      s.id === currentSection.id
        ? {
            ...s,
            questions: s.questions.find((q) => q.id === editingQuestion.id)
              ? s.questions.map((q) => (q.id === editingQuestion.id ? questionToSave : q))
              : [...s.questions, questionToSave],
          }
        : s
    );
    setSections(updatedSections);
    setCurrentSection(updatedSections.find((s) => s.id === currentSection.id) || null);
    setEditingQuestion(null);
  };

  const deleteQuestion = (questionId: string) => {
    if (!currentSection) return;
    
    const updatedSections = sections.map(s =>
      s.id === currentSection.id
        ? { ...s, questions: s.questions.filter(q => q.id !== questionId) }
        : s
    );

    setSections(updatedSections);
    setCurrentSection(updatedSections.find(s => s.id === currentSection.id) || null);
  };

  const getDefaultPrompt = (qtype: QuestionType): any => {
    switch (qtype) {
      case "TF":
        return { text: "Enter the statement here" };
      case "MCQ_SINGLE":
      case "MCQ_MULTI":
        return { text: "Enter the question here" };
      case "INLINE_SELECT":
        return { text: "Enter the question here" };
      case "ORDER_SENTENCE":
        return { tokens: ["token1", "token2", "token3"] };
      case "DND_GAP":
        return { textWithBlanks: "Enter text with blanks (use ___ for blanks)" };
      case "SHORT_TEXT":
        return { text: "Enter the question here" };
      case "ESSAY":
        return { text: "Write an essay about..." };
      default:
        return { text: "" };
    }
  };

  const getDefaultOptions = (qtype: QuestionType): any => {
    switch (qtype) {
      case "MCQ_SINGLE":
      case "MCQ_MULTI":
        return { choices: ["Option 1", "Option 2", "Option 3", "Option 4"] };
      case "INLINE_SELECT":
        return { choices: ["Option 1", "Option 2", "Option 3"] };
      case "DND_GAP":
        return { bank: [] }; // Will be auto-generated from answers
      default:
        return undefined;
    }
  };

  const getDefaultAnswerKey = (qtype: QuestionType): any => {
    switch (qtype) {
      case "TF":
        return { value: true };
      case "MCQ_SINGLE":
      case "INLINE_SELECT":
        return { index: 0 };
      case "MCQ_MULTI":
        return { indices: [0, 1] };
      case "ORDER_SENTENCE":
        return { order: [] };
      case "DND_GAP":
        return { blanks: ["word1", "word2"] };
      case "SHORT_TEXT":
        return { answers: ["answer1"] }; // Multiple possible correct answers
      case "ESSAY":
        return null; // No auto-grading for essays
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
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: examTitle,
          category: selectedCategory,
          track: track || null,
          sections: sections.map((s) => {
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
              id: s.id,
              type: s.type,
              title: s.title,
              instruction: JSON.stringify(instructionData),
              durationMin: s.durationMin,
              order: s.order,
              questions: s.questions.map((q) => ({
                id: q.id,
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
        alert(error.error || "Failed to update exam");
      }
    } catch (error) {
      console.error("Failed to update exam:", error);
      alert("Failed to update exam");
    } finally {
      setSaving(false);
    }
  };

  // For brevity, I'll import the rest of the UI from create page
  // But we need to copy the full modal and form components
  // Let me create a simplified version that works

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading exam...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <button
        onClick={() => router.push(`/dashboard/admin/exams/${examId}`)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Exam
      </button>

      <h1 className="text-xl sm:text-2xl font-medium text-gray-900 mb-6">Edit Exam</h1>

      {/* Basic Info */}
      <div className="bg-white border border-gray-200 rounded-md p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Exam Title *</label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
              placeholder="Enter exam title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-3 py-2 text-sm font-medium rounded-md border transition ${
                    selectedCategory === cat
                      ? "text-white"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                  style={selectedCategory === cat ? { backgroundColor: "#303380", borderColor: "#303380" } : {}}
                  onMouseEnter={(e) => {
                    if (selectedCategory === cat) {
                      e.currentTarget.style.backgroundColor = "#252a6b";
                      e.currentTarget.style.borderColor = "#252a6b";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory === cat) {
                      e.currentTarget.style.backgroundColor = "#303380";
                      e.currentTarget.style.borderColor = "#303380";
                    }
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          {selectedCategory === "GENERAL_ENGLISH" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Track (Level)</label>
              <input
                type="text"
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                placeholder="e.g., A1, A2, B1"
              />
            </div>
          )}
        </div>
      </div>

      {/* Sections */}
      {selectedCategory && (
        <div className="bg-white border border-gray-200 rounded-md p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Sections</h2>
            <div className="flex items-center gap-2">
              {allowedSectionTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => addSection(type)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add {SECTION_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {sections.map((section, idx) => (
              <div
                key={section.id}
                className={`border rounded-md p-3 ${
                  currentSection?.id === section.id
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      {idx + 1}. {section.title}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                      {section.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {section.questions.length} questions
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveSection(section)}
                      className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions Editor - Simplified for now */}
      {currentSection && step === "questions" && (
        <div className="bg-white border-2 border-gray-900 rounded-md p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Editing: {currentSection.title}
            </h3>
            <button
              onClick={() => setShowQuestionTypeModal(true)}
              className="px-3 py-1.5 text-sm font-medium text-white rounded flex items-center gap-1"
              style={{ backgroundColor: "#303380" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#252a6b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#303380";
              }}
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          </div>

          <div className="space-y-3">
            {currentSection.questions.map((q, idx) => (
              <div key={q.id} className="border border-gray-200 rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Q{idx + 1}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                      {QUESTION_TYPE_LABELS[q.qtype]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => editQuestion(q)}
                      className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {typeof q.prompt === "object" && q.prompt.text
                    ? q.prompt.text
                    : typeof q.prompt === "string"
                    ? q.prompt
                    : JSON.stringify(q.prompt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => router.push(`/dashboard/admin/exams/${examId}`)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={saveExam}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ backgroundColor: "#303380" }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = "#252a6b";
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = "#303380";
            }
          }}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Question Type Modal - Simplified */}
      {showQuestionTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Select Question Type</h3>
              <button
                onClick={() => setShowQuestionTypeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {Object.entries(QUESTION_TYPE_GROUPS).map(([group, types]) => (
                <div key={group}>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{group}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {types.map((type) => (
                      <button
                        key={type}
                        onClick={() => addQuestion(type)}
                        className="px-3 py-2 text-sm text-left border border-gray-200 rounded hover:bg-gray-50"
                      >
                        {QUESTION_TYPE_LABELS[type]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Question Edit Modal - We need to copy the full modal from create page */}
      {/* For now, I'll add a placeholder that redirects to create page logic */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Question</h3>
              <button
                onClick={() => setEditingQuestion(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-0">
              {/* Question Type */}
              <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded-t-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-600">
                  {QUESTION_TYPE_LABELS[editingQuestion.qtype]}
                </div>
              </div>

              {/* Prompt */}
              <div className="p-4 bg-gray-50 border-l-2 border-r-2 border-b-2 border-gray-300">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Text / Prompt *
                </label>
                {editingQuestion.qtype === "ORDER_SENTENCE" ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingQuestion.prompt?.rawText !== undefined 
                        ? editingQuestion.prompt.rawText 
                        : (Array.isArray(editingQuestion.prompt?.tokens) ? editingQuestion.prompt.tokens.join("\n") : "")}
                      onChange={(e) => {
                        const rawText = e.target.value;
                        const tokens = rawText.split("\n").filter((line) => line.trim() !== "");
                        setEditingQuestion({
                          ...editingQuestion,
                          prompt: { 
                            tokens,
                            rawText
                          },
                          answerKey: { order: tokens.map((_, idx) => idx) },
                        });
                      }}
                      placeholder="Enter tokens (one per line)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white resize-y"
                      rows={5}
                    />
                    <p className="text-xs text-gray-500">Enter tokens one per line. They will be shuffled for students.</p>
                  </div>
                ) : editingQuestion.qtype === "SHORT_TEXT" ? (
                  <div className="space-y-3">
                    <textarea
                      value={editingQuestion.prompt?.text || ""}
                      onChange={(e) => {
                        setEditingQuestion({
                          ...editingQuestion,
                          prompt: { ...editingQuestion.prompt, text: e.target.value },
                        });
                      }}
                      placeholder="Enter the question text (e.g., 'What is the capital of France?')"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
                      rows={3}
                    />
                    <div className="pt-3 border-t border-gray-200">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Correct Answers (one per line, case-insensitive)
                      </label>
                      <textarea
                        value={Array.isArray(editingQuestion.answerKey?.answers) ? editingQuestion.answerKey.answers.join("\n") : ""}
                        onChange={(e) => {
                          const answers = e.target.value.split("\n");
                          setEditingQuestion({
                            ...editingQuestion,
                            answerKey: { answers },
                          });
                        }}
                        placeholder="Enter possible correct answers (one per line)&#10;answer1&#10;answer2&#10;answer3"
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
                        rows={4}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Students can enter any of these answers (case-insensitive matching).
                      </p>
                    </div>
                  </div>
                ) : editingQuestion.qtype === "ESSAY" ? (
                  <div className="space-y-3">
                    <textarea
                      value={editingQuestion.prompt?.text || ""}
                      onChange={(e) => {
                        setEditingQuestion({
                          ...editingQuestion,
                          prompt: { ...editingQuestion.prompt, text: e.target.value },
                        });
                      }}
                      placeholder="Enter the essay prompt (e.g., 'Write an essay about the importance of education...')"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
                      rows={4}
                    />
                    <div className="pt-3 border-t border-gray-200 bg-yellow-50 p-3 rounded-md">
                      <p className="text-xs text-yellow-800">
                        <strong>Note:</strong> Essays require manual grading. No auto-scoring will be applied.
                      </p>
                    </div>
                  </div>
                ) : editingQuestion.qtype === "DND_GAP" ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Sentences (one per line, use ___ or ________ for each blank)
                      </label>
                      <textarea
                        value={editingQuestion.prompt?.textWithBlanks || ""}
                        onChange={(e) => {
                          const textWithBlanks = e.target.value;
                          // Split by newlines to get sentences
                          const sentences = textWithBlanks.split('\n').filter(line => line.trim());
                          
                          // Count total blanks across all sentences
                          let totalBlanks = 0;
                          sentences.forEach(sentence => {
                            const blanksInSentence = sentence.split(/___+|________+/).length - 1;
                            totalBlanks += blanksInSentence;
                          });
                          
                          // Initialize blanks array with existing values or empty strings
                          const currentBlanks = Array.isArray(editingQuestion.answerKey?.blanks) 
                            ? editingQuestion.answerKey.blanks 
                            : [];
                          const newBlanks = Array(totalBlanks).fill("").map((_, idx) => currentBlanks[idx] || "");
                          
                          // Auto-generate word bank from answers
                          const wordBank = newBlanks.filter(b => b.trim() !== "");
                          
                          setEditingQuestion({
                            ...editingQuestion,
                            prompt: { textWithBlanks: textWithBlanks },
                            answerKey: { blanks: newBlanks },
                            options: { bank: wordBank }, // Auto-generate word bank from answers
                          });
                        }}
                        placeholder="I ___ running.&#10;She ___ to school every day.&#10;___ this day, ___ the weekend I want to go cinema."
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white resize-y"
                        rows={5}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter one sentence per line. Each sentence can have multiple ___ blanks.
                      </p>
                    </div>
                    
                    {/* Show answer inputs for each blank in each sentence */}
                    {(editingQuestion.prompt?.textWithBlanks || "").split('\n').filter(line => line.trim()).length > 0 && (
                      <div className="pt-3 border-t border-gray-200">
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                          Correct Answers (one per blank)
                        </label>
                        <div className="space-y-3">
                          {(() => {
                            const sentences = (editingQuestion.prompt?.textWithBlanks || "")
                              .split('\n')
                              .filter(line => line.trim());
                            
                            let blankIndex = 0;
                            return sentences.map((sentence, sentenceIdx) => {
                              const blanksInSentence = sentence.split(/___+|________+/).length - 1;
                              const sentenceStartBlank = blankIndex;
                              const blanksForThisSentence = [];
                              
                              for (let i = 0; i < blanksInSentence; i++) {
                                blanksForThisSentence.push(blankIndex);
                                blankIndex++;
                              }
                              
                              return (
                                <div key={sentenceIdx} className="bg-gray-50 p-3 rounded-lg space-y-2">
                                  <div className="flex items-start gap-2">
                                    <div className="flex-shrink-0 w-6 h-6 rounded bg-white flex items-center justify-center text-xs font-medium text-gray-700 mt-1">
                                      {sentenceIdx + 1}
                                    </div>
                                    <div className="flex-1 text-xs text-gray-700 bg-white p-2 rounded">
                                      {sentence.trim()}
                                    </div>
                                  </div>
                                  {blanksForThisSentence.map((globalBlankIdx, localBlankIdx) => (
                                    <div key={globalBlankIdx} className="flex items-center gap-2 ml-8">
                                      <span className="text-xs text-gray-500 w-20">Blank {localBlankIdx + 1}:</span>
                                      <input
                                        type="text"
                                        value={Array.isArray(editingQuestion.answerKey?.blanks) 
                                          ? editingQuestion.answerKey.blanks[globalBlankIdx] || "" 
                                          : ""}
                                        onChange={(e) => {
                                          const blanks = [...(editingQuestion.answerKey?.blanks || [])];
                                          blanks[globalBlankIdx] = e.target.value;
                                          // Auto-generate word bank from all answers
                                          const wordBank = blanks.filter(b => b && b.trim() !== "");
                                          
                                          setEditingQuestion({
                                            ...editingQuestion,
                                            answerKey: { blanks },
                                            options: { bank: wordBank }, // Auto-generate word bank
                                          });
                                        }}
                                        placeholder={`Answer for blank ${localBlankIdx + 1}`}
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
                                      />
                                    </div>
                                  ))}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ) : editingQuestion.qtype === "INLINE_SELECT" ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingQuestion.prompt?.text || ""}
                      onChange={(e) => {
                        setEditingQuestion({
                          ...editingQuestion,
                          prompt: { ...editingQuestion.prompt, text: e.target.value },
                        });
                      }}
                      placeholder="Enter the question text (use ___ for inline dropdown, or leave without ___ for dropdown at the end)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
                      rows={3}
                    />
                    <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">
                      <strong>Tip:</strong> Use ___ (3 underscores) where you want the dropdown to appear inline. 
                      If you don't use ___, the dropdown will appear at the end of the sentence.
                      <br />
                      <strong>Examples:</strong>
                      <br />
                      • "I ___ to school every day." → dropdown appears inline
                      <br />
                      • "What is the capital of France?" → dropdown appears at the end
                    </div>
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
                    rows={3}
                  />
                )}
              </div>

              {/* Options */}
              {(editingQuestion.qtype === "MCQ_SINGLE" ||
                editingQuestion.qtype === "MCQ_MULTI" ||
                editingQuestion.qtype === "INLINE_SELECT") && (
                <div className="p-4 bg-gray-50 border-l-2 border-r-2 border-b-2 border-gray-300">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                  </label>
                  <div className="space-y-2">
                    {(editingQuestion.options?.choices || []).map((opt: string, idx: number) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...(editingQuestion.options?.choices || [])];
                            newOptions[idx] = e.target.value;
                            setEditingQuestion({
                              ...editingQuestion,
                              options: {
                                ...editingQuestion.options,
                                choices: newOptions,
                              },
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
                          placeholder={`Option ${idx + 1}`}
                        />
                        <button
                          onClick={() => {
                            const newOptions = [...(editingQuestion.options?.choices || [])];
                            newOptions.splice(idx, 1);
                            setEditingQuestion({
                              ...editingQuestion,
                              options: {
                                ...editingQuestion.options,
                                choices: newOptions,
                              },
                            });
                          }}
                          className="px-2 py-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-md"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newOptions = [...(editingQuestion.options?.choices || []), ""];
                        setEditingQuestion({
                          ...editingQuestion,
                          options: {
                            ...editingQuestion.options,
                            choices: newOptions,
                          },
                        });
                      }}
                      className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:bg-gray-50 text-sm"
                    >
                      <Plus className="w-3 h-3 inline mr-2" />
                      Add Option
                    </button>
                  </div>
                </div>
              )}

              {/* Answer Key */}
              <div className="p-4 bg-gray-50 border-l-2 border-r-2 border-b-2 border-gray-300 rounded-b-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                )}
                {(editingQuestion.qtype === "MCQ_SINGLE" ||
                  editingQuestion.qtype === "INLINE_SELECT") && (
                  <select
                    value={editingQuestion.answerKey?.index ?? 0}
                    onChange={(e) => {
                      setEditingQuestion({
                        ...editingQuestion,
                        answerKey: { index: parseInt(e.target.value) },
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
                  >
                    {(editingQuestion.options?.choices || []).map((opt: string, idx: number) => (
                      <option key={idx} value={idx}>
                        {opt || `Option ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                )}
                {editingQuestion.qtype === "MCQ_MULTI" && (
                  <div className="space-y-2 p-3 bg-white border border-gray-200 rounded-md">
                    {(editingQuestion.options?.choices || []).map((opt: string, idx: number) => (
                      <label key={idx} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
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
                        <span className="text-sm">{opt || `Option ${idx + 1}`}</span>
                      </label>
                    ))}
                  </div>
                )}
                {editingQuestion.qtype === "DND_GAP" && (
                  <div className="space-y-2 p-3 bg-white border border-gray-200 rounded-md">
                    <p className="text-xs text-gray-500 mb-2">
                      Word Bank will be automatically generated from the correct answers above.
                    </p>
                    {Array.isArray(editingQuestion.options?.bank) && editingQuestion.options.bank.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-2">Auto-generated Word Bank:</p>
                        <div className="flex flex-wrap gap-2">
                          {editingQuestion.options.bank.map((word: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {editingQuestion.qtype === "ORDER_SENTENCE" && (
                  <div className="space-y-2 p-3 bg-white border border-gray-200 rounded-md">
                    <p className="text-xs text-gray-500">
                      The correct order is determined by the token order. Students will see them shuffled.
                    </p>
                    {Array.isArray(editingQuestion.prompt?.tokens) && editingQuestion.prompt.tokens.length > 0 && (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <p className="text-xs font-medium text-gray-700 mb-2">Current order (correct answer):</p>
                        <div className="flex flex-wrap gap-2">
                          {editingQuestion.prompt.tokens.map((token: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {idx + 1}. {token}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveQuestion}
                className="px-4 py-2 text-sm font-medium text-white rounded-md"
                style={{ backgroundColor: "#303380" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#252a6b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#303380";
                }}
              >
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

