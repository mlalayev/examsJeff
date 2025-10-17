import fs from "fs/promises";
import path from "path";

export async function loadJsonExam(examId: string) {
  const examsDir = path.join(process.cwd(), "src", "data", "exams");
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
          const examJson = JSON.parse(examData);
          
          if (examJson.id === examId) {
            return transformJsonExam(examJson);
          }
        } catch (err) {
          // Skip
        }
      }
    }
  }
  
  return null;
}

function transformJsonExam(examJson: any) {
  // Group by question type instead of skill (Reading/Writing/etc)
  const questionTypeGroups: Record<string, any[]> = {};
  const questionTypeInstructions: Record<string, string> = {
    "MCQ_SINGLE": "Choose the correct answer",
    "TF": "Mark the statements as True or False",
    "DND_GAP": "Drag the correct words to fill in the blanks",
    "GAP": "Fill in the blanks with the correct words",
    "SHORT_TEXT": "Write your answer in the space provided",
  };
  
  let globalQuestionOrder = 1;
  
  // Collect all questions first
  const allQuestions: any[] = [];
  
  for (const part of examJson.parts || []) {
    const partId = part.id;
    
    if (part.subparts) {
      for (const sub of part.subparts) {
        if (sub.items) {
          for (const item of sub.items) {
            allQuestions.push(transformItem(item, sub.type, globalQuestionOrder++, part.text, part.title));
          }
        }
      }
    }
    else if (part.items) {
      if (["part1", "part5", "part6", "part9"].includes(partId)) {
        const sentences = part.items.map((it: any) => String(it.prompt).replace(/_{2,}/g, "___"));
        const bankSet = new Set<string>();
        part.items.forEach((it: any) => {
          const answers = Array.isArray(it.answer) ? it.answer : [it.answer];
          answers.forEach((a: string) => a && bankSet.add(a));
        });
        
        allQuestions.push({
          id: `q-${partId}`,
          qtype: "DND_GAP",
          prompt: { text: part.title, textWithBlanks: sentences.join("\n") },
          options: { bank: Array.from(bankSet) },
          maxScore: part.points || 1,
          order: globalQuestionOrder++,
          partTitle: part.title,
        });
      } else if (partId === "part10" && part.wordBank) {
        const sentences = part.items.map((it: any) => String(it.prompt).replace(/_{2,}/g, "___"));
        allQuestions.push({
          id: `q-${partId}`,
          qtype: "DND_GAP",
          prompt: { text: part.title, textWithBlanks: sentences.join("\n") },
          options: { bank: part.wordBank },
          maxScore: part.points || 1,
          order: globalQuestionOrder++,
          partTitle: part.title,
        });
      } else {
        for (const item of part.items) {
          allQuestions.push(transformItem(item, part.type, globalQuestionOrder++, undefined, part.title));
        }
      }
    }
  }
  
  // Group questions by type
  allQuestions.forEach(q => {
    const type = q.qtype;
    if (!questionTypeGroups[type]) {
      questionTypeGroups[type] = [];
    }
    questionTypeGroups[type].push(q);
  });
  
  // Create sections from question type groups
  const sections = Object.entries(questionTypeGroups).map(([qtype, questions], index) => ({
    id: `section-${qtype.toLowerCase()}`,
    type: qtype, // Use question type as section type
    title: getQuestionTypeTitle(qtype),
    instruction: questionTypeInstructions[qtype] || "Complete the following questions",
    durationMin: Math.ceil(questions.length * 1.5), // ~1.5 min per question
    order: index,
    questions: questions.sort((a, b) => a.order - b.order),
  }));
  
  console.log('JSON Exam Transform (by question type):', {
    examId: examJson.id,
    partsCount: examJson.parts?.length,
    questionTypes: sections.map(s => ({ type: s.type, count: s.questions.length }))
  });
  
  return {
    id: examJson.id,
    title: examJson.title,
    category: examJson.category || "GENERAL_ENGLISH",
    track: examJson.track,
    sections,
  };
}

function getQuestionTypeTitle(qtype: string): string {
  const titles: Record<string, string> = {
    "MCQ_SINGLE": "Multiple Choice Questions",
    "TF": "True or False",
    "DND_GAP": "Fill in the Blanks",
    "GAP": "Gap Fill",
    "SHORT_TEXT": "Short Answer Questions",
  };
  return titles[qtype] || qtype;
}

function transformItem(item: any, partType: string, order: number, passage?: string, partTitle?: string) {
  const base: any = {
    id: `q-${order}`,
    order,
    maxScore: item.points || 1,
    partTitle,
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
  
  return {
    ...base,
    qtype: "SHORT_TEXT",
    prompt: { text: item.prompt || item.text },
    answerKey: { correct: Array.isArray(item.answer) ? item.answer : [item.answer] },
  };
}




