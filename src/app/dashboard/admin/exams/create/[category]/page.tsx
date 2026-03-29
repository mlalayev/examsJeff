"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, X, BookOpen, Plus, Edit, Info, Image, Volume2, PenTool, Mic } from "lucide-react";
import TextFormattingPreview from "@/components/TextFormattingPreview";
import QuestionPreview from "@/components/QuestionPreview";
import ImageUpload from "@/components/ImageUpload";
import ExamInfoForm from "@/components/admin/exams/create/ExamInfoForm";
import SectionsList from "@/components/admin/exams/create/SectionsList";
import QuestionTypeModal from "@/components/admin/exams/create/QuestionTypeModal";
import { DeleteQuestionModal } from "@/components/modals/DeleteQuestionModal";
import { DeleteSectionModal } from "@/components/modals/DeleteSectionModal";
import { AlertModal } from "@/components/modals/AlertModal";
import type { ExamCategory, SectionType, QuestionType, Section, Question } from "@/components/admin/exams/create/types";
import {
  ALLOWED_SECTIONS_BY_CATEGORY,
  getSectionLabel,
  QUESTION_TYPE_LABELS
} from "@/components/admin/exams/create/constants";
import { slugToCategory } from "@/lib/exam-category-utils";
import { useIELTSParts, filterQuestionsByPart, getIELTSPartLabel, calculateIELTSGlobalQuestionNumber } from "@/components/admin/exams/create/ieltsHelpers";
import { createIELTSSections } from "@/components/admin/exams/create/ieltsInitializer";
import IELTSPartSelector from "@/components/admin/exams/create/IELTSPartSelector";
import IELTSSectionContent from "@/components/admin/exams/create/IELTSSectionContent";
import GenericSectionContent from "@/components/admin/exams/create/GenericSectionContent";
import QuestionsList from "@/components/admin/exams/create/QuestionsList";
import { getGroupedQuestionTypes, type QuestionTypeContext } from "@/components/admin/exams/create/questionTypeRules";
import { createQuestionDraft } from "@/components/admin/exams/create/addQuestionFlow";
import { useBuilderModals } from "@/components/admin/exams/create/useBuilderModals";
import { validateExamInfo, validateFillInBlankText, canDeleteSection, canAddSection } from "@/components/admin/exams/create/examValidation";
import { buildExamPayload } from "@/components/admin/exams/create/examSerializer";
import {
  splitFillInBlankQuestions,
  updateQuestionsInSection,
  deleteQuestionFromSection,
  type QuestionOperationContext
} from "@/components/admin/exams/create/questionOperations";
import { createNewSection, deleteSectionFromList, updateSectionInList } from "@/components/admin/exams/create/sectionOperations";

