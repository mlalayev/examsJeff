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

type ModuleKey = "VERBAL_1" | "VERBAL_2" | "MATH_1" | "MATH_2";

const SAT_CATEGORY: ExamCategory = "SAT";

function createSatDigitalSections(): Section[] {
  // NOTE: SectionType must be unique per module because attempt saving is keyed by AttemptSection.type.
  // For SAT Digital we map modules to distinct SectionType enums but keep the student-visible titles.
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

const MODULES: Array<{ key: ModuleKey; label: string; sectionId: string }> = [
  { key: "VERBAL_1", label: "Verbal 1", sectionId: "sat-verbal-1" },
  { key: "VERBAL_2", label: "Verbal 2", sectionId: "sat-verbal-2" },
  { key: "MATH_1", label: "Math 1", sectionId: "sat-math-1" },
  { key: "MATH_2", label: "Math 2", sectionId: "sat-math-2" },
];

export default function CreateSatDigitalExamPage() {
  const router = useRouter();

  const [examTitle, setExamTitle] = useState("SAT Digital — New Exam");
  const [track, setTrack] = useState("");
  const [durationMin, setDurationMin] = useState<number | null>(null);

  const [sections, setSections] = useState<Section[]>(() => createSatDigitalSections());
  const [activeModule, setActiveModule] = useState<ModuleKey>("VERBAL_1");

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

  const currentSection = useMemo(() => {
    const sectionId = MODULES.find((m) => m.key === activeModule)?.sectionId;
    return sections.find((s) => s.id === sectionId) || null;
  }, [activeModule, sections]);

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

      // Ensure stable ordering
      const ordered = [...nextQuestions].sort((a, b) => a.order - b.order).map((q, idx) => ({
        ...q,
        order: idx,
      }));

      return { ...s, questions: ordered };
    });

    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setDeleteQuestionId(questionId);
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
      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to create exam");

      setAlert({
        isOpen: true,
        title: "Exam created",
        message: "SAT Digital exam created successfully.",
        type: "success",
      });
      router.push(`/dashboard/admin/exams/${json.exam?.id || json.examId || ""}`);
    } catch (e) {
      setAlert({
        isOpen: true,
        title: "Save failed",
        message: e instanceof Error ? e.message : "Failed to create exam",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

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
          <h1 className="text-xl sm:text-2xl font-medium text-gray-900">Create SAT Digital Exam</h1>
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
          {saving ? "Saving..." : "Save Exam"}
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

      {/* Module strip (matches your ASCII layout: active module is \"pulled out\") */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-3 pt-3">
          <div className="flex items-end gap-2">
            {MODULES.map((m) => {
              const isActive = m.key === activeModule;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setActiveModule(m.key)}
                  className={[
                    "px-4 py-2 text-sm font-semibold rounded-t-md border transition-colors",
                    isActive
                      ? "bg-white border-gray-200 border-b-white text-gray-900 relative -mb-px"
                      : "bg-gray-50 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                  ].join(" ")}
                >
                  {m.label}
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
                onDelete={handleDeleteQuestion}
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

              // For SAT we store question.image (runner maps it to prompt.imageUrl)
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

