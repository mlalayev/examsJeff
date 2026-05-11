"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save, Upload } from "lucide-react";
import ExamInfoForm from "@/components/admin/exams/create/ExamInfoForm";
import QuestionTypeModal from "@/components/admin/exams/create/QuestionTypeModal";
import QuestionsList from "@/components/admin/exams/create/QuestionsList";
import { QuestionEditModal } from "@/components/admin/exams/create/questionModal/QuestionEditModal";
import { DeleteQuestionModal } from "@/components/modals/DeleteQuestionModal";
import { AlertModal } from "@/components/modals/AlertModal";
import type {
  ExamCategory,
  Question,
  QuestionType,
  Section,
  SectionType,
} from "@/components/admin/exams/create/types";
import { createIELTSSections } from "@/components/admin/exams/create/ieltsInitializer";
import { createQuestionDraft } from "@/components/admin/exams/create/addQuestionFlow";
import { validateExamInfo } from "@/components/admin/exams/create/examValidation";
import { buildExamPayload } from "@/components/admin/exams/create/examSerializer";
import { getGroupedQuestionTypes } from "@/components/admin/exams/create/questionTypeRules";
import { filterQuestionsByPart } from "@/components/admin/exams/create/ieltsHelpers";

const IELTS_CATEGORY: ExamCategory = "IELTS";

type MainTab = "LISTENING" | "READING" | "WRITING" | "SPEAKING";

const MAIN_TABS: Array<{ type: MainTab; label: string }> = [
  { type: "LISTENING", label: "Listening" },
  { type: "READING", label: "Reading" },
  { type: "WRITING", label: "Writing" },
  { type: "SPEAKING", label: "Speaking" },
];

function partLabels(sectionType: SectionType): Array<{ part: number; label: string }> {
  if (sectionType === "LISTENING") {
    return [1, 2, 3, 4].map((part) => ({ part, label: `Part ${part}` }));
  }
  if (sectionType === "READING") {
    return [1, 2, 3].map((part) => ({ part, label: `Passage ${part}` }));
  }
  if (sectionType === "WRITING") {
    return [1, 2].map((part) => ({ part, label: `Task ${part}` }));
  }
  if (sectionType === "SPEAKING") {
    return [1, 2, 3].map((part) => ({ part, label: `Part ${part}` }));
  }
  return [{ part: 1, label: "Part 1" }];
}

function prepareIELTSSections(): Section[] {
  return createIELTSSections().map((section) => {
    if (section.type === "READING") {
      return {
        ...section,
        passage: {
          part1: "",
          part2: "",
          part3: "",
        } as any,
      };
    }
    return section;
  });
}