export default function CreateExamPage() {
  const router = useRouter();
  const params = useParams();
  const categorySlug = params.category as string;

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"sections" | "questions">("sections");
  const [examTitle, setExamTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ExamCategory | null>(null);
  const [track, setTrack] = useState("");
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSection, setCurrentSection] = useState<Section | null>(null);
  const [showQuestionTypeModal, setShowQuestionTypeModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedSectionType, setSelectedSectionType] = useState<SectionType | "">("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingQuestionImage, setUploadingQuestionImage] = useState(false);

  const ieltsParts = useIELTSParts();

  const modals = useBuilderModals();
  // Initialize category from URL params and set up sections
  useEffect(() => {
    const category = slugToCategory(categorySlug);

    if (!category) {
      router.push("/dashboard/admin/exams/create");
      return;
    }

    setSelectedCategory(category);

    if (category === "IELTS") {
      setSections(createIELTSSections());
    }

    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [categorySlug, router]);

  const addSection = (type: SectionType) => {
    if (!selectedCategory) {
      modals.showAlert("Category Required", "Please select an exam category first", "warning");
      return;
    }

    if (!canAddSection(selectedCategory)) {
      modals.showAlert("IELTS Exam Structure", "IELTS exam structure is pre-defined. All sections are automatically created.", "info");
      return;
    }

    const allowedTypes = ALLOWED_SECTIONS_BY_CATEGORY[selectedCategory];
    if (!allowedTypes.includes(type)) {
      modals.showAlert("Invalid Section Type", `This section type is not allowed for ${selectedCategory} exams`, "error");
      return;
    }

    const label = getSectionLabel(type, selectedCategory);
    const newSection = createNewSection(type, selectedCategory, sections);

    newSection.title = `${label} Section`;
    newSection.instruction = `Complete the ${label.toLowerCase()} section`;

    if (type === "READING") {
      newSection.passage = undefined;
    }
    if (type === "LISTENING") {
      newSection.audio = undefined;
    }

    setSections([...sections, newSection]);
    setCurrentSection(newSection);
    setStep("questions");
  };

  const addQuestion = (qtype: QuestionType) => {
    if (!currentSection || !selectedCategory) return;

    const result = createQuestionDraft({
      questionType: qtype,
      examCategory: selectedCategory,
      sectionType: currentSection.type,
      currentSection,
      ieltsContext: selectedCategory === "IELTS" ? {
        getCurrentPart: () => ieltsParts.getPartForSection(currentSection.type),
      } : undefined,
    });

    if (!result.valid) {
      modals.showAlert("Invalid Question Type", result.error || "This question type is not allowed", "error");
      return;
    }

    setEditingQuestion(result.question);
    setShowQuestionTypeModal(false);
  };

  const saveQuestion = () => {
    if (!currentSection || !editingQuestion || !selectedCategory) return;

    if (editingQuestion.qtype === "FILL_IN_BLANK") {
      const context: QuestionOperationContext = {
        examCategory: selectedCategory,
        currentSection,
        ieltsContext: selectedCategory === "IELTS" ? {
          getCurrentPart: () => ieltsParts.getPartForSection(currentSection.type),
        } : undefined,
      };

      const result = splitFillInBlankQuestions(editingQuestion, context);

      if (!result.valid) {
        modals.showAlert(result.error!.title, result.error!.message, "error");
        return;
      }

      const updatedQuestions = updateQuestionsInSection(
        currentSection.questions,
        editingQuestion,
        result.questions
      );

      const updatedSection = {
        ...currentSection,
        questions: updatedQuestions,
      };

      setSections(updateSectionInList(sections, updatedSection));
      setCurrentSection(updatedSection);
      setEditingQuestion(null);
      return;
    }

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
    if (!currentSection) {
      console.error("No current section selected");
      return;
    }

    // Find the question to get its text and number
    let questionToDelete: Question | null = null;
    let questionNumber = 0;

    if (currentSection?.isSubsection) {
      const subsection = sections.find(s => s.subsections?.some(sub => sub.id === currentSection.id))?.subsections?.find(sub => sub.id === currentSection.id);
      if (subsection) {
        questionToDelete = subsection.questions.find(q => q.id === questionId) || null;
        questionNumber = subsection.questions.findIndex(q => q.id === questionId) + 1;
      }
    } else {
      questionToDelete = currentSection.questions.find(q => q.id === questionId) || null;
      questionNumber = currentSection.questions.findIndex(q => q.id === questionId) + 1;
    }

    const questionText = questionToDelete
      ? (typeof questionToDelete.prompt === "object" && questionToDelete.prompt?.text
        ? questionToDelete.prompt.text
        : typeof questionToDelete.prompt === "string"
          ? questionToDelete.prompt
          : "Question")
      : undefined;

    console.log("Opening delete modal for question:", { questionId, questionNumber, questionText });

    modals.showDeleteQuestionModal(questionId, questionText, questionNumber);
  };

  const confirmDeleteQuestion = () => {
    if (!modals.deleteQuestionModal.questionId || !currentSection) return;

    const questionId = modals.deleteQuestionModal.questionId;
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
    modals.closeDeleteQuestionModal();
  };

  const deleteSection = (sectionId: string) => {
    if (!selectedCategory) return;

    if (!canDeleteSection(selectedCategory)) {
      modals.showAlert("Cannot Delete Section", "IELTS sections cannot be deleted. The exam structure is pre-defined.", "warning");
      return;
    }

    const sectionToDelete = sections.find(s => s.id === sectionId);
    if (!sectionToDelete) return;

    const questionsCount = sectionToDelete.questions?.length || 0;

    modals.showDeleteSectionModal(sectionId, sectionToDelete.title, questionsCount);
  };

  const confirmDeleteSection = () => {
    if (!modals.deleteSectionModal.sectionId) return;

    const sectionId = modals.deleteSectionModal.sectionId;
    const updatedSections = deleteSectionFromList(sections, sectionId);

    setSections(updatedSections);
    if (currentSection?.id === sectionId) {
      setCurrentSection(null);
      setStep("sections");
    }
    modals.closeDeleteSectionModal();
  };

  const saveExam = async () => {
    const validation = validateExamInfo(selectedCategory, examTitle, sections);

    if (!validation.valid) {
      modals.showAlert(validation.error!.title, validation.error!.message, "error");
      return;
    }

    setSaving(true);
    try {
      const payload = buildExamPayload(
        examTitle,
        selectedCategory!,
        track,
        durationMin,
        sections
      );

      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/admin/exams/${data.exam.id}`);
      } else {
        const error = await res.json();
        console.error("Server error response:", error);
        modals.showAlert("Failed to Create Exam", error.error || error.details || JSON.stringify(error), "error");
      }
    } catch (error) {
      console.error("Failed to create exam:", error);
      modals.showAlert("Failed to Create Exam", error instanceof Error ? error.message : String(error), "error");
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

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 sm:p-6 border border-gray-200 rounded-md">
              <div className="h-6 bg-gray-400 rounded w-32 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-400 rounded w-full animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedCategory) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <p className="text-gray-600">Invalid category. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Minimal Header */}
      <div className="mb-8 sm:mb-12">
        <button
          onClick={() => router.push("/dashboard/admin/exams/create")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Categories
        </button>
        <h1 className="text-xl sm:text-2xl font-medium text-gray-900">Create New Exam - {selectedCategory}</h1>
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
          if (selectedCategory === "IELTS") {
            ieltsParts.resetParts();
          }
        }}
        onSectionDelete={deleteSection}
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
          {selectedCategory === "IELTS" ? (
            <IELTSSectionContent section={currentSection} />
          ) : (
            <GenericSectionContent section={currentSection} />
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

          {/* Part Selection Buttons for IELTS */}
          {selectedCategory === "IELTS" && currentSection && (
            <IELTSPartSelector
              sectionType={currentSection.type}
              currentPart={ieltsParts.getPartForSection(currentSection.type)}
              onPartChange={(part) => ieltsParts.setPartForSection(currentSection.type, part)}
              questions={currentSection.questions}
            />
          )}

          {/* Questions List */}
          <QuestionsList
            questions={currentSection.questions}
            examCategory={selectedCategory}
            sectionType={currentSection.type}
            currentPart={selectedCategory === "IELTS" ? ieltsParts.getPartForSection(currentSection.type) : undefined}
            onEdit={editQuestion}
            onDelete={deleteQuestion}
          />
        </div>
      )}

      {/* Question Type Modal */}
      <QuestionTypeModal
        isOpen={showQuestionTypeModal}
        onClose={() => setShowQuestionTypeModal(false)}
        onSelect={(type) => addQuestion(type)}
        allowedGroups={
          currentSection && selectedCategory
            ? getGroupedQuestionTypes({
              examCategory: selectedCategory,
              sectionType: currentSection.type,
              ieltsContext: selectedCategory === "IELTS" ? {
                part: ieltsParts.getPartForSection(currentSection.type),
              } : undefined,
            })
            : undefined
        }
      />

      {/* Section Edit Modal removed - now using inline edit in SectionCard */}

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
                          modals.showAlert("Failed to Upload Image", "Failed to upload image", "error");
                        }
                      } catch (error) {
                        console.error("Upload error:", error);
                        modals.showAlert("Failed to Upload Image", "Failed to upload image", "error");
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
                ) : editingQuestion.qtype === "FILL_IN_BLANK" ? (
                  <div className="space-y-3">
                    {/* Question Title/Name */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Question Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={editingQuestion.prompt?.title || ""}
                        onChange={(e) => {
                          setEditingQuestion({
                            ...editingQuestion,
                            prompt: {
                              ...editingQuestion.prompt,
                              title: e.target.value
                            },
                          });
                        }}
                        placeholder="e.g., Complete the form below"
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
                      />
                    </div>

                    {/* Image Upload */}
                    <ImageUpload
                      label="Image (Optional)"
                      value={editingQuestion.image || ""}
                      onChange={(url) => {
                        setEditingQuestion({
                          ...editingQuestion,
                          image: url,
                        });
                      }}
                    />

                    {/* Instructions/What to do */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Instructions (What to do)
                      </label>
                      <textarea
                        value={editingQuestion.prompt?.instructions || ""}
                        onChange={(e) => {
                          setEditingQuestion({
                            ...editingQuestion,
                            prompt: { ...editingQuestion.prompt, instructions: e.target.value },
                          });
                        }}
                        placeholder="Fill in the blanks with appropriate words"
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
                        rows={2}
                      />
                    </div>

                    {/* Text with [input] placeholders */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Text with blanks (use [input] for each blank)
                      </label>
                      <textarea
                        value={editingQuestion.prompt?.text || ""}
                        onChange={(e) => {
                          const text = e.target.value;
                          // Count [input] occurrences
                          const inputCount = (text.match(/\[input\]/gi) || []).length;

                          // Initialize answer key with existing values or empty strings
                          const currentBlanks = Array.isArray(editingQuestion.answerKey?.blanks)
                            ? editingQuestion.answerKey.blanks
                            : [];
                          const newBlanks = Array(inputCount).fill("").map((_, idx) => currentBlanks[idx] || "");

                          setEditingQuestion({
                            ...editingQuestion,
                            prompt: { ...editingQuestion.prompt, text },
                            answerKey: { blanks: newBlanks },
                          });
                        }}
                        placeholder="Example:&#10;Hi, my name is [input] and I am [input] years old.&#10;Nice to [input] you!&#10;I am glad to [input] you here."
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white resize-y"
                        rows={6}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use [input] where you want students to fill in answers. Each [input] will be a separate question.
                      </p>
                    </div>

                    {/* Answer inputs for each blank */}
                    {(editingQuestion.prompt?.text || "").match(/\[input\]/gi)?.length > 0 && (
                      <div className="pt-3 border-t border-gray-200">
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                          Correct Answers (one per blank)
                        </label>
                        <div className="space-y-2">
                          {Array.from({ length: (editingQuestion.prompt?.text || "").match(/\[input\]/gi)?.length || 0 }).map((_, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 w-20">Blank {idx + 1}:</span>
                              <input
                                type="text"
                                value={Array.isArray(editingQuestion.answerKey?.blanks)
                                  ? editingQuestion.answerKey.blanks[idx] || ""
                                  : ""}
                                onChange={(e) => {
                                  const blanks = [...(editingQuestion.answerKey?.blanks || [])];
                                  blanks[idx] = e.target.value;
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    answerKey: { blanks },
                                  });
                                }}
                                placeholder={`Answer for blank ${idx + 1}`}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Total blanks: {(editingQuestion.prompt?.text || "").match(/\[input\]/gi)?.length || 0}
                        </p>
                      </div>
                    )}
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
                ) : editingQuestion.qtype === "SPEAKING_RECORDING" ? (
                  <div className="space-y-3">
                    {/* Speaking Part Selection */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Speaking Part *
                      </label>
                      <select
                        value={editingQuestion.prompt?.part || 1}
                        onChange={(e) => {
                          setEditingQuestion({
                            ...editingQuestion,
                            prompt: { ...editingQuestion.prompt, part: parseInt(e.target.value) },
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
                      >
                        <option value={1}>Part 1 (3s reading + 30s recording)</option>
                        <option value={2}>Part 2 (1min prep + 3s reading + 2min recording)</option>
                        <option value={3}>Part 3 (3s reading + 1min recording)</option>
                      </select>
                    </div>

                    {/* Question Text */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Question Text *
                      </label>
                      <textarea
                        value={editingQuestion.prompt?.text || ""}
                        onChange={(e) => {
                          setEditingQuestion({
                            ...editingQuestion,
                            prompt: { ...editingQuestion.prompt, text: e.target.value },
                          });
                        }}
                        placeholder="Enter the speaking question (e.g., 'What is your name?', 'Describe a place you like to visit.', etc.)"
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
                        rows={4}
                      />
                    </div>

                    <div className="pt-3 border-t border-gray-200 bg-blue-50 p-3 rounded-md">
                      <p className="text-xs text-blue-800 space-y-1">
                        <strong>Note:</strong>
                        <br />
                        • Students get 3 seconds to read the question
                        <br />
                        {editingQuestion.prompt?.part === 2 && "• Part 2: 1 minute preparation → 3 seconds reading → 2 minutes recording"}
                        {editingQuestion.prompt?.part === 1 && "• Part 1: 3 seconds reading → 30 seconds recording"}
                        {editingQuestion.prompt?.part === 3 && "• Part 3: 3 seconds reading → 1 minute recording"}
                        <br />
                        • Recording starts and stops automatically (students cannot control it)
                      </p>
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
                                    modals.showAlert("Failed to Upload Image", "Failed to upload image", "error");
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
            onClick={() => router.push("/dashboard/admin/exams/create")}
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

      {/* Delete Question Modal */}
      <DeleteQuestionModal
        isOpen={modals.deleteQuestionModal.isOpen}
        onClose={modals.closeDeleteQuestionModal}
        onConfirm={confirmDeleteQuestion}
        questionText={modals.deleteQuestionModal.questionText}
        questionNumber={modals.deleteQuestionModal.questionNumber}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={modals.alertModal.isOpen}
        onClose={modals.closeAlertModal}
        title={modals.alertModal.title}
        message={modals.alertModal.message}
        type={modals.alertModal.type}
      />

      {/* Delete Section Modal */}
      <DeleteSectionModal
        isOpen={modals.deleteSectionModal.isOpen}
        onClose={modals.closeDeleteSectionModal}
        onConfirm={confirmDeleteSection}
        sectionTitle={modals.deleteSectionModal.sectionTitle}
        questionsCount={modals.deleteSectionModal.questionsCount}
      />
    </div>
  );
}

