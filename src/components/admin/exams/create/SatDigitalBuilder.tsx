"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save } from "lucide-react";
import ExamInfoForm from "@/components/admin/exams/create/ExamInfoForm";
import QuestionTypeModal from "@/components/admin/exams/create/QuestionTypeModal";
import QuestionsList from "@/components/admin/exams/create/QuestionsList";
import { QuestionEditModal } from "@/components/admin/exams/create/questionModal/QuestionEditModal";
import { DeleteQuestionModal } from "@/components/modals/DeleteQuestionModal";
import { AlertModal } from "@/components/modals/AlertModal";
import type { ExamCategory, Question, QuestionType, Section } from "@/components/admin/exams/create/types";
import { createQuestionDraft } from "@/components/admin/exams/create/addQuestionFlow";
import { validateExamInfo } from "@/components/admin/exams/create/examValidation";
import { buildExamPayload } from "@/components/admin/exams/create/examSerializer";

const SAT_CATEGORY: ExamCategory = "SAT";

// SAT Digital modules are positional: Verbal 1 → Verbal 2 → Math 1 → Math 2.
// Sections are matched by their order (array index) so this works for both freshly
// created exams and existing ones loaded for editing, regardless of SectionType.
const MODULE_LABELS = ["Verbal 1", "Verbal 2", "Math 1", "Math 2"];

export function createSatDigitalSections(): Section[] {
  return [
    {
      id: "sat-verbal-1",
      type: "READING",
      title: "Verbal Module 1",
      instruction: "Complete Verbal Module 1",
      durationMin: 32,
      order: 0,
      questions: [],
      passage: "",
    },
    {
      id: "sat-verbal-2",
      type: "LISTENING",
      title: "Verbal Module 2",
      instruction: "Complete Verbal Module 2",
      durationMin: 32,
      order: 1,
      questions: [],
      passage: "",
    },
    {
      id: "sat-math-1",
      type: "GRAMMAR",
      title: "Math Module 1",
      instruction: "Complete Math Module 1",
      durationMin: 35,
      order: 2,
      questions: [],
      passage: "",
    },
    {
      id: "sat-math-2",
      type: "VOCABULARY",
      title: "Math Module 2",
      instruction: "Complete Math Module 2",
      durationMin: 35,
      order: 3,
      questions: [],
      passage: "",
    },
  ];
}

export interface SatDigitalBuilderInitial {
  title: string;
  track: string;
  durationMin: number | null;
  sections: Section[];
}

interface SatDigitalBuilderProps {
  mode: "create" | "edit";
  examId?: string;
  initial?: SatDigitalBuilderInitial;
}

