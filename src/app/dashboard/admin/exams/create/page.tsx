"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X, BookOpen, Plus, Edit, Info, Image, Volume2 } from "lucide-react";
import TextFormattingPreview from "@/components/TextFormattingPreview";
import QuestionPreview from "@/components/QuestionPreview";
import ImageUpload from "@/components/ImageUpload";
import CategorySelector from "@/components/admin/exams/create/CategorySelector";
import ExamInfoForm from "@/components/admin/exams/create/ExamInfoForm";
import SectionsList from "@/components/admin/exams/create/SectionsList";
import QuestionTypeModal from "@/components/admin/exams/create/QuestionTypeModal";
import type { ExamCategory, SectionType, QuestionType, Section, Question } from "@/components/admin/exams/create/types";
import { 
  ALLOWED_SECTIONS_BY_CATEGORY, 
  IELTS_SECTION_INSTRUCTIONS, 
  IELTS_SECTION_DURATIONS,
  getSectionLabel,
  QUESTION_TYPE_LABELS
} from "@/components/admin/exams/create/constants";
import { getDefaultPrompt, getDefaultOptions, getDefaultAnswerKey } from "@/components/admin/exams/create/questionHelpers";

export default function CreateExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"category" | "sections" | "questions">("category");
  const [examTitle, setExamTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ExamCategory | null>(null);
  const [track, setTrack] = useState("");
  const [durationMin, setDurationMin] = useState<number | null>(null); // Optional exam timer
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
  const [uploadingQuestionImage, setUploadingQuestionImage] = useState(false);

  // Simulate page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const categories: ExamCategory[] = ["IELTS", "TOEFL", "SAT", "GENERAL_ENGLISH", "MATH", "KIDS"];

  const handleCategorySelect = (category: ExamCategory) => {
    setSelectedCategory(category);

    // Category dəyişəndə, əgər artıq section-lar varsa və onlar yeni category-ə uyğun deyilsə, təmizlə
    const allowedTypes = ALLOWED_SECTIONS_BY_CATEGORY[category];
    const currentSections = sections || []; // Guard against undefined
    const hasInvalidSections = currentSections.some((section: Section) => !allowedTypes.includes(section.type));

    if (hasInvalidSections) {
      if (confirm("Changing category will remove sections that are not allowed for this exam type. Continue?")) {
        setSections([]);
        setCurrentSection(null);
        setStep("sections");
      } else {
        return; // İstifadəçi ləğv etdi
      }
    } else {
      // IELTS seçildikdə avtomatik 4 section yarat
      if (category === "IELTS" && currentSections.length === 0) {
        const ieltsSections: Section[] = [
          {
            id: `section-${Date.now()}-1`,
            type: "LISTENING",
            title: "Listening Section",
            instruction: IELTS_SECTION_INSTRUCTIONS.LISTENING,
            durationMin: IELTS_SECTION_DURATIONS.LISTENING,
            order: 0,
            questions: [],
          },
          {
            id: `section-${Date.now()}-2`,
            type: "READING",
            title: "Reading Section",
            instruction: IELTS_SECTION_INSTRUCTIONS.READING,
            durationMin: IELTS_SECTION_DURATIONS.READING,
            order: 1,
            questions: [],
          },
          {
            id: `section-${Date.now()}-3`,
            type: "WRITING",
            title: "Writing Section",
            instruction: IELTS_SECTION_INSTRUCTIONS.WRITING,
            durationMin: IELTS_SECTION_DURATIONS.WRITING,
            order: 2,
            questions: [],
          },
          {
            id: `section-${Date.now()}-4`,
            type: "SPEAKING",
            title: "Speaking Section",
            instruction: IELTS_SECTION_INSTRUCTIONS.SPEAKING,
            durationMin: IELTS_SECTION_DURATIONS.SPEAKING,
            order: 3,
            questions: [],
          },
        ];
        setSections(ieltsSections);
      }
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

    const currentSections = sections || []; // Guard against undefined

    const label = getSectionLabel(type, selectedCategory);

    const defaultDuration = 15;

    const newSection: Section = {
      id: `section-${Date.now()}`,
      type,
      title: `${label} Section`,
      instruction: `Complete the ${label.toLowerCase()} section`,
      durationMin: defaultDuration,
      order: currentSections.length,
      questions: [],
      passage: type === "READING" ? undefined : undefined,
      audio: type === "LISTENING" ? undefined : undefined,
    };

    setSections([...currentSections, newSection]);
    setCurrentSection(newSection);
    setStep("questions");
  };

  const addQuestion = (qtype: QuestionType) => {
    if (!currentSection) return;

    const defaultPrompt = getDefaultPrompt(qtype);
    // For ORDER_SENTENCE, add rawText for display
    if (qtype === "ORDER_SENTENCE" && Array.isArray(defaultPrompt.tokens)) {
      defaultPrompt.rawText = defaultPrompt.tokens.join("\n");
    }

    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      qtype,
      order: currentSection.questions.length,
      prompt: defaultPrompt,
      options: getDefaultOptions(qtype),
      answerKey: getDefaultAnswerKey(qtype),
      maxScore: 1,
    };

    setEditingQuestion(newQuestion);
    setShowQuestionTypeModal(false);
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

    const updatedSections = sections.map((s: Section) => {
      // If current section is a subsection, update inside parent
      if (currentSection?.isSubsection && s.subsections) {
        return {
          ...s,
          subsections: s.subsections.map((sub: Section) =>
            sub.id === currentSection.id
              ? {
                  ...sub,
                  questions: editingQuestion.id.startsWith("q-") && sub.questions.find((q: Question) => q.id === editingQuestion.id)
                    ? sub.questions.map((q: Question) => (q.id === editingQuestion.id ? questionToSave : q))
                    : [...sub.questions, questionToSave],
                }
              : sub
          ),
        };
      }
      // Regular section
      return s.id === currentSection?.id
        ? {
          ...s,
          questions: editingQuestion.id.startsWith("q-") && s.questions.find((q: Question) => q.id === editingQuestion.id)
            ? s.questions.map((q: Question) => (q.id === editingQuestion.id ? questionToSave : q))
            : [...s.questions, questionToSave],
        }
        : s;
    });
    setSections(updatedSections);

    // Update currentSection
    const findCurrentSection = (sections: Section[]): Section | null => {
      if (!currentSection) return null;
      for (const s of sections) {
        if (s.id === currentSection.id) return s;
        if (s.subsections) {
          const found = s.subsections.find((sub: Section) => sub.id === currentSection.id);
          if (found) return found;
        }
      }
      return null;
    };
    setCurrentSection(findCurrentSection(updatedSections));
    setEditingQuestion(null);
  };

  const editQuestion = (question: Question) => {
    // If it's ORDER_SENTENCE and has tokens, set rawText for display
    const questionToEdit = { ...question };
    if (question.qtype === "ORDER_SENTENCE" && Array.isArray(question.prompt?.tokens)) {
      questionToEdit.prompt = {
        ...question.prompt,
        rawText: question.prompt.tokens.join("\n"),
      };
    }
    setEditingQuestion(questionToEdit);
  };

  const deleteQuestion = (questionId: string) => {
    if (!currentSection) return;
    const updatedSections = sections.map((s: Section) => {
      // If current section is a subsection
      if (currentSection?.isSubsection && s.subsections) {
        return {
          ...s,
          subsections: s.subsections.map((sub: Section) =>
            sub.id === currentSection.id
              ? { ...sub, questions: sub.questions.filter((q: Question) => q.id !== questionId) }
              : sub
          ),
        };
      }
      // Regular section
      return s.id === currentSection?.id
        ? { ...s, questions: s.questions.filter((q: Question) => q.id !== questionId) }
        : s;
    });
    setSections(updatedSections);

    // Update currentSection
    const findCurrentSection = (sections: Section[]): Section | null => {
      if (!currentSection) return null;
      for (const s of sections) {
        if (s.id === currentSection.id) return s;
        if (s.subsections) {
          const found = s.subsections.find((sub: Section) => sub.id === currentSection.id);
          if (found) return found;
        }
      }
      return null;
    };
    setCurrentSection(findCurrentSection(updatedSections));
  };

  const deleteSection = (sectionId: string) => {
    if (confirm("Are you sure you want to delete this section? All questions in this section will be deleted.")) {
      const updatedSections = sections.filter((s: Section) => s.id !== sectionId);
      setSections(updatedSections);
      if (currentSection?.id === sectionId) {
        setCurrentSection(null);
        setStep("sections");
      }
    }
  };

  const addSubsection = (parentSectionId: string) => {
    const parentSection = sections.find((s: Section) => s.id === parentSectionId);
    if (!parentSection) return;

    const currentSubsections = parentSection.subsections || [];
    const nextPartNumber = currentSubsections.length + 1;

    const newSubsection: Section = {
      id: `subsection-${parentSectionId}-part${nextPartNumber}`,
      type: "LISTENING",
      title: `Listening - Part ${nextPartNumber}`,
      instruction: `Complete Part ${nextPartNumber} questions`,
      durationMin: 0,
      order: nextPartNumber - 1,
      questions: [],
      audio: parentSection.audio,
      image: undefined,
      introduction: undefined,
      isSubsection: true,
      parentId: parentSectionId,
    };

    const updatedSections = sections.map((s: Section) => {
      if (s.id === parentSectionId) {
        return {
          ...s,
          subsections: [...(s.subsections || []), newSubsection],
        };
      }
      return s;
    });

    setSections(updatedSections);
  };


  const saveExam = async () => {
    if (!selectedCategory || !examTitle.trim() || sections.length === 0) {
      alert("Please fill in all required fields and add at least one section");
      return;
    }

    setSaving(true);
    try {
      let sortedSections = sections;

      // Flatten subsections for API
      // For IELTS Listening: skip parent section, send only subsections with parentTitle reference
      const flattenedSections: any[] = [];
      for (const s of sortedSections) {
        if (s.subsections && s.subsections.length > 0) {
          // This is a parent section with subsections (IELTS Listening)
          // Skip the parent, send only subsections with parent reference
          s.subsections.forEach((sub, idx) => {
            flattenedSections.push({
              ...sub,
              audio: s.audio, // Use parent's audio
              order: s.order * 1000 + idx, // Use 1000+ for subsections (e.g., 0 -> 0, 1, 2, 3)
              parentTitle: s.title, // Reference to find parent
              parentOrder: s.order, // Reference to find parent
            });
          });
        } else {
          flattenedSections.push(s);
        }
      }

      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: examTitle,
          category: selectedCategory,
          track: track || null,
          readingType: null,
          writingType: null,
          durationMin: durationMin || null, // Optional timer
          sections: flattenedSections.map((s: Section, index: number) => {
            // Combine instruction, passage, audio, introduction, image, image2 into instruction JSON
            const instructionData: any = {
              text: s.instruction,
            };
            if (s.passage) {
              instructionData.passage = s.passage;
            }
            if (s.audio) {
              instructionData.audio = s.audio;
            }
            if (s.introduction) {
              instructionData.introduction = s.introduction;
            }
            if (s.image) {
              instructionData.image = s.image;
            }
            if (s.image2) {
              instructionData.image2 = s.image2;
            }

            // Auto-set duration based on category
            let sectionDurationMin = s.durationMin;
            if (selectedCategory === "SAT") {
              if (s.type === "WRITING") {
                // Math sections: 35 dəqiqə
                sectionDurationMin = 35;
              } else if (s.type === "READING") {
                // Verbal sections: 32 dəqiqə
                sectionDurationMin = 32;
              }
            }

            return {
              type: s.type,
              title: s.title,
              instruction: JSON.stringify(instructionData),
              image: s.image || null, // Section image (for IELTS Listening parts)
              image2: s.image2 || null, // Second section image (for IELTS Listening parts)
              parentSectionId: s.parentSectionId || null, // For subsections (will be set on server)
              parentTitle: s.parentTitle || null, // Temporary reference for server to match
              parentOrder: s.parentOrder !== undefined ? s.parentOrder : null, // Temporary reference
              durationMin: sectionDurationMin,
              order: index,
              questions: (s.questions || []).map((q: Question) => ({
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
        console.error("Server error response:", error);
        alert(`Failed to create exam: ${error.error || error.details || JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error("Failed to create exam:", error);
      alert(`Failed to create exam: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8 sm:mb-12">
          {/* Back Button Skeleton */}
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 w-4 bg-gray-400 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-400 rounded w-16 animate-pulse"></div>
          </div>
          {/* Header Skeleton */}
          <div className="h-8 bg-gray-400 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-5 bg-gray-400 rounded w-64 animate-pulse"></div>
        </div>

        {/* Categories Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 sm:p-6 border border-gray-200 rounded-md">
              <div className="h-6 bg-gray-400 rounded w-32 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-400 rounded w-full animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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

        <CategorySelector categories={categories} onSelect={handleCategorySelect} />
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
      <ExamInfoForm
        examTitle={examTitle}
        onExamTitleChange={setExamTitle}
        selectedCategory={selectedCategory}
        track={track}
        onTrackChange={setTrack}
        durationMin={durationMin}
        onDurationMinChange={setDurationMin}
      />

      {/* Sections */}
      <SectionsList
        sections={sections}
        selectedCategory={selectedCategory}
        currentSection={currentSection}
        step={step}
        selectedSectionType={selectedSectionType}
        onSectionTypeChange={setSelectedSectionType}
        onAddSection={addSection}
        onSectionEdit={(section) => {
          setCurrentSection(section);
          setStep("questions");
        }}
        onSectionDelete={deleteSection}
        onAddSubsection={addSubsection}
        onSectionEditModal={(section) => {
          setEditingSection(section);
          setShowSectionEditModal(true);
        }}
        onSubsectionEdit={(subsection) => {
          setCurrentSection(subsection);
          setStep("questions");
        }}
        onSubsectionDelete={(subsection, sections, setSections, setCurrentSection) => {
          const updatedSections = sections.map((s: Section) => {
            if (s.id === subsection.parentId) {
              return {
                ...s,
                subsections: s.subsections?.filter((sub: Section) => sub.id !== subsection.id) || [],
              };
            }
            return s;
          });
          setSections(updatedSections);
          if (currentSection?.id === subsection.id) {
            setCurrentSection(null);
          }
        }}
        setSections={setSections}
        setCurrentSection={setCurrentSection}
      />

      {/* Questions Editor */}
      {currentSection && step === "questions" && (
        <div className="bg-white border-2 border-slate-900 rounded-md p-4 sm:p-6 mb-6 relative">
          {/* Editing Indicator */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <span
                className="w-1.5 h-1.5 bg-slate-900 rounded-full"
                style={{
                  animation: 'bounce-slow 1.2s infinite',
                  animationDelay: '0s'
                }}
              ></span>
              <span
                className="w-1.5 h-1.5 bg-slate-900 rounded-full"
                style={{
                  animation: 'bounce-slow 1.2s infinite',
                  animationDelay: '0.2s'
                }}
              ></span>
              <span
                className="w-1.5 h-1.5 bg-slate-900 rounded-full"
                style={{
                  animation: 'bounce-slow 1.2s infinite',
                  animationDelay: '0.4s'
                }}
              ></span>
            </div>
            <span className="text-xs sm:text-sm font-medium text-slate-900 inline-block min-w-[60px]">
              <span className="typing-text">Editing</span>
            </span>
          </div>

          <style jsx>{`
            .typing-text {
              display: inline-block;
              overflow: hidden;
              white-space: nowrap;
              animation: typing 3.5s steps(7, end) infinite;
            }
            
            @keyframes typing {
              0% { width: 0ch; }
              7.14% { width: 1ch; }
              14.28% { width: 2ch; }
              21.42% { width: 3ch; }
              28.56% { width: 4ch; }
              35.7% { width: 5ch; }
              42.84% { width: 6ch; }
              50% { width: 7ch; }
              57.14% { width: 6ch; }
              64.28% { width: 5ch; }
              71.42% { width: 4ch; }
              78.56% { width: 3ch; }
              85.7% { width: 2ch; }
              92.84% { width: 1ch; }
              100% { width: 0ch; }
            }
          `}</style>

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
          {(currentSection.type === "READING" || (currentSection.type === "LISTENING" && !currentSection.isSubsection)) && (
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
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white rounded-md flex items-center gap-1.5 sm:gap-2"
                style={{ backgroundColor: "#303380" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#252a6b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#303380";
                }}
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
      <QuestionTypeModal
        isOpen={showQuestionTypeModal}
        onClose={() => setShowQuestionTypeModal(false)}
        onSelect={(type) => addQuestion(type)}
      />

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
                {editingSection.type === "READING"
                  ? "Edit Reading Passage"
                  : editingSection.type === "WRITING"
                    ? `Edit ${editingSection.title} - Task Image & Instruction`
                    : editingSection.isSubsection
                      ? `Edit ${editingSection.title} - Image & Introduction`
                      : "Edit Listening Audio"
                }
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
                <div className="space-y-4">
                  {/* Audio Upload - Only for main Listening section (not subsections) */}
                  {!editingSection.isSubsection && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Listening Audio (All Parts) *
                      </label>
                      {selectedCategory === "IELTS" && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-xs text-blue-800 font-medium mb-1">
                            📝 IELTS Listening Requirements:
                          </p>
                          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                            <li>Must have exactly <strong>40 questions</strong> (10 per part)</li>
                            <li>4 parts: Conversation (1), Monologue (2), Discussion (3), Lecture (4)</li>
                            <li>Audio will play automatically with restrictions (no pause/seek for students)</li>
                            <li><strong>One audio file for all 4 parts</strong></li>
                          </ul>
                        </div>
                      )}
                      <div className="space-y-2">
                        {editingSection.audio ? (
                          <div className="p-2 bg-gray-50 rounded-md text-sm text-gray-600">
                            Current: {editingSection.audio}
                          </div>
                        ) : (
                          <div className="p-2 bg-blue-50 rounded-md text-sm text-blue-600">
                            Audio will be shared across all 4 parts
                          </div>
                        )}
                        <input
                          type="file"
                          accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.wma"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const validAudioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma'];
                            const hasValidExtension = validAudioExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

                            if (!hasValidExtension) {
                              alert("Please upload a valid audio file (mp3, wav, ogg, m4a, aac, flac, wma)");
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
                                // Update main section and all its subsections with same audio
                                const updatedSections = sections.map((s: Section) => {
                                  if (s.id === editingSection.id) {
                                    return {
                                      ...s,
                                      audio: data.path,
                                      subsections: s.subsections?.map((sub: Section) => ({ ...sub, audio: data.path })),
                                    };
                                  }
                                  return s;
                                });
                                setSections(updatedSections);
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

                  {/* Image and Introduction - For subsections only */}
                  {editingSection.isSubsection && selectedCategory === "IELTS" && (
                    <>
                      <ImageUpload
                        label="Part Image (Optional)"
                        value={editingSection.image || ""}
                        onChange={(url) => {
                          setEditingSection({
                            ...editingSection,
                            image: url,
                          });
                        }}
                      />

                      <ImageUpload
                        label="Second Part Image (Optional)"
                        value={editingSection.image2 || ""}
                        onChange={(url) => {
                          setEditingSection({
                            ...editingSection,
                            image2: url,
                          });
                        }}
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Part Introduction <span className="text-gray-500 font-normal">(Optional)</span>
                        </label>
                        <textarea
                          value={editingSection.introduction || ""}
                          onChange={(e) => {
                            setEditingSection({
                              ...editingSection,
                              introduction: e.target.value,
                            });
                          }}
                          placeholder="Enter introduction text for this part (e.g., 'You will hear a conversation between two people...')"
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                          rows={4}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Introduction will appear on the left side with the image (if provided)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* WRITING - Task Image & Instruction */}
              {editingSection.type === "WRITING" && editingSection.isSubsection && (
                <>
                  <ImageUpload
                    label="Task Image (Optional)"
                    value={editingSection.image || ""}
                    onChange={(url) => {
                      setEditingSection({
                        ...editingSection,
                        image: url,
                      });
                    }}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Task Instruction *
                    </label>
                    <textarea
                      value={editingSection.instruction || ""}
                      onChange={(e) => {
                        setEditingSection({
                          ...editingSection,
                          instruction: e.target.value,
                        });
                      }}
                      placeholder="Enter task instruction (e.g., 'Summarise the information by selecting and reporting the main features...')"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                      rows={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Task instruction will appear above the writing area
                    </p>
                  </div>
                </>
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
                  if (editingSection.type === "LISTENING" && !editingSection.isSubsection && !editingSection.audio) {
                    alert("Please upload an audio file");
                    return;
                  }

                  // Update section in sections array
                  const updatedSections = sections.map((s) => {
                    // If editing a subsection, update it inside parent's subsections
                    if (editingSection.isSubsection && s.subsections) {
                      return {
                        ...s,
                        subsections: s.subsections.map(sub =>
                          sub.id === editingSection.id ? editingSection : sub
                        ),
                      };
                    }
                    // If editing parent section
                    if (s.id === editingSection.id) {
                      return editingSection;
                    }
                    return s;
                  });
                  setSections(updatedSections);

                  // Update currentSection if it's the same
                  if (currentSection?.id === editingSection.id) {
                    setCurrentSection(editingSection);
                  }

                  setShowSectionEditModal(false);
                  setEditingSection(null);
                }}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-white rounded-md"
                style={{ backgroundColor: "#303380" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#252a6b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#303380";
                }}
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
                {editingQuestion.id.startsWith("q-") && currentSection?.questions.find((q: Question) => q.id === editingQuestion.id)
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

              {/* Image Upload (for all question types) */}
              <div className="p-4 bg-gray-50 border-l-2 border-r-2 border-b-2 border-gray-300">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Image <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <div className="space-y-2">
                  {editingQuestion.image && (
                    <div className="p-3 bg-white border border-gray-200 rounded-md">
                      <img
                        src={editingQuestion.image}
                        alt="Question"
                        className="max-w-full h-auto max-h-48 rounded border border-gray-200"
                      />
                      <p className="text-xs text-gray-500 mt-2">{editingQuestion.image}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuestion({
                            ...editingQuestion,
                            image: undefined,
                          });
                        }}
                        className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove Image
                      </button>
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 disabled:opacity-50 bg-white"
                  />
                  {uploadingImage && (
                    <p className="text-xs text-gray-500">Uploading image...</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Upload diagrams, charts, or any visual content for your question
                  </p>
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
                        // Store the raw text value to allow Enter key to work
                        const rawText = e.target.value;
                        // Split by newlines and filter out empty lines for storage
                        const tokens = rawText.split("\n").filter((line) => line.trim() !== "");
                        setEditingQuestion({
                          ...editingQuestion,
                          prompt: {
                            tokens,
                            rawText // Store raw text for display
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
                    {(editingQuestion.prompt?.textWithBlanks || "").split('\n').filter((line: string) => line.trim()).length > 0 && (
                      <div className="pt-3 border-t border-gray-200">
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                          Correct Answers (one per blank)
                        </label>
                        <div className="space-y-3">
                          {(() => {
                            const sentences = (editingQuestion.prompt?.textWithBlanks || "")
                              .split('\n')
                              .filter((line: string) => line.trim());

                            let blankIndex = 0;
                            return sentences.map((sentence: string, sentenceIdx: number) => {
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
                  <>
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
                    <div className="mt-2 text-xs text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-200 flex items-center gap-2">
                      <Info className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      <span>
                        <strong>Text Formatting:</strong> **bold** | __underline__ | ~~strikethrough~~ | &&italic&&
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Options (for MCQ, INLINE_SELECT, etc.) */}
              {(editingQuestion.qtype === "MCQ_SINGLE" ||
                editingQuestion.qtype === "MCQ_MULTI" ||
                editingQuestion.qtype === "INLINE_SELECT") && (
                  <div className="p-4 bg-gray-50 border-l-2 border-r-2 border-b-2 border-gray-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options
                    </label>
                    <div className="space-y-3">
                      {(editingQuestion.options?.choices || []).map((opt: string, idx: number) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex gap-2">
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
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  const formData = new FormData();
                                  formData.append("file", file);

                                  try {
                                    const res = await fetch("/api/upload", {
                                      method: "POST",
                                      body: formData,
                                    });
                                    const data = await res.json();

                                    if (data.url) {
                                      const newOptionsImages = [...(editingQuestion.options?.choiceImages || [])];
                                      newOptionsImages[idx] = data.url;
                                      setEditingQuestion({
                                        ...editingQuestion,
                                        options: {
                                          ...editingQuestion.options,
                                          choiceImages: newOptionsImages,
                                        },
                                      });
                                    }
                                  } catch (error) {
                                    console.error("Upload error:", error);
                                    alert("Failed to upload image");
                                  }
                                }}
                              />
                              <div className="px-2 py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
                                <Image className="w-3 h-3 sm:w-4 sm:h-4" />
                              </div>
                            </label>
                            <button
                              onClick={() => {
                                const newOptions = [...(editingQuestion.options?.choices || [])];
                                newOptions.splice(idx, 1);
                                const newImages = [...(editingQuestion.options?.choiceImages || [])];
                                newImages.splice(idx, 1);
                                setEditingQuestion({
                                  ...editingQuestion,
                                  options: {
                                    ...editingQuestion.options,
                                    choices: newOptions,
                                    choiceImages: newImages,
                                  },
                                });
                              }}
                              className="px-2 py-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-md"
                            >
                              <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                          {editingQuestion.options?.choiceImages?.[idx] && (
                            <div className="relative inline-block">
                              <img
                                src={editingQuestion.options.choiceImages[idx]}
                                alt={`Option ${idx + 1}`}
                                className="h-20 w-auto rounded border border-gray-200"
                              />
                              <button
                                onClick={() => {
                                  const newImages = [...(editingQuestion.options?.choiceImages || [])];
                                  newImages[idx] = undefined;
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    options: {
                                      ...editingQuestion.options,
                                      choiceImages: newImages,
                                    },
                                  });
                                }}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs"
                              >
                                ×
                              </button>
                            </div>
                          )}
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
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
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
                    <p className="text-xs sm:text-sm text-gray-500">
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
                        <p className="text-xs text-gray-500 mt-2">
                          Answer key: {JSON.stringify(editingQuestion.prompt.tokens.map((_: any, idx: number) => idx))}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Question Preview */}
            <QuestionPreview question={editingQuestion} />

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setEditingQuestion(null)}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveQuestion}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-white rounded-md"
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
            className="px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Exam"}
          </button>
        </div>
      )}
    </div>
  );
}

