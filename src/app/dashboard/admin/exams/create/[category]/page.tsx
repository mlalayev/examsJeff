"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Plus } from "lucide-react";
import ExamInfoForm from "@/components/admin/exams/create/ExamInfoForm";
import SectionsList from "@/components/admin/exams/create/SectionsList";
import QuestionTypeModal from "@/components/admin/exams/create/QuestionTypeModal";
import { DeleteQuestionModal } from "@/components/modals/DeleteQuestionModal";
import { DeleteSectionModal } from "@/components/modals/DeleteSectionModal";
import { AlertModal } from "@/components/modals/AlertModal";
import { QuestionEditModal } from "@/components/admin/exams/create/questionModal/QuestionEditModal";
import type { ExamCategory, SectionType, QuestionType, Section, Question } from "@/components/admin/exams/create/types";
import {
  ALLOWED_SECTIONS_BY_CATEGORY,
  getSectionLabel,
} from "@/components/admin/exams/create/constants";
import { slugToCategory } from "@/lib/exam-category-utils";
import { useIELTSParts } from "@/components/admin/exams/create/ieltsHelpers";
import { createIELTSSections } from "@/components/admin/exams/create/ieltsInitializer";
import IELTSPartSelector from "@/components/admin/exams/create/IELTSPartSelector";
import IELTSSectionContent from "@/components/admin/exams/create/IELTSSectionContent";
import GenericSectionContent from "@/components/admin/exams/create/GenericSectionContent";
import QuestionsList from "@/components/admin/exams/create/QuestionsList";
import { getGroupedQuestionTypes } from "@/components/admin/exams/create/questionTypeRules";
import { createQuestionDraft } from "@/components/admin/exams/create/addQuestionFlow";
import { useBuilderModals } from "@/components/admin/exams/create/useBuilderModals";
import { validateExamInfo, canDeleteSection, canAddSection } from "@/components/admin/exams/create/examValidation";
import { buildExamPayload } from "@/components/admin/exams/create/examSerializer";
import {
  splitFillInBlankQuestions,
  updateQuestionsInSection,
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

  const ieltsParts = useIELTSParts();
  const modals = useBuilderModals();

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

    const questionToSave = {
      ...editingQuestion,
      prompt: editingQuestion.prompt?.rawText !== undefined
        ? { ...editingQuestion.prompt, rawText: undefined }
        : editingQuestion.prompt,
    };

    if (questionToSave.prompt && 'rawText' in questionToSave.prompt) {
      delete (questionToSave.prompt as any).rawText;
    }

    const updatedSections = sections.map((s: Section) => {
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

    modals.showDeleteQuestionModal(questionId, questionText, questionNumber);
  };

  const confirmDeleteQuestion = () => {
    if (!modals.deleteQuestionModal.questionId || !currentSection) return;

    const questionId = modals.deleteQuestionModal.questionId;
    const updatedSections = sections.map((s: Section) => {
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

      return s.id === currentSection?.id
        ? { ...s, questions: s.questions.filter((q: Question) => q.id !== questionId) }
        : s;
    });

    setSections(updatedSections);

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
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 w-4 bg-gray-400 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-400 rounded w-16 animate-pulse"></div>
          </div>
          <div className="h-8 bg-gray-400 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-5 bg-gray-400 rounded w-64 animate-pulse"></div>
        </div>

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

      {/* Question Edit Modal - NOW USING COMPONENT */}
      {editingQuestion && (
        <QuestionEditModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSave={saveQuestion}
          onChange={setEditingQuestion}
          uploadingImage={uploadingImage}
          onImageUpload={async (file) => {
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
                console.log("Image uploaded successfully:", data);
                
                // Handle different image upload scenarios
                if (editingQuestion.qtype === "IMAGE_INTERACTIVE") {
                  setEditingQuestion({
                    ...editingQuestion,
                    prompt: { ...editingQuestion.prompt, backgroundImage: data.path },
                  });
                } else {
                  setEditingQuestion({
                    ...editingQuestion,
                    image: data.path,
                  });
                }
              } else {
                const errorData = await res.json();
                console.error("Upload failed:", errorData);
                modals.showAlert("Failed to Upload Image", errorData.error || "Failed to upload image", "error");
              }
            } catch (error) {
              console.error("Upload error:", error);
              modals.showAlert("Failed to Upload Image", error instanceof Error ? error.message : "Failed to upload image", "error");
            } finally {
              setUploadingImage(false);
            }
          }}
          showAlert={modals.showAlert}
        />
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
