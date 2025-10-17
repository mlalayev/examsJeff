import fs from "fs/promises";
import path from "path";

export async function loadJsonExam(examId: string) {
  console.log('Loading JSON exam:', examId);
  const examsDir = path.join(process.cwd(), "src", "data", "exams");
  console.log('Exams directory:', examsDir);
  const categories = await fs.readdir(examsDir, { withFileTypes: true });
  console.log('Categories found:', categories.map(c => c.name));
  
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
          console.log('Found exam file:', examPath, 'with ID:', examJson.id);
          
          if (examJson.id === examId) {
            console.log('Match found! Transforming exam...');
            return transformJsonExam(examJson);
          }
        } catch (err) {
          console.log('Error reading exam file:', examPath, err);
        }
      }
    }
  }
  
  return null;
}

function transformJsonExam(examJson: any) {
  // Create ONE SECTION PER PART (not grouped by skill!)
  const sections: any[] = [];
  let globalQuestionOrder = 1;
  
  for (const part of examJson.parts || []) {
    const partId = part.id;
    const partQuestions: any[] = [];
    
    // Determine section type based on part content
    let sectionType = determineSectionType(part.title, partId);
    
    // Handle subparts (like reading/listening with multiple question types)
    if (part.subparts) {
      for (const sub of part.subparts) {
        if (sub.items) {
          for (const item of sub.items) {
            const question = transformItem(item, sub.type, globalQuestionOrder++, part.text, part.title);
            partQuestions.push(question);
          }
        }
      }
    }
    // Handle regular parts
    else if (part.items) {
      // Special handling for parts that should be combined into single GAP questions
      if (["part1", "part5", "part6", "part9"].includes(partId)) {
        // Each item is a separate GAP question
        for (const item of part.items) {
          partQuestions.push(transformItem(item, part.type || 'gap_fill', globalQuestionOrder++, undefined, part.title));
        }
      } else if (partId === "part10" && part.wordBank) {
        // Each item is a separate GAP question with shared word bank
        for (const item of part.items) {
          const question = transformItem(item, 'gap_fill', globalQuestionOrder++, undefined, part.title);
          // Add word bank to options if not already there
          if (!question.options) {
            question.options = { bank: part.wordBank };
          }
          partQuestions.push(question);
        }
      } else {
        for (const item of part.items) {
          partQuestions.push(transformItem(item, part.type, globalQuestionOrder++, part.text, part.title));
        }
      }
    }
    
    // Only create section if it has questions
    if (partQuestions.length > 0) {
      sections.push({
        id: `section-${partId}`,
        type: `${sectionType}_${partId.toUpperCase()}`, // Make type unique by adding part ID
        title: part.title || `Part ${sections.length + 1}`,
        instruction: `Complete the ${part.title || 'questions'}`,
        durationMin: Math.ceil(partQuestions.length * 1.5),
        order: sections.length,
        questions: partQuestions,
      });
    }
  }
  
  console.log('JSON Exam Transform (by parts):', {
    examId: examJson.id,
    partsCount: examJson.parts?.length,
    sectionsCreated: sections.length,
    sections: sections.map(s => ({ 
      id: s.id,
      type: s.type, 
      title: s.title, 
      questionsCount: s.questions.length 
    }))
  });
  
  return {
    id: examJson.id,
    title: examJson.title,
    category: examJson.category || "GENERAL_ENGLISH",
    track: examJson.track,
    sections,
  };
}

function determineSectionType(title: string, partId: string): string {
  const lowerTitle = (title || '').toLowerCase();
  
  if (lowerTitle.includes('reading')) return 'READING';
  if (lowerTitle.includes('listening')) return 'LISTENING';
  if (lowerTitle.includes('writing')) return 'WRITING';
  if (lowerTitle.includes('speaking')) return 'SPEAKING';
  if (lowerTitle.includes('vocabulary') || lowerTitle.includes('vocab')) return 'VOCABULARY';
  
  // Default to GRAMMAR for numbered parts
  return 'GRAMMAR';
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
      answerKey: { value: item.answer },
    };
  }
  
  if (partType === "multiple_choice" || item.options) {
    return {
      ...base,
      qtype: "MCQ_SINGLE",
      prompt: { text: item.prompt, passage },
      options: { choices: item.options },
      answerKey: { index: item.answer },
    };
  }
  
  if (partType === "gap_fill" || partType === "short_answer" || partType === "gap_fill_verbs") {
    const answers = Array.isArray(item.answer) ? item.answer : [item.answer].filter(Boolean);
    return {
      ...base,
      qtype: "GAP",
      prompt: { text: item.prompt, passage },
      answerKey: { answers: answers },
    };
  }
  
  return {
    ...base,
    qtype: "SHORT_TEXT",
    prompt: { text: item.prompt || item.text },
    answerKey: { answers: Array.isArray(item.answer) ? item.answer : [item.answer] },
  };
}






