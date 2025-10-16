import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import fs from "fs/promises";
import path from "path";

// GET /api/exams/json/[examId] - Load full exam with questions from JSON
export async function GET(
  request: Request,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    await requireAuth();
    
    const { examId } = await params;
    const examsDir = path.join(process.cwd(), "src", "data", "exams");
    
    // Scan to find the exam
    const categories = await fs.readdir(examsDir, { withFileTypes: true });
    
    for (const category of categories) {
      if (!category.isDirectory()) continue;
      
      const categoryPath = path.join(examsDir, category.name);
      const tracks = await fs.readdir(categoryPath, { withFileTypes: true });
      
      for (const track of tracks) {
        if (!track.isDirectory()) continue;
        
        const trackPath = path.join(categoryPath, track.name);
        const units = await fs.readdir(trackPath, { withFileTypes: true });
        
        for (const unit of units) {
          if (!unit.isDirectory()) continue;
          
          const examPath = path.join(trackPath, unit.name, "exam.json");
          
          try {
            const examData = await fs.readFile(examPath, "utf-8");
            const exam = JSON.parse(examData);
            
            if (exam.id === examId) {
              // Transform parts → sections with questions
              const sections = transformPartsToSections(exam);
              
              return NextResponse.json({
                id: exam.id,
                title: exam.title,
                category: exam.category || "GENERAL_ENGLISH",
                track: exam.track,
                sections,
              });
            }
          } catch (err) {
            // Skip
          }
        }
      }
    }
    
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  } catch (error) {
    console.error("JSON exam load error:", error);
    return NextResponse.json({ error: "Failed to load exam" }, { status: 500 });
  }
}

function transformPartsToSections(exam: any) {
  const sectionMap: Record<string, any> = {
    GRAMMAR: { id: "grammar", type: "GRAMMAR", title: "Grammar", durationMin: 35, order: 0, questions: [] },
    VOCABULARY: { id: "vocabulary", type: "VOCABULARY", title: "Vocabulary", durationMin: 20, order: 1, questions: [] },
    WRITING: { id: "writing", type: "WRITING", title: "Writing", durationMin: 20, order: 2, questions: [] },
    READING: { id: "reading", type: "READING", title: "Reading", durationMin: 25, order: 3, questions: [] },
    LISTENING: { id: "listening", type: "LISTENING", title: "Listening", durationMin: 25, order: 4, questions: [] },
  };
  
  let questionOrder = 1;
  
  for (const part of exam.parts || []) {
    const partId = part.id;
    let sectionType = "GRAMMAR";
    
    if (partId === "part11") sectionType = "READING";
    else if (partId === "part12") sectionType = "LISTENING";
    else if (["part8","part9","part10"].includes(partId)) sectionType = "VOCABULARY";
    else if (["part3","part7"].includes(partId)) sectionType = "WRITING";
    
    const section = sectionMap[sectionType];
    
    // Handle subparts (reading/listening)
    if (part.subparts) {
      for (const sub of part.subparts) {
        if (sub.items) {
          for (const item of sub.items) {
            section.questions.push(transformItem(item, sub.type, questionOrder++, part.text));
          }
        }
      }
    }
    // Handle direct items
    else if (part.items) {
      // Special handling for banked gap parts
      if (["part1", "part5", "part6", "part9"].includes(partId)) {
        // Create one DND_GAP question with all sentences
        const sentences = part.items.map((it: any) => String(it.prompt).replace(/_{2,}/g, "___"));
        const bankSet = new Set<string>();
        part.items.forEach((it: any) => {
          const answers = Array.isArray(it.answer) ? it.answer : [it.answer];
          answers.forEach((a: string) => a && bankSet.add(a));
        });
        
        section.questions.push({
          id: `q-${partId}`,
          qtype: "DND_GAP",
          prompt: { text: part.title, textWithBlanks: sentences.join("\n") },
          options: { bank: Array.from(bankSet) },
          maxScore: part.points || 1,
          order: questionOrder++,
        });
      } else if (partId === "part10" && part.wordBank) {
        // Word bank gap
        const sentences = part.items.map((it: any) => String(it.prompt).replace(/_{2,}/g, "___"));
        section.questions.push({
          id: `q-${partId}`,
          qtype: "DND_GAP",
          prompt: { text: part.title, textWithBlanks: sentences.join("\n") },
          options: { bank: part.wordBank },
          maxScore: part.points || 1,
          order: questionOrder++,
        });
      } else {
        // Regular items (MCQ or short text)
        for (const item of part.items) {
          section.questions.push(transformItem(item, part.type, questionOrder++));
        }
      }
    }
  }
  
  return Object.values(sectionMap).filter((s) => s.questions.length > 0);
}

function transformItem(item: any, partType: string, order: number, passage?: string) {
  const base: any = {
    id: `q-${order}`,
    order,
    maxScore: item.points || 1,
  };
  
  if (partType === "true_false") {
    return {
      ...base,
      qtype: "TF",
      prompt: { text: item.prompt, passage },
      answerKey: { correct: item.answer },
    };
  }
  
  if (partType === "multiple_choice" || item.options) {
    const letters = ["A","B","C","D","E","F","G","H","I","J"];
    const options = Object.fromEntries(item.options.map((o: string, i: number) => [letters[i], o]));
    return {
      ...base,
      qtype: "MCQ_SINGLE",
      prompt: { text: item.prompt, passage },
      options,
      answerKey: { correct: letters[item.answer] },
    };
  }
  
  if (partType === "gap_fill" || partType === "short_answer") {
    const answers = Array.isArray(item.answer) ? item.answer : [item.answer].filter(Boolean);
    return {
      ...base,
      qtype: "SHORT_TEXT",
      prompt: { text: item.prompt, passage },
      answerKey: { correct: answers },
    };
  }
  
  // Default to short text
  return {
    ...base,
    qtype: "SHORT_TEXT",
    prompt: { text: item.prompt || item.text },
    answerKey: { correct: Array.isArray(item.answer) ? item.answer : [item.answer] },
  };
}

