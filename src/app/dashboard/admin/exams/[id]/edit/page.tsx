"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, X, BookOpen, Save, Edit, Info, Image, Volume2 } from "lucide-react";
import TextFormattingPreview from "@/components/TextFormattingPreview";
import QuestionPreview from "@/components/QuestionPreview";
import ImageUpload from "@/components/ImageUpload";
type ExamCategory = "TOEFL" | "SAT" | "GENERAL_ENGLISH" | "MATH" | "KIDS";
type SectionType = "READING" | "LISTENING" | "WRITING" | "SPEAKING" | "GRAMMAR" | "VOCABULARY";
type QuestionType = 
  | "MCQ_SINGLE" 
  | "MCQ_MULTI" 
  | "TF"
  | "TF_NG"
  | "ORDER_SENTENCE" 
  | "DND_GAP" 
  | "SHORT_TEXT" 
  | "ESSAY"
  | "INLINE_SELECT"
  | "FILL_IN_BLANK";

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
  image?: string; // Section image (for IELTS Listening parts)
  introduction?: string; // Section introduction (for IELTS Listening parts)
  subsections?: Section[]; // IELTS Listening subsections (Part 1-4)
  isSubsection?: boolean; // Bu subsection-dır?
  parentId?: string; // Parent section ID (for subsections)
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
  TF_NG: "True / False / Not Given",
  INLINE_SELECT: "Inline Select",
  ORDER_SENTENCE: "Order Sentence (Drag & Drop)",
  DND_GAP: "Drag and Drop Gap Fill",
  SHORT_TEXT: "Short Text Answer",
  ESSAY: "Essay",
};

const QUESTION_TYPE_GROUPS = {
  "Variantlı sual": ["MCQ_SINGLE", "MCQ_MULTI", "TF", "TF_NG", "INLINE_SELECT"],
  "Açıq sual": ["SHORT_TEXT", "ESSAY"],
  "Drag and Drop": ["ORDER_SENTENCE", "DND_GAP"],
};