export default function SatDigitalBuilder({ mode, examId, initial }: SatDigitalBuilderProps) {
  const router = useRouter();

  const [examTitle, setExamTitle] = useState(initial?.title ?? "SAT Digital — New Exam");
  const [track, setTrack] = useState(initial?.track ?? "");
  const [durationMin, setDurationMin] = useState<number | null>(initial?.durationMin ?? null);

  const [sections, setSections] = useState<Section[]>(
    () => initial?.sections ?? createSatDigitalSections()
  );
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);

  const [showQuestionTypeModal, setShowQuestionTypeModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: "success" | "error" | "warning" | "info";
  }>({ isOpen: false, title: "", message: "", type: "info" });

  const currentSection = useMemo(
    () => sections[activeModuleIndex] || null,
    [activeModuleIndex, sections]
  );

  const updateSection = (sectionId: string, updater: (s: Section) => Section) => {
    setSections((prev) => prev.map((s) => (s.id === sectionId ? updater(s) : s)));
  };

  const handleAddQuestion = (qtype: QuestionType) => {
    if (!currentSection) return;
    const result = createQuestionDraft({
      questionType: qtype,
      examCategory: SAT_CATEGORY,
      sectionType: currentSection.type,
      currentSection,
    });
    if (!result.valid) {
      setAlert({
        isOpen: true,
        title: "Invalid Question Type",
        message: result.error || "This question type is not allowed",
        type: "error",
      });
      return;
    }
    setEditingQuestion(result.question);
    setShowQuestionTypeModal(false);
  };

  const handleSaveQuestion = () => {
    if (!currentSection || !editingQuestion) return;

    updateSection(currentSection.id, (s) => {
      const exists = s.questions.some((q) => q.id === editingQuestion.id);
      const nextQuestions = exists
        ? s.questions.map((q) => (q.id === editingQuestion.id ? editingQuestion : q))
        : [...s.questions, editingQuestion];

      const ordered = [...nextQuestions].sort((a, b) => a.order - b.order).map((q, idx) => ({
        ...q,
        order: idx,
      }));

      return { ...s, questions: ordered };
    });

    setEditingQuestion(null);
  };

  const confirmDeleteQuestion = () => {
    if (!currentSection || !deleteQuestionId) return;

    updateSection(currentSection.id, (s) => ({
      ...s,
      questions: (s.questions || []).filter((q) => q.id !== deleteQuestionId).map((q, idx) => ({
        ...q,
        order: idx,
      })),
    }));
    setDeleteQuestionId(null);
  };

  const saveExam = async () => {
    const validation = validateExamInfo(SAT_CATEGORY, examTitle, sections);
    if (!validation.valid) {
      setAlert({
        isOpen: true,
        title: validation.error!.title,
        message: validation.error!.message,
        type: "error",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = buildExamPayload(examTitle, SAT_CATEGORY, track, durationMin, sections);
      const isEdit = mode === "edit" && examId;
      const res = await fetch(
        isEdit ? `/api/admin/exams/${examId}` : "/api/admin/exams",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to save exam");

      setAlert({
        isOpen: true,
        title: isEdit ? "Exam updated" : "Exam created",
        message: isEdit
          ? "SAT Digital exam updated successfully."
          : "SAT Digital exam created successfully.",
        type: "success",
      });
      const savedId = json.exam?.id || json.examId || examId || "";
      router.push(`/dashboard/admin/exams/${savedId}`);
    } catch (e) {
      setAlert({
        isOpen: true,
        title: "Save failed",
        message: e instanceof Error ? e.message : "Failed to save exam",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const isEdit = mode === "edit";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-10 flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-xl sm:text-2xl font-medium text-gray-900">
            {isEdit ? "Edit SAT Digital Exam" : "Create SAT Digital Exam"}
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Verbal 1 → Verbal 2 → Math 1 → Math 2 (modules auto-created)
          </p>
        </div>
        <button
          type="button"
          onClick={saveExam}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-md disabled:opacity-70"
          style={{ backgroundColor: "#303380" }}
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Save Exam"}
        </button>
      </div>

      <ExamInfoForm
        examTitle={examTitle}
        onExamTitleChange={setExamTitle}
        selectedCategory={SAT_CATEGORY}
        track={track}
        onTrackChange={setTrack}
        durationMin={durationMin}
        onDurationMinChange={setDurationMin}
      />

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-3 pt-3">
          <div className="flex items-end gap-2">
            {sections.map((section, idx) => {
              const isActive = idx === activeModuleIndex;
              const label = MODULE_LABELS[idx] ?? section.title;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveModuleIndex(idx)}
                  className={[
                    "px-4 py-2 text-sm font-semibold rounded-t-md border transition-colors",
                    isActive
                      ? "bg-white border-gray-200 border-b-white text-gray-900 relative -mb-px"
                      : "bg-gray-50 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {!currentSection ? (
            <p className="text-sm text-gray-600">No module selected.</p>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{currentSection.title}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Duration: {currentSection.durationMin} min · Questions: {currentSection.questions.length}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuestionTypeModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-md"
                  style={{ backgroundColor: "#303380" }}
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </button>
              </div>

              <QuestionsList
                questions={currentSection.questions}
                examCategory={SAT_CATEGORY}
                sectionType={currentSection.type}
                onEdit={(q) => setEditingQuestion({ ...q })}
                onDelete={setDeleteQuestionId}
              />
            </>
          )}
        </div>
      </div>

      <QuestionTypeModal
        isOpen={showQuestionTypeModal}
        onClose={() => setShowQuestionTypeModal(false)}
        onSelect={handleAddQuestion}
        allowedGroups={{
          "SAT Question Types": ["MCQ_SINGLE", "SHORT_TEXT"],
        }}
      />

      {editingQuestion && currentSection && (
        <QuestionEditModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSave={handleSaveQuestion}
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
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Upload failed");

              setEditingQuestion((prev) =>
                prev
                  ? {
                      ...prev,
                      image: data.publicPath || data.path,
                    }
                  : prev
              );
            } catch (e) {
              setAlert({
                isOpen: true,
                title: "Failed to Upload Image",
                message: e instanceof Error ? e.message : "Failed to upload image",
                type: "error",
              });
            } finally {
              setUploadingImage(false);
            }
          }}
          showAlert={(title, message, type) =>
            setAlert({ isOpen: true, title, message, type })
          }
        />
      )}

      <DeleteQuestionModal
        isOpen={!!deleteQuestionId}
        onClose={() => setDeleteQuestionId(null)}
        onConfirm={confirmDeleteQuestion}
      />

      <AlertModal
        isOpen={alert.isOpen}
        onClose={() => setAlert((a) => ({ ...a, isOpen: false }))}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </div>
  );
}