export default function CreateIELTSDigitalExamPage() {
  const router = useRouter();

  const [examTitle, setExamTitle] = useState("IELTS — New Exam");
  const [track, setTrack] = useState("");
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [sections, setSections] = useState<Section[]>(() => prepareIELTSSections());
  const [activeTab, setActiveTab] = useState<MainTab>("LISTENING");
  const [parts, setParts] = useState<Record<MainTab, number>>({
    LISTENING: 1,
    READING: 1,
    WRITING: 1,
    SPEAKING: 1,
  });

  const [showQuestionTypeModal, setShowQuestionTypeModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: "success" | "error" | "warning" | "info";
  }>({ isOpen: false, title: "", message: "", type: "info" });

  const currentSection = useMemo(
    () => sections.find((s) => s.type === activeTab) || null,
    [activeTab, sections]
  );

  const currentPart = parts[activeTab];
  const currentPartQuestions = currentSection
    ? filterQuestionsByPart(currentSection.questions, currentSection.type, currentPart)
    : [];

  const updateSection = (sectionType: SectionType, updater: (s: Section) => Section) => {
    setSections((prev) => prev.map((s) => (s.type === sectionType ? updater(s) : s)));
  };

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" | "warning" | "info" = "info"
  ) => {
    setAlert({ isOpen: true, title, message, type });
  };

  const handleAddQuestion = (qtype: QuestionType) => {
    if (!currentSection) return;

    if (
      (currentSection.type === "LISTENING" || currentSection.type === "READING") &&
      qtype === "HTML_CSS" &&
      filterQuestionsByPart(currentSection.questions, currentSection.type, currentPart).some(
        (q) => q.qtype === "HTML_CSS"
      )
    ) {
      showAlert(
        "Question already exists",
        `${partLabels(currentSection.type).find((p) => p.part === currentPart)?.label} already has its HTML/CSS question. Edit the existing question instead of adding another one.`,
        "warning"
      );
      setShowQuestionTypeModal(false);
      return;
    }

    const result = createQuestionDraft({
      questionType: qtype,
      examCategory: IELTS_CATEGORY,
      sectionType: currentSection.type,
      currentSection,
      ieltsContext: {
        getCurrentPart: () => currentPart,
      },
    });

    if (!result.valid) {
      showAlert("Invalid Question Type", result.error || "This question type is not allowed", "error");
      return;
    }

    setEditingQuestion(result.question);
    setShowQuestionTypeModal(false);
  };

  const handleSaveQuestion = () => {
    if (!currentSection || !editingQuestion) return;

    updateSection(currentSection.type, (section) => {
      const exists = section.questions.some((q) => q.id === editingQuestion.id);
      const nextQuestions = exists
        ? section.questions.map((q) => (q.id === editingQuestion.id ? editingQuestion : q))
        : [...section.questions, editingQuestion];

      return {
        ...section,
        questions: nextQuestions.map((q, idx) => ({ ...q, order: idx })),
      };
    });

    setEditingQuestion(null);
  };

  const confirmDeleteQuestion = () => {
    if (!currentSection || !deleteQuestionId) return;
    updateSection(currentSection.type, (section) => ({
      ...section,
      questions: section.questions
        .filter((q) => q.id !== deleteQuestionId)
        .map((q, idx) => ({ ...q, order: idx })),
    }));
    setDeleteQuestionId(null);
  };

  const uploadAudio = async (file: File) => {
    if (!currentSection || currentSection.type !== "LISTENING") return;
    setUploadingAudio(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "audio");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audio upload failed");
      updateSection("LISTENING", (section) => ({
        ...section,
        audio: data.publicPath || data.path,
      }));
    } catch (e) {
      showAlert("Audio upload failed", e instanceof Error ? e.message : "Audio upload failed", "error");
    } finally {
      setUploadingAudio(false);
    }
  };

  const updateReadingPassage = (part: number, value: string) => {
    updateSection("READING", (section) => {
      const current = typeof section.passage === "object" && section.passage ? (section.passage as any) : {};
      return {
        ...section,
        passage: {
          ...current,
          [`part${part}`]: value,
        } as any,
      };
    });
  };

  const saveExam = async () => {
    const validation = validateExamInfo(IELTS_CATEGORY, examTitle, sections);
    if (!validation.valid) {
      showAlert(validation.error!.title, validation.error!.message, "error");
      return;
    }

    setSaving(true);
    try {
      const payload = buildExamPayload(examTitle, IELTS_CATEGORY, track, durationMin, sections);
      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to create IELTS exam");
      router.push(`/dashboard/admin/exams/${json.exam?.id || json.examId || ""}`);
    } catch (e) {
      showAlert("Save failed", e instanceof Error ? e.message : "Failed to create IELTS exam", "error");
    } finally {
      setSaving(false);
    }
  };

  const readingPassage =
    currentSection?.type === "READING" && typeof currentSection.passage === "object"
      ? ((currentSection.passage as any)[`part${currentPart}`] as string) || ""
      : "";

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
          <h1 className="text-xl sm:text-2xl font-medium text-gray-900">Create IELTS Exam</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Listening, Reading, Writing, and Speaking are auto-created with their parts.
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
        selectedCategory={IELTS_CATEGORY}
        track={track}
        onTrackChange={setTrack}
        durationMin={durationMin}
        onDurationMinChange={setDurationMin}
      />

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-3 pt-3">
          <div className="flex items-end gap-2">
            {MAIN_TABS.map((tab) => {
              const isActive = tab.type === activeTab;
              return (
                <button
                  key={tab.type}
                  type="button"
                  onClick={() => setActiveTab(tab.type)}
                  className={[
                    "px-4 py-2 text-sm font-semibold rounded-t-md border transition-colors",
                    isActive
                      ? "bg-white border-gray-200 border-b-white text-gray-900 relative -mb-px"
                      : "bg-gray-50 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {currentSection && (
          <div className="border-b border-gray-200 bg-white px-4 pt-3">
            <div className="flex flex-wrap items-end gap-2">
              {partLabels(currentSection.type).map((part) => {
                const isActive = currentPart === part.part;
                return (
                  <button
                    key={part.part}
                    type="button"
                    onClick={() =>
                      setParts((prev) => ({ ...prev, [activeTab]: part.part }))
                    }
                    className={[
                      "px-3 py-2 text-sm font-medium rounded-t-md border transition-colors",
                      isActive
                        ? "bg-slate-900 border-slate-900 text-white relative -mb-px"
                        : "bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {part.label}
                  </button>
                );
              })}

              {currentSection.type === "LISTENING" && (
                <label className="ml-auto inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 cursor-pointer mb-2">
                  <Upload className="w-4 h-4" />
                  {uploadingAudio ? "Uploading..." : currentSection.audio ? "Change audio" : "Upload audio"}
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    disabled={uploadingAudio}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadAudio(file);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6">
          {!currentSection ? (
            <p className="text-sm text-gray-600">No IELTS section selected.</p>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{currentSection.title}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {partLabels(currentSection.type).find((p) => p.part === currentPart)?.label} · Questions:{" "}
                    {currentPartQuestions.length}
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

              {currentSection.type === "LISTENING" && (
                <div className="mb-5 rounded-md border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-900">Listening Audio</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {currentSection.audio
                      ? currentSection.audio
                      : "No audio uploaded yet. Use the Upload audio button above."}
                  </p>
                </div>
              )}

              {currentSection.type === "READING" && (
                <div className="mb-5 rounded-md border border-green-200 bg-green-50 p-4">
                  <label className="block text-sm font-medium text-green-900 mb-2">
                    Passage {currentPart}
                  </label>
                  <textarea
                    value={readingPassage}
                    onChange={(e) => updateReadingPassage(currentPart, e.target.value)}
                    rows={8}
                    placeholder={`Enter reading passage ${currentPart}`}
                    className="w-full px-3 py-2 border border-green-200 rounded-md text-sm focus:outline-none focus:border-green-400 bg-white"
                  />
                </div>
              )}

              <QuestionsList
                questions={currentSection.questions}
                examCategory={IELTS_CATEGORY}
                sectionType={currentSection.type}
                currentPart={currentPart}
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
        allowedGroups={
          currentSection
            ? getGroupedQuestionTypes({
                examCategory: IELTS_CATEGORY,
                sectionType: currentSection.type,
                ieltsContext: { part: currentPart },
              })
            : undefined
        }
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
                prev ? { ...prev, image: data.publicPath || data.path } : prev
              );
            } catch (e) {
              showAlert("Failed to Upload Image", e instanceof Error ? e.message : "Failed to upload image", "error");
            } finally {
              setUploadingImage(false);
            }
          }}
          showAlert={(title, message, type) => showAlert(title, message, type)}
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