const ALLOWED_SECTIONS_BY_CATEGORY: Record<ExamCategory, SectionType[]> = {
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

// SAT üçün xüsusi label-lər:
// - READING -> Verbal
// - WRITING -> Math
const getSectionLabel = (
  type: SectionType,
  selectedCategory: ExamCategory | null
): string => {
  if (selectedCategory === "SAT") {
    if (type === "READING") return "Verbal";
    if (type === "WRITING") return "Math";
  }
  return SECTION_TYPE_LABELS[type];
};

// SAT üçün avtomatik section adı yaratmaq
const getSATSectionTitle = (
  type: SectionType,
  existingSections: Section[]
): string => {
  if (type === "WRITING") {
    // Math sections
    const mathSections = existingSections.filter(s => s.type === "WRITING");
    const moduleNumber = mathSections.length + 1;
    return `Math Module ${moduleNumber}`;
  } else if (type === "READING") {
    // Verbal sections
    const verbalSections = existingSections.filter(s => s.type === "READING");
    const moduleNumber = verbalSections.length + 1;
    return `Verbal Module ${moduleNumber}`;
  }
  return `${getSectionLabel(type, "SAT")} Section`;
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
  const [readingType, setReadingType] = useState<"ACADEMIC" | "GENERAL">("ACADEMIC"); // IELTS Reading type
  const [writingType, setWritingType] = useState<"ACADEMIC" | "GENERAL">("ACADEMIC"); // IELTS Writing type
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
        setReadingType(exam.readingType || "ACADEMIC");
        setWritingType(exam.writingType || "ACADEMIC");
        
        // Parse sections and questions
        // Group IELTS Listening sections into subsections
        const parsedSections: Section[] = [];
        const listeningParts: any[] = [];
        
        exam.sections.forEach((s: any) => {
          let instructionData: any = { text: "" };
          if (s.instruction) {
            try {
              instructionData = typeof s.instruction === "string" ? JSON.parse(s.instruction) : s.instruction;
            } catch {
              instructionData = { text: s.instruction || "" };
            }
          }
          
          // SAT üçün avtomatik duration təyin et
          let durationMin = s.durationMin;
          if (exam.category === "SAT") {
            if (s.type === "WRITING") {
              // Math sections: 35 dəqiqə
              durationMin = 35;
            } else if (s.type === "READING") {
              // Verbal sections: 32 dəqiqə
              durationMin = 32;
            }
          }
          
          const section = {
            id: s.id,
            type: s.type,
            title: s.title,
            instruction: instructionData.text || "",
            durationMin: durationMin,
            order: s.order,
            passage: instructionData.passage || "",
            audio: instructionData.audio || "",
            image: s.image || instructionData.image || null,
            introduction: instructionData.introduction || null,
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

          // IELTS Listening: Group parts into subsections
          if (exam.category === "IELTS" && s.type === "LISTENING" && s.title.includes("Part")) {
            listeningParts.push(section);
          } else {
            parsedSections.push(section);
          }
        });

        // Create main Listening section with subsections if we have listening parts
        if (listeningParts.length > 0) {
          const mainListening: Section = {
            id: `listening-${Date.now()}`,
            type: "LISTENING",
            title: "Listening",
            instruction: "IELTS Listening Test",
            durationMin: 30,
            order: IELTS_SECTION_ORDER.LISTENING,
            questions: [],
            audio: listeningParts[0]?.audio,
            subsections: listeningParts.map(part => ({
              ...part,
              isSubsection: true,
              parentId: `listening-${Date.now()}`,
            })),
          };
          parsedSections.push(mainListening);
        }
        
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
    
    const currentSections = sections || []; // Guard against undefined

    // SAT üçün maksimum limit yoxlaması
    if (selectedCategory === "SAT") {
      if (type === "WRITING") {
        // Math sections - maksimum 2
        const mathCount = currentSections.filter(s => s.type === "WRITING").length;
        if (mathCount >= 2) {
          alert("SAT imtahanında maksimum 2 Math section ola bilər");
          return;
        }
      } else if (type === "READING") {
        // Verbal sections - maksimum 2
        const verbalCount = currentSections.filter(s => s.type === "READING").length;
        if (verbalCount >= 2) {
          alert("SAT imtahanında maksimum 2 Verbal section ola bilər");
          return;
        }
      }
    }

    // IELTS validation: LISTENING can only be added once
    if (selectedCategory === "IELTS" && type === "LISTENING") {
      const validation = validateIELTSListeningUniqueness(currentSections, type);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
    }

    // IELTS validation: READING can only be added once
    if (selectedCategory === "IELTS" && type === "READING") {
      const hasReading = currentSections.some(s => s.type === "READING");
      if (hasReading) {
        alert("READING section can only be added once per IELTS exam");
        return;
      }
    }

    // IELTS validation: WRITING can only be added once
    if (selectedCategory === "IELTS" && type === "WRITING") {
      const hasWriting = currentSections.some(s => s.type === "WRITING");
      if (hasWriting) {
        alert("WRITING section can only be added once per IELTS exam");
        return;
      }
    }
    
    // SAT üçün avtomatik adlandırma
    let sectionTitle: string;
    if (selectedCategory === "SAT") {
      sectionTitle = getSATSectionTitle(type, currentSections);
    } else {
      const label = getSectionLabel(type, selectedCategory);
      sectionTitle = `${label} Section`;
    }

    // Auto-set duration for IELTS and SAT
    let defaultDuration = 15;
    if (selectedCategory === "SAT") {
      defaultDuration = type === "WRITING" ? 35 : 32;
    } else if (selectedCategory === "IELTS") {
      defaultDuration = getIELTSSectionDuration(type as any) || 15;
    }
    
    const newSection: Section = {
      id: `section-${Date.now()}`,
      type,
      title: sectionTitle,
      instruction: "",
      durationMin: defaultDuration,
      order: selectedCategory === "IELTS" 
        ? IELTS_SECTION_ORDER[type as keyof typeof IELTS_SECTION_ORDER]
        : currentSections.length,
      questions: [],
    };

    // IELTS Listening: 1 əsas section + 4 subsection yarat
    if (selectedCategory === "IELTS" && type === "LISTENING") {
      const parts = [
        { title: "Part 1", instruction: "Conversation between two people in everyday social context" },
        { title: "Part 2", instruction: "Monologue in everyday social context" },
        { title: "Part 3", instruction: "Conversation (up to 4 people) in educational/training context" },
        { title: "Part 4", instruction: "Academic monologue" },
      ];

      const subsections: Section[] = parts.map((part, index) => ({
        id: `subsection-${Date.now()}-${index}`,
        type: "LISTENING",
        title: part.title,
        instruction: part.instruction,
        durationMin: 0,
        order: index,
        questions: [],
        image: undefined,
        introduction: undefined,
        isSubsection: true,
        parentId: newSection.id,
      }));

      newSection.subsections = subsections;
      setSections([...currentSections, newSection]);
      setCurrentSection(subsections[0]); // Start with Part 1
      setStep("questions");
    } 
    // IELTS Reading: 1 əsas section + 3 passage subsection yarat
    else if (selectedCategory === "IELTS" && type === "READING") {
      const passages = [
        { title: "Passage 1", instruction: "Questions 1-13 (Easier text)" },
        { title: "Passage 2", instruction: "Questions 14-26 (Medium difficulty)" },
        { title: "Passage 3", instruction: "Questions 27-40 (Harder academic text)" },
      ];

      const subsections: Section[] = passages.map((passage, index) => ({
        id: `subsection-${Date.now()}-${index}`,
        type: "READING",
        title: passage.title,
        instruction: passage.instruction,
        durationMin: 0,
        order: index,
        questions: [],
        passage: "", // Empty passage text, admin will fill
        isSubsection: true,
        parentId: newSection.id,
      }));

      newSection.subsections = subsections;
      setSections([...currentSections, newSection]);
      setCurrentSection(subsections[0]); // Start with Passage 1
      setStep("questions");
    }
    // IELTS Writing: 1 əsas section + 2 task subsection yarat
    else if (selectedCategory === "IELTS" && type === "WRITING") {
      const tasks = [
        { 
          title: "Task 1", 
          instruction: writingType === "ACADEMIC" 
            ? "Describe the information shown in the graph/chart/diagram. Write at least 150 words." 
            : "Write a letter based on the situation given. Write at least 150 words."
        },
        { 
          title: "Task 2", 
          instruction: "Write an essay in response to the question. Give reasons and examples. Write at least 250 words."
        },
      ];

      const subsections: Section[] = tasks.map((task, index) => ({
        id: `subsection-${Date.now()}-${index}`,
        type: "WRITING",
        title: task.title,
        instruction: task.instruction,
        durationMin: 0,
        order: index,
        questions: [],
        isSubsection: true,
        parentId: newSection.id,
      }));

      newSection.subsections = subsections;
      setSections([...currentSections, newSection]);
      setCurrentSection(subsections[0]); // Start with Task 1
      setStep("questions");
    }
    else {
      setSections([...currentSections, newSection]);
      setCurrentSection(newSection);
      setStep("questions");
    }
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
    if (!currentSection || !editingQuestion) {
      console.error("Cannot save question: currentSection or editingQuestion is null");
      return;
    }

    console.log("Saving question:", editingQuestion);
    console.log("Current section:", currentSection);
    console.log("Sections before update:", sections);

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

    console.log("Question to save:", questionToSave);

    const updatedSections = sections.map((s) => {
      // If current section is a subsection, update inside parent
      if (currentSection.isSubsection && s.subsections) {
        return {
          ...s,
          subsections: s.subsections.map(sub =>
            sub.id === currentSection.id
              ? {
                  ...sub,
                  questions: sub.questions.find((q) => q.id === editingQuestion.id)
                    ? sub.questions.map((q) => (q.id === editingQuestion.id ? questionToSave : q))
                    : [...sub.questions, questionToSave],
                }
              : sub
          ),
        };
      }
      // Regular section
      return s.id === currentSection.id
        ? {
            ...s,
            questions: s.questions.find((q) => q.id === editingQuestion.id)
              ? s.questions.map((q) => (q.id === editingQuestion.id ? questionToSave : q))
              : [...s.questions, questionToSave],
          }
        : s;
    });
    
    console.log("Sections after update:", updatedSections);
    
    setSections(updatedSections);
    
    // Update currentSection
    const findCurrentSection = (sections: Section[]): Section | null => {
      for (const s of sections) {
        if (s.id === currentSection.id) return s;
        if (s.subsections) {
          const found = s.subsections.find(sub => sub.id === currentSection.id);
          if (found) return found;
        }
      }
      return null;
    };
    const updatedCurrentSection = findCurrentSection(updatedSections);
    console.log("Updated current section:", updatedCurrentSection);
    setCurrentSection(updatedCurrentSection);
    setEditingQuestion(null);
    console.log("✅ Question saved successfully!");
  };

  const deleteQuestion = (questionId: string) => {
    if (!currentSection) return;
    
    const updatedSections = sections.map((s) => {
      // If current section is a subsection
      if (currentSection.isSubsection && s.subsections) {
        return {
          ...s,
          subsections: s.subsections.map(sub =>
            sub.id === currentSection.id
              ? { ...sub, questions: sub.questions.filter((q) => q.id !== questionId) }
              : sub
          ),
        };
      }
      // Regular section
      return s.id === currentSection.id
        ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) }
        : s;
    });
    
    setSections(updatedSections);
    
    // Update currentSection
    const findCurrentSection = (sections: Section[]): Section | null => {
      for (const s of sections) {
        if (s.id === currentSection.id) return s;
        if (s.subsections) {
          const found = s.subsections.find(sub => sub.id === currentSection.id);
          if (found) return found;
        }
      }
      return null;
    };
    setCurrentSection(findCurrentSection(updatedSections));
  };

  const getDefaultPrompt = (qtype: QuestionType): any => {
    switch (qtype) {
      case "TF":
        return { text: "Enter the statement here" };
      case "TF_NG":
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
      case "FILL_IN_BLANK":
        return { 
          text: "Complete the sentences below:\n---\n1. A wooden ___\n2. Includes a sheet of ___\n3. Price: £___",
          imageUrl: "" // Optional image URL
        };
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
      case "TF_NG":
        return { value: "TRUE" };
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
      case "FILL_IN_BLANK":
        return { 
          answers: ["train", "stickers", "17.50"], // Case-insensitive answers
          caseSensitive: false // Case-insensitive (böyük kiçik hərf fərqi yoxdur)
        };
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
      // Flatten subsections for API
      const flattenedSections = sections.flatMap(s => {
        if (s.subsections && s.subsections.length > 0) {
          // Return subsections only (parent section is just a container)
          return s.subsections.map((sub, idx) => ({
            ...sub,
            audio: s.audio, // Use parent's audio
            order: s.order + (idx * 0.01), // 0, 0.01, 0.02, 0.03
          }));
        }
        return [s];
      });

      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: examTitle,
          category: selectedCategory,
          track: track || null,
          readingType: selectedCategory === "IELTS" ? readingType : null,
          writingType: selectedCategory === "IELTS" ? writingType : null,
          sections: flattenedSections.map((s) => {
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
            
            // SAT üçün avtomatik duration təyin et
            let durationMin = s.durationMin;
            if (selectedCategory === "SAT") {
              if (s.type === "WRITING") {
                // Math sections: 35 dəqiqə
                durationMin = 35;
              } else if (s.type === "READING") {
                // Verbal sections: 32 dəqiqə
                durationMin = 32;
              }
            }
            
            return {
              id: s.id,
              type: s.type,
              title: s.title,
              instruction: JSON.stringify(instructionData),
              image: s.image || null, // Section image (for IELTS Listening parts)
              durationMin: durationMin,
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
          {selectedCategory === "IELTS" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reading Type
                </label>
                <select
                  value={readingType}
                  onChange={(e) => setReadingType(e.target.value as "ACADEMIC" | "GENERAL")}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                >
                  <option value="ACADEMIC">Academic</option>
                  <option value="GENERAL">General Training</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Writing Type
                </label>
                <select
                  value={writingType}
                  onChange={(e) => setWritingType(e.target.value as "ACADEMIC" | "GENERAL")}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                >
                  <option value="ACADEMIC">Academic</option>
                  <option value="GENERAL">General Training</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sections */}
      {selectedCategory && (
        <div className="bg-white border border-gray-200 rounded-md p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Sections</h2>
            <div className="flex items-center gap-2">
              {allowedSectionTypes.map((type) => {
                // SAT üçün maksimum limit yoxlaması
                const isDisabled = selectedCategory === "SAT" && (
                  (type === "WRITING" && sections.filter(s => s.type === "WRITING").length >= 2) ||
                  (type === "READING" && sections.filter(s => s.type === "READING").length >= 2)
                );
                
                const label = getSectionLabel(type, selectedCategory);
                
                return (
                  <button
                    key={type}
                    onClick={() => addSection(type)}
                    disabled={isDisabled}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" />
                    Add {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {sections.map((section, idx) => {
              const isActive = currentSection?.id === section.id;
              const hasSubsections = section.subsections && section.subsections.length > 0;
              
              return (
                <div key={section.id}>
                  {/* Main Section */}
                  <div
                    className={`border rounded-md p-3 ${
                      isActive
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
                          {getSectionLabel(section.type, selectedCategory)}
                        </span>
                        {!hasSubsections && (
                          <span className="text-xs text-gray-500">
                            {section.questions.length} questions
                          </span>
                        )}
                        {hasSubsections && (
                          <span className="text-xs text-blue-600 font-medium">
                            ({(section.subsections || []).length} parts)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!hasSubsections && (section.type === "READING" || section.type === "LISTENING") && (
                          <button
                            onClick={() => {
                              setEditingSection(section);
                              setShowSectionEditModal(true);
                            }}
                            className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        )}
                        {hasSubsections && section.type === "LISTENING" && (
                          <button
                            onClick={() => {
                              setEditingSection(section);
                              setShowSectionEditModal(true);
                            }}
                            className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                        )}
                        {!hasSubsections && (
                          <button
                            onClick={() => setCurrentSection(section)}
                            className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            Questions
                          </button>
                        )}
                        <button
                          onClick={() => deleteSection(section.id)}
                          className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Subsections */}
                  {hasSubsections && section.subsections && (
                    <div className="ml-6 mt-2 space-y-2">
                      {section.subsections.map((subsection, subIdx) => {
                        const isSubActive = currentSection?.id === subsection.id;
                        return (
                          <div
                            key={subsection.id}
                            className={`bg-slate-50 border-l-4 rounded-r-md p-3 ${
                              isSubActive
                                ? "border-l-[#303380] bg-[#303380]/5"
                                : "border-l-gray-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700">
                                  {subsection.title}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {subsection.questions.length} questions
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Edit Passage button for Reading subsections */}
                                {section.type === "READING" && (
                                  <button
                                    onClick={() => {
                                      setEditingSection(subsection);
                                      setShowSectionEditModal(true);
                                    }}
                                    className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 flex items-center gap-1"
                                    title="Edit passage text"
                                  >
                                    <BookOpen className="w-3 h-3" />
                                    Passage
                                  </button>
                                )}
                                
                                {/* Questions button */}
                                <button
                                  onClick={() => setCurrentSection(subsection)}
                                  className="px-2 py-1 text-xs font-medium text-white rounded"
                                  style={{ backgroundColor: "#303380" }}
                                >
                                  Questions
                                </button>
                                
                                {/* Image/Introduction button for Listening subsections */}
                                {section.type === "LISTENING" && (
                                  <button
                                    onClick={() => {
                                      setEditingSection(subsection);
                                      setShowSectionEditModal(true);
                                    }}
                                    className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100"
                                    title="Edit image and introduction"
                                  >
                                    <Image className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
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
            {currentSection.questions
              .sort((a, b) => a.order - b.order)
              .map((q, idx) => {
                const moveUp = () => {
                  if (idx === 0) return;
                  const updatedQuestions = [...currentSection.questions];
                  const temp = updatedQuestions[idx].order;
                  updatedQuestions[idx].order = updatedQuestions[idx - 1].order;
                  updatedQuestions[idx - 1].order = temp;
                  const updatedSection = { ...currentSection, questions: updatedQuestions };
                  setCurrentSection(updatedSection);
                  setSections(sections.map(s => s.id === currentSection.id ? updatedSection : s));
                };
                
                const moveDown = () => {
                  if (idx === currentSection.questions.length - 1) return;
                  const updatedQuestions = [...currentSection.questions];
                  const temp = updatedQuestions[idx].order;
                  updatedQuestions[idx].order = updatedQuestions[idx + 1].order;
                  updatedQuestions[idx + 1].order = temp;
                  const updatedSection = { ...currentSection, questions: updatedQuestions };
                  setCurrentSection(updatedSection);
                  setSections(sections.map(s => s.id === currentSection.id ? updatedSection : s));
                };

                return (
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
                          onClick={moveUp}
                          disabled={idx === 0}
                          className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={moveDown}
                          disabled={idx === currentSection.questions.length - 1}
                          className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          ↓
                        </button>
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
                );
              })}
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
                    {(types as QuestionType[]).map((type) => (
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

                    {/* Question Text */}
                    <textarea
                      value={editingQuestion.prompt?.text || ""}
                      onChange={(e) => {
                        const text = e.target.value;
                        // Count blanks - support both ___ and [input]
                        const blankCount = (text.match(/___|\[input\]/g) || []).length;
                        
                        // Initialize answers array
                        const currentAnswers = Array.isArray(editingQuestion.answerKey?.answers) 
                          ? editingQuestion.answerKey.answers 
                          : [];
                        const newAnswers = Array(blankCount).fill("").map((_, idx) => currentAnswers[idx] || "");
                        
                        setEditingQuestion({
                          ...editingQuestion,
                          prompt: { 
                            ...editingQuestion.prompt, 
                            text 
                          },
                          answerKey: {
                            ...editingQuestion.answerKey,
                            answers: newAnswers,
                            caseSensitive: false, // Case-insensitive
                          }
                        });
                      }}
                      placeholder="Complete the sentences below:&#10;---&#10;1. A wooden ___&#10;2. Includes a sheet of ___&#10;3. Price: £___"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white resize-y"
                      rows={8}
                    />
                    <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded border border-blue-200">
                      <strong>📝 IELTS Fill in the Blank:</strong>
                      <br />
                      • First line: Question title/instruction
                      <br />
                      • Use <strong>---</strong> to separate title from items
                      <br />
                      • Each line after --- is one item (e.g., 1. Text ___)
                      <br />
                      • Use <strong>___</strong> (3 underscores) or <strong>[input]</strong> for blank spaces
                      <br />
                      • Use <strong>**text**</strong> for bold formatting
                      <br />
                      • Answers are <strong>not case-sensitive</strong> (e.g., "train", "Train", "TRAIN" are all correct)
                      <br />
                      • You can add an image above for visual context
                    </div>
                    
                    {/* Answer inputs for each blank - multiple alternatives */}
                    {(editingQuestion.prompt?.text || "").match(/___|\[input\]/g) && (
                      <div className="pt-3 border-t border-gray-200">
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                          Correct Answers (case-insensitive, spaces ignored)
                        </label>
                        <div className="space-y-3">
                          {Array.from({ length: (editingQuestion.prompt?.text || "").match(/___|\[input\]/g)?.length || 0 }).map((_, idx) => {
                            // Get current alternatives for this blank
                            const currentAlternatives = Array.isArray(editingQuestion.answerKey?.answers?.[idx])
                              ? editingQuestion.answerKey.answers[idx]
                              : (typeof editingQuestion.answerKey?.answers?.[idx] === "string" 
                                  ? [editingQuestion.answerKey.answers[idx]] 
                                  : [""]);
                            
                            return (
                              <div key={idx} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-gray-700">Blank {idx + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const answers = [...(editingQuestion.answerKey?.answers || [])];
                                      const alternatives = Array.isArray(answers[idx]) ? [...answers[idx]] : (typeof answers[idx] === "string" ? [answers[idx]] : [""]);
                                      alternatives.push("");
                                      answers[idx] = alternatives;
                                      
                                      setEditingQuestion({
                                        ...editingQuestion,
                                        answerKey: { 
                                          ...editingQuestion.answerKey,
                                          answers,
                                        },
                                      });
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                  >
                                    + Add Alternative
                                  </button>
                                </div>
                                
                                <div className="space-y-2">
                                  {currentAlternatives.map((alt: string, altIdx: number) => (
                                    <div key={altIdx} className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={alt || ""}
                                        onChange={(e) => {
                                          const answers = [...(editingQuestion.answerKey?.answers || [])];
                                          const alternatives = Array.isArray(answers[idx]) ? [...answers[idx]] : (typeof answers[idx] === "string" ? [answers[idx]] : [""]);
                                          alternatives[altIdx] = e.target.value;
                                          answers[idx] = alternatives;
                                          
                                          setEditingQuestion({
                                            ...editingQuestion,
                                            answerKey: { 
                                              ...editingQuestion.answerKey,
                                              answers,
                                            },
                                          });
                                        }}
                                        placeholder={`Alternative ${altIdx + 1} (e.g., "90%", "ninety percent")`}
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
                                      />
                                      {currentAlternatives.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const answers = [...(editingQuestion.answerKey?.answers || [])];
                                            const alternatives = Array.isArray(answers[idx]) ? [...answers[idx]] : [answers[idx]];
                                            alternatives.splice(altIdx, 1);
                                            answers[idx] = alternatives.length === 1 ? alternatives : alternatives;
                                            
                                            setEditingQuestion({
                                              ...editingQuestion,
                                              answerKey: { 
                                                ...editingQuestion.answerKey,
                                                answers,
                                              },
                                            });
                                          }}
                                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                                        >
                                          Remove
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-xs text-blue-800">
                            <strong>ℹ️ Note:</strong> Answers are case-insensitive and spaces are ignored.<br/>
                            Examples: "90%", "90 %", "9 0 %" are all treated as the same answer.
                          </p>
                        </div>
                      </div>
                    )}
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

              {/* Options */}
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
                            <X className="w-3 h-3" />
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

            {/* Question Preview */}
            <QuestionPreview question={editingQuestion} />

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
                                const updatedSections = sections.map(s => {
                                  if (s.id === editingSection.id) {
                                    return {
                                      ...s,
                                      audio: data.path,
                                      subsections: s.subsections?.map(sub => ({ ...sub, audio: data.path })),
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
                className="px-3 sm:px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2"
                style={{ backgroundColor: "#303380" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#252a6b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#303380";
                }}
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
