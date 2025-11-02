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
      // Note: part1, part3, part5 are inline_select, not gap_fill
      if (["part6", "part9"].includes(partId)) {
        // For short answer questions, build a shared word bank for all items
        const isShortAnswerPart = part.title?.toLowerCase().includes("short form") || 
                                  part.title?.toLowerCase().includes("'to be'");
        
        if (isShortAnswerPart) {
          // Count all answers across all items
          const answerCounts: Record<string, number> = {};
          part.items.forEach((item: any) => {
            const answers = Array.isArray(item.answer) ? item.answer : [item.answer].filter(Boolean);
            answers.forEach((answer: string) => {
              const trimmed = answer.trim();
              answerCounts[trimmed] = (answerCounts[trimmed] || 0) + 1;
            });
          });
          
          // Build shared word bank - only include answers that are actually used
          const sharedWordBank: string[] = [];
          Object.entries(answerCounts).forEach(([answer, count]) => {
            for (let i = 0; i < count; i++) {
              sharedWordBank.push(answer);
            }
          });
          
          // Shuffle
          for (let i = sharedWordBank.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [sharedWordBank[i], sharedWordBank[j]] = [sharedWordBank[j], sharedWordBank[i]];
          }
          
          // Transform each item with shared word bank
          for (const item of part.items) {
            const question = transformItem(item, part.type || 'gap_fill', globalQuestionOrder++, undefined, part.title);
            // Override word bank with shared one
            if (question.options) {
              question.options.bank = sharedWordBank;
            } else {
              question.options = { bank: sharedWordBank };
            }
            partQuestions.push(question);
          }
        } else {
          // Each item is a separate GAP question
          for (const item of part.items) {
            partQuestions.push(transformItem(item, part.type || 'gap_fill', globalQuestionOrder++, undefined, part.title));
          }
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
        audio: part.audio || null, // Include audio path if available
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

// Generate verb forms for gap_fill_verbs questions
function generateVerbForms(baseVerb: string, correctAnswers: string[]): string[] {
  const verb = baseVerb.toLowerCase();
  const forms = new Set<string>();
  
  // Always include correct answers
  correctAnswers.forEach(answer => forms.add(answer.trim().toLowerCase()));
  
  // Common irregular verb forms
  const irregularVerbs: Record<string, string[]> = {
    'be': ['am', 'is', 'are', 'was', 'were', 'been', 'being'],
    'have': ['have', 'has', 'had', 'having'],
    'do': ['do', 'does', 'did', 'done', 'doing'],
    'go': ['go', 'goes', 'went', 'gone', 'going'],
    'get': ['get', 'gets', 'got', 'gotten', 'getting'],
    'make': ['make', 'makes', 'made', 'making'],
    'take': ['take', 'takes', 'took', 'taken', 'taking'],
    'come': ['come', 'comes', 'came', 'coming'],
    'see': ['see', 'sees', 'saw', 'seen', 'seeing'],
    'know': ['know', 'knows', 'knew', 'known', 'knowing'],
    'think': ['think', 'thinks', 'thought', 'thinking'],
    'give': ['give', 'gives', 'gave', 'given', 'giving'],
    'say': ['say', 'says', 'said', 'saying'],
    'find': ['find', 'finds', 'found', 'finding'],
    'tell': ['tell', 'tells', 'told', 'telling'],
    'work': ['work', 'works', 'worked', 'working'],
    'call': ['call', 'calls', 'called', 'calling'],
    'try': ['try', 'tries', 'tried', 'trying'],
    'ask': ['ask', 'asks', 'asked', 'asking'],
    'need': ['need', 'needs', 'needed', 'needing'],
    'want': ['want', 'wants', 'wanted', 'wanting'],
    'like': ['like', 'likes', 'liked', 'liking'],
    'help': ['help', 'helps', 'helped', 'helping'],
    'live': ['live', 'lives', 'lived', 'living'],
    'play': ['play', 'plays', 'played', 'playing'],
    'look': ['look', 'looks', 'looked', 'looking'],
    'watch': ['watch', 'watches', 'watched', 'watching'],
    'read': ['read', 'reads', 'reading'],
    'write': ['write', 'writes', 'wrote', 'written', 'writing'],
    'drink': ['drink', 'drinks', 'drank', 'drunk', 'drinking'],
    'eat': ['eat', 'eats', 'ate', 'eaten', 'eating'],
    'sleep': ['sleep', 'sleeps', 'slept', 'sleeping'],
    'run': ['run', 'runs', 'ran', 'running'],
    'walk': ['walk', 'walks', 'walked', 'walking'],
    'talk': ['talk', 'talks', 'talked', 'talking'],
    'study': ['study', 'studies', 'studied', 'studying'],
    'learn': ['learn', 'learns', 'learned', 'learnt', 'learning'],
    'teach': ['teach', 'teaches', 'taught', 'teaching'],
    'buy': ['buy', 'buys', 'bought', 'buying'],
    'sell': ['sell', 'sells', 'sold', 'selling'],
    'meet': ['meet', 'meets', 'met', 'meeting'],
    'leave': ['leave', 'leaves', 'left', 'leaving'],
    'travel': ['travel', 'travels', 'travelled', 'traveled', 'travelling', 'traveling'],
    'visit': ['visit', 'visits', 'visited', 'visiting'],
    'enjoy': ['enjoy', 'enjoys', 'enjoyed', 'enjoying'],
    'finish': ['finish', 'finishes', 'finished', 'finishing'],
    'start': ['start', 'starts', 'started', 'starting'],
    'stop': ['stop', 'stops', 'stopped', 'stopping'],
    'decide': ['decide', 'decides', 'decided', 'deciding'],
    'plan': ['plan', 'plans', 'planned', 'planning'],
    'hope': ['hope', 'hopes', 'hoped', 'hoping'],
    'love': ['love', 'loves', 'loved', 'loving'],
    'hate': ['hate', 'hates', 'hated', 'hating'],
    'prefer': ['prefer', 'prefers', 'preferred', 'preferring'],
  };
  
  // Check if it's an irregular verb
  if (irregularVerbs[verb]) {
    irregularVerbs[verb].forEach(form => forms.add(form));
  } else {
    // Regular verb patterns
    // Present forms
    if (verb.endsWith('y')) {
      const base = verb.slice(0, -1);
      forms.add(verb); // base form
      forms.add(base + 'ies'); // third person singular
      forms.add(base + 'ied'); // past/past participle
      forms.add(base + 'ying'); // -ing form
    } else if (verb.endsWith('e')) {
      const base = verb.slice(0, -1);
      forms.add(verb); // base form
      forms.add(verb + 's'); // third person singular
      forms.add(verb + 'd'); // past/past participle
      forms.add(base + 'ing'); // -ing form
    } else if (verb.match(/[bcdfghjklmnpqrstvwxz]$/)) {
      // Ends with consonant - double last letter for -ing
      forms.add(verb); // base form
      forms.add(verb + 's'); // third person singular
      forms.add(verb + 'ed'); // past/past participle
      forms.add(verb + verb.slice(-1) + 'ing'); // -ing form (doubled)
    } else {
      // Default pattern
      forms.add(verb); // base form
      forms.add(verb + 's'); // third person singular
      forms.add(verb + 'ed'); // past/past participle
      forms.add(verb + 'ing'); // -ing form
    }
  }
  
  // Also handle contractions
  if (forms.has("is not")) forms.add("isn't");
  if (forms.has("are not")) forms.add("aren't");
  if (forms.has("was not")) forms.add("wasn't");
  if (forms.has("were not")) forms.add("weren't");
  if (forms.has("do not")) forms.add("don't");
  if (forms.has("does not")) forms.add("doesn't");
  if (forms.has("did not")) forms.add("didn't");
  
  // Add any correct answers that might be contractions or variations
  correctAnswers.forEach(answer => {
    const clean = answer.trim().toLowerCase();
    forms.add(clean);
  });
  
  return Array.from(forms).sort();
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
  
  // Handle inline_select (previously gap_fill_options) - uses inline select dropdown
  // Check this FIRST to avoid confusion with multiple_choice
  // For inline_select, we use "options" field, NOT "choices"
  if (partType === "inline_select" || partType === "gap_fill_options" || partType === "gap_fill_verbs" || partType === "short_answer") {
    const promptText = item.prompt || '';
    
    // If options are provided in JSON (like part1 for gap_fill_options), use them directly
    if (item.options && Array.isArray(item.options)) {
      const answers = Array.isArray(item.answer) ? item.answer : [item.answer].filter(Boolean);
      const options = item.options;
      
      // Find the index of the correct answer
      let correctIndex = -1;
      for (let i = 0; i < options.length; i++) {
        if (answers.some(ans => ans.trim().toLowerCase() === options[i].trim().toLowerCase())) {
          correctIndex = i;
          break;
        }
      }
      
      // Use prompt as-is (should already have ____ marker in JSON)
      // If no blank marker, keep prompt as-is (QInlineSelect will handle it)
      
      return {
        ...base,
        qtype: "INLINE_SELECT",
        prompt: { text: promptText, passage },
        options: { choices: options },
        answerKey: { index: correctIndex >= 0 ? correctIndex : 0 },
      };
    }
    
    // Otherwise, handle verb forms generation (old behavior)
    const verbMatch = promptText.match(/\(([^)]+)\)/);
    let baseVerb = verbMatch ? verbMatch[1].trim() : '';
    
    // Handle "not/ be" or "not/be" patterns - extract just the verb part
    if (baseVerb.includes('/')) {
      const parts = baseVerb.split('/').map(p => p.trim());
      baseVerb = parts[parts.length - 1]; // Take the last part after "/"
    }
    
    const answers = Array.isArray(item.answer) ? item.answer : [item.answer].filter(Boolean);
    let options: string[] = [];
    
    // Check if this is adjective/adverb question (should not use verb forms)
    const isAdjectiveAdverb = partTitle?.toLowerCase().includes('adjective') || 
                              partTitle?.toLowerCase().includes('adverb') ||
                              promptText.toLowerCase().includes('adjective') ||
                              promptText.toLowerCase().includes('adverb');
    
    // If verb found in parentheses AND not adjective/adverb question, generate verb forms
    if (baseVerb && verbMatch && !isAdjectiveAdverb) {
      options = generateVerbForms(baseVerb, answers);
    } else {
      // For non-verb gap_fill (prepositions, adjectives, etc.), create options from answers and common alternatives
      const optionsSet = new Set<string>();
      
      // Always include correct answers
      answers.forEach(answer => optionsSet.add(answer.trim().toLowerCase()));
      
      // Add common alternatives based on prompt content
      const promptLower = promptText.toLowerCase();
      if (promptLower.includes('preposition') || promptLower.includes('time expression')) {
        // Common prepositions and time expressions
        ['in', 'on', 'at', 'when', 'ago', 'next', 'last', 'before', 'after', 'during', 'for', 'since', 'until', 'by', 'from', 'to']
          .forEach(opt => optionsSet.add(opt));
      } else if (promptLower.includes('adjective') || promptLower.includes('adverb')) {
        // For adjective/adverb questions, add the base form variations
        answers.forEach(answer => {
          const base = answer.trim().toLowerCase();
          if (base.endsWith('ly')) {
            // Remove 'ly' to get adjective form
            const adj = base.slice(0, -2);
            optionsSet.add(adj);
            optionsSet.add(base); // adverb form
          } else {
            // Add 'ly' to get adverb form
            optionsSet.add(base);
            optionsSet.add(base + 'ly');
          }
        });
        // Common adjective/adverb pairs
        ['good', 'well', 'bad', 'badly', 'quick', 'quickly', 'slow', 'slowly', 
         'careful', 'carefully', 'easy', 'easily', 'terrible', 'terribly']
          .forEach(opt => optionsSet.add(opt));
      } else {
        // Generic case - just use answers and add some variations
        answers.forEach(answer => optionsSet.add(answer.trim().toLowerCase()));
      }
      
      options = Array.from(optionsSet).sort();
    }
    
    // Find the index of the correct answer (normalize for comparison)
    let correctIndex = -1;
    for (let i = 0; i < options.length; i++) {
      const normalizedOption = options[i].trim().toLowerCase();
      if (answers.some(ans => ans.trim().toLowerCase() === normalizedOption)) {
        correctIndex = i;
        break;
      }
    }
    
    // If exact match not found, add correct answers to options
    if (correctIndex === -1 && answers.length > 0) {
      answers.forEach(answer => {
        const normalized = answer.trim().toLowerCase();
        if (!options.includes(normalized)) {
          options.push(normalized);
        }
      });
      // Sort again and find index
      options.sort();
      correctIndex = options.findIndex(opt => 
        answers.some(ans => ans.trim().toLowerCase() === opt.toLowerCase())
      );
    }
    
    return {
      ...base,
      qtype: "SELECT",
      prompt: { text: promptText, passage },
      options: { choices: options },
      answerKey: { index: correctIndex >= 0 ? correctIndex : 0 },
    };
  }
  
  // Handle gap_fill - uses drag and drop (for preposition/time expression questions and short answers)
  if (partType === "gap_fill") {
    const promptText = item.prompt || '';
    const answers = Array.isArray(item.answer) ? item.answer : [item.answer].filter(Boolean);
    
    // Check if this is preposition/time expression question
    const isPrepositionTime = partTitle?.toLowerCase().includes('preposition') || 
                              partTitle?.toLowerCase().includes('time expression') ||
                              promptText.toLowerCase().includes('preposition') ||
                              promptText.toLowerCase().includes('time expression');
    
    // Check if this is short answers question (am/is/are)
    // Pattern: "Yes, I ___" or "No, he ___" or similar short answer patterns
    const shortAnswerPattern = /(yes|no),\s+(i|you|he|she|it|we|they)\s+_+/i;
    const isShortAnswers = partTitle?.toLowerCase().includes('short answer') ||
                           partTitle?.toLowerCase().includes('am / is / are') ||
                           partTitle?.toLowerCase().includes("'to be'") ||
                           shortAnswerPattern.test(promptText);
    
    if (isPrepositionTime) {
      // Generate word bank with prepositions/time expressions
      const optionsSet = new Set<string>();
      
      // Always include correct answers
      answers.forEach(answer => optionsSet.add(answer.trim()));
      
      // Add common prepositions and time expressions
      ['in', 'on', 'at', 'when', 'ago', 'next', 'last', 'before', 'after', 'during', 'for', 'since', 'until', 'by', 'from', 'to', 'In', 'When']
        .forEach(opt => optionsSet.add(opt));
      
      const wordBank = Array.from(optionsSet).sort();
      
      // Replace blank markers in prompt (___, ___, or ________)
      const textWithBlanks = promptText.replace(/___+|__+/g, '________');
      
      return {
        ...base,
        qtype: "DND_GAP",
        prompt: { 
          text: textWithBlanks,
          passage 
        },
        options: { bank: wordBank },
        answerKey: { blanks: answers },
      };
    } else if (isShortAnswers) {
      // Generate word bank with am/is/are forms
      // Count how many times each answer appears
      const answerCounts: Record<string, number> = {};
      answers.forEach(answer => {
        const trimmed = answer.trim();
        answerCounts[trimmed] = (answerCounts[trimmed] || 0) + 1;
      });
      
      // Build word bank with correct counts
      const wordBank: string[] = [];
      Object.entries(answerCounts).forEach(([answer, count]) => {
        for (let i = 0; i < count; i++) {
          wordBank.push(answer);
        }
      });
      
      // Add some extra distractors (but not duplicates of correct answers)
      const extraOptions = ['am', 'is', 'are', 'am not', 'is not', 'are not', "isn't", "aren't"];
      extraOptions.forEach(opt => {
        if (!answerCounts[opt]) {
          wordBank.push(opt);
        }
      });
      
      // Shuffle the word bank
      for (let i = wordBank.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [wordBank[i], wordBank[j]] = [wordBank[j], wordBank[i]];
      }
      
      // Replace blank markers in prompt (______)
      const textWithBlanks = promptText.replace(/___+/g, '________');
      
      return {
        ...base,
        qtype: "DND_GAP",
        prompt: { 
          text: textWithBlanks,
          passage 
        },
        options: { bank: wordBank },
        answerKey: { blanks: answers },
      };
    }
    
    // For other gap_fill types, use regular GAP type
    return {
      ...base,
      qtype: "GAP",
      prompt: { text: item.prompt, passage },
      answerKey: { answers: answers },
    };
  }
  
  // Handle multiple_choice - supports both "choices" and "options" fields for backward compatibility
  if (partType === "multiple_choice" || item.choices || (item.options && partType !== "gap_fill_options")) {
    // Check both choices and options fields (options only if not gap_fill_options)
    const choices = item.choices || (item.options && partType !== "gap_fill_options" ? item.options : null);
    if (choices && Array.isArray(choices)) {
      return {
        ...base,
        qtype: "MCQ_SINGLE",
        prompt: { text: item.prompt, passage },
        options: { choices: choices },
        answerKey: { index: item.answer },
      };
    }
  }
  
  return {
    ...base,
    qtype: "SHORT_TEXT",
    prompt: { text: item.prompt || item.text },
    answerKey: { answers: Array.isArray(item.answer) ? item.answer : [item.answer] },
  };
}






