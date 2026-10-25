import type { Section, SectionType, QuestionType, Question } from '@/components/admin/exams/create/types';
export const GENERAL_SECTIONS: SectionType[] = ['GRAMMAR', 'VOCABULARY', 'READING', 'LISTENING', 'WRITING'];
export const GENERAL_TEXT_TYPES: QuestionType[] = ['MCQ_SINGLE', 'MCQ_MULTI', 'TF', 'TF_NG', 'SHORT_TEXT', 'FILL_IN_BLANK', 'INLINE_SELECT', 'ORDER_SENTENCE', 'DND_GAP', 'ESSAY'];
export type GeneralImportResult = { sections: Section[]; errors: string[]; warnings: string[] };
export function parseGeneralText(text: string, allowedTypes = GENERAL_TEXT_TYPES, allowedSections = GENERAL_SECTIONS): GeneralImportResult {
  const result: GeneralImportResult = { sections: [], errors: [], warnings: [] };
  const fail = (line: number, message: string) => result.errors.push(`Line ${line}: ${message}`);
  if (!text.trim() || text.length > 200000 || /[\u0000\uFFFD]/.test(text)) return { ...result, errors: ['Use non-empty UTF-8 text up to 200,000 characters.'] };
  let section: Section | undefined;
  let passage = false;
  let q: { number: number; line: number; text: string; fields: Record<string,string>; choices: Record<string,string> } | undefined;
  let field = 'text';
  const finish = () => {
    if (!q || !section) return;
    const { fields: f, choices: c, line } = q;
    const type = f.type?.toUpperCase() as QuestionType;
    if (!GENERAL_TEXT_TYPES.includes(type) || !allowedTypes.includes(type)) fail(line, `Unsupported or unselected Type: ${f.type || '(missing)'}.`);
    if (section.type === 'WRITING' && !['ESSAY', 'SHORT_TEXT'].includes(type)) fail(line, 'Writing supports ESSAY or SHORT_TEXT.');
    if (type === 'ESSAY' && section.type !== 'WRITING') fail(line, 'Place ESSAY tasks in WRITING.');
    if (!q.text.trim()) fail(line, 'Question text is required.');
    if (q.number !== section.questions.length + 1) fail(line, 'Number questions consecutively from 1 in each section.');
    const question: Question = { id: `ge-q-${result.sections.length}-${section.questions.length}`, order: section.questions.length, qtype: type, prompt: { text: q.text.trim() }, answerKey: null, maxScore: 1, explanation: f.explanation || '' };
    const answer = f.answer?.trim() || '';
    const choiceType = ['MCQ_SINGLE','MCQ_MULTI','INLINE_SELECT'].includes(type);
    if (!choiceType && Object.keys(c).length) fail(line, 'This type must not contain a–h choices.');
    if (choiceType) {
      const keys = Object.keys(c).sort();
      if (keys.length < 2 || keys.some((k,i) => k !== 'abcdefgh'[i] || !c[k].trim())) fail(line, 'Provide 2–8 non-empty consecutive choices, starting at a.');
      question.options = { choices: keys.map(k => c[k]) };
      const letters = answer.toLowerCase().split(',').map(v => v.trim());
      if (letters.some(v => !keys.includes(v)) || new Set(letters).size !== letters.length || (type !== 'MCQ_MULTI' && letters.length !== 1)) fail(line, 'Answer must identify valid choice letters (multiple: A, C).');
      question.answerKey = type === 'MCQ_MULTI' ? { indices: letters.map(v => keys.indexOf(v)) } : { index: keys.indexOf(letters[0]) };
    } else if (type === 'TF' || type === 'TF_NG') {
      const value = answer.toUpperCase();
      if (!(type === 'TF' ? ['TRUE','FALSE'] : ['TRUE','FALSE','NOT GIVEN']).includes(value)) fail(line, 'Use Answer: TRUE, FALSE' + (type === 'TF_NG' ? ' or NOT GIVEN.' : '.'));
      question.answerKey = { value: type === 'TF' ? value === 'TRUE' : value };
    } else if (type === 'SHORT_TEXT') {
      const answers = answer.split('|').map(v => v.trim());
      if (answers.some(v => !v)) fail(line, 'Provide Answer; separate accepted alternatives with |.');
      question.answerKey = { answers };
    } else if (type === 'FILL_IN_BLANK' || type === 'DND_GAP') {
      const blanks = answer.split('|').map(v => v.trim());
      const count = (q.text.match(type === 'FILL_IN_BLANK' ? /\[input\]/g : /___/g) || []).length;
      if (!count || blanks.length !== count || blanks.some(v => !v)) fail(line, 'Provide one Answer per blank, in order, separated by |.');
      question.answerKey = { blanks };
      if (type === 'DND_GAP') {
        const bank = (f.bank || '').split('|').map(v => v.trim());
        if (bank.some(v => !v) || blanks.some(v => !bank.includes(v))) fail(line, 'Bank must contain every correct answer, separated by |.');
        question.prompt = { textWithBlanks: q.text.trim() }; question.options = { bank };
      }
    } else if (type === 'ORDER_SENTENCE') {
      const tokens = (f.tokens || '').split('|').map(v => v.trim());
      const order = answer.split(',').map(v => Number(v.trim()) - 1);
      if (tokens.length < 2 || tokens.some(v => !v) || order.length !== tokens.length || new Set(order).size !== tokens.length || order.some(v => !Number.isInteger(v) || v < 0 || v >= tokens.length)) fail(line, 'Tokens: words separated by |; Answer: a permutation of token numbers, e.g. 2, 1, 3.');
      question.prompt = { text: q.text.trim(), tokens, rawText: tokens.join('\n') }; question.answerKey = { order };
    } else if (type === 'ESSAY' && answer) fail(line, 'ESSAY has no Answer field; include requirements in the task text.');
    if (f.tokens && type !== 'ORDER_SENTENCE') fail(line, 'Tokens is only valid for ORDER_SENTENCE.');
    if (f.bank && type !== 'DND_GAP') fail(line, 'Bank is only valid for DND_GAP.');
    section.questions.push(question); q = undefined;
  };
  text.replace(/^\uFEFF/, '').split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim(); const n = index + 1;
    if (passage) {
      if (line.toLowerCase() === '[/passage]') passage = false;
      else if (section) section.passage = (section.passage || '') + raw + '\n';
      return;
    }
    if (!line) return;
    const heading = line.match(/^\[section:\s*([a-z_]+)\]$/i);
    if (heading) {
      finish(); const type = heading[1].toUpperCase() as SectionType;
      if (!GENERAL_SECTIONS.includes(type) || !allowedSections.includes(type)) fail(n, `Unsupported or unselected section: ${type}.`);
      if (result.sections.some(s => s.type === type)) fail(n, 'Use each section type once. Put its questions together.');
      section = { id: `ge-s-${result.sections.length}`, type, title: type[0] + type.slice(1).toLowerCase(), order: result.sections.length, durationMin: 20, instruction: '', questions: [] };
      result.sections.push(section); return;
    }
    if (!section) { fail(n, 'Start with [section: GRAMMAR], VOCABULARY, READING, LISTENING or WRITING.'); return; }
    if (line.toLowerCase() === '[passage]') {
      if (q || section.questions.length || section.type !== 'READING' || section.passage !== undefined) fail(n, 'Use one [passage] block before Reading questions.');
      passage = true; section.passage = ''; return;
    }
    const numbered = line.match(/^(\d+)[.)]\s+(.*)$/);
    if (numbered) { finish(); q = { number: Number(numbered[1]), line: n, text: numbered[2], fields: {}, choices: {} }; field = 'text'; return; }
    if (!q) {
      const meta = line.match(/^(Title|Duration|Instruction):\s*(.*)$/i);
      if (!meta || section.questions.length) { fail(n, 'Expected section metadata or a numbered question.'); return; }
      if (meta[1].toLowerCase() === 'title') section.title = meta[2];
      else if (meta[1].toLowerCase() === 'instruction') section.instruction = meta[2];
      else { const duration = Number(meta[2]); if (!Number.isInteger(duration) || duration < 1 || duration > 600) fail(n, 'Duration must be 1–600 minutes.'); else section.durationMin = duration; }
      return;
    }
    const choice = line.match(/^([a-h])[.)]\s*(.*)$/i);
    const named = line.match(/^(Type|Answer|Explanation|Tokens|Bank):\s*(.*)$/i);
    if (named) {
      field = named[1].toLowerCase(); if (field in q.fields) fail(n, `Duplicate ${named[1]}.`); q.fields[field] = named[2];
    } else if (choice) {
      field = choice[1].toLowerCase(); if (field in q.choices) fail(n, 'Duplicate choice.'); q.choices[field] = choice[2];
    } else if (/^\[(?!input\])/i.test(line) || /^[A-Za-z]+:/.test(line)) fail(n, 'Unknown marker or field.');
    else if (field === 'text') q.text += '\n' + raw;
    else if (field === 'explanation') q.fields.explanation += '\n' + raw;
    else if (field in q.choices) q.choices[field] += '\n' + raw;
    else fail(n, 'Unexpected text after a field. Put multiline task text before Type.');
  });
  finish();
  if (passage) result.errors.push('Missing [/passage].');
  if (!result.sections.length) result.errors.push('No sections found.');
  for (const s of result.sections) {
    if (!s.questions.length) result.errors.push(`${s.title}: no questions.`);
    if (!s.title.trim()) result.errors.push('Section title cannot be empty.');
    if (s.type === 'READING' && !s.passage?.trim()) result.errors.push('Reading needs a non-empty [passage] block.');
    if (s.type === 'LISTENING') result.warnings.push('Listening audio must be uploaded in the section editor before publishing.');
    if (s.type === 'WRITING') result.warnings.push('Writing tasks are imported without automatic scoring; review grading separately.');
  }
  return result;
}

export function appendGeneralImport(existing: Section[], result: GeneralImportResult, batch: string): Section[] {
  if (result.errors.length || !result.sections.length) throw new Error('Fix import errors first.');
  let next = [...existing];
  result.sections.forEach((s,i) => {
    const matches = next.filter(e => e.type === s.type);
    if (matches.length > 1) throw new Error(`${s.title}: multiple existing sections; cannot choose an import target safely.`);
    const target = matches[0];
    if (target?.passage?.trim() && target.passage.trim() !== s.passage?.trim()) throw new Error('Reading passage differs from the existing passage. Existing text and questions were kept.');
    const questions = s.questions.map((q,j) => ({ ...q, id: `ge-${batch}-${i}-${j}`, order: (target?.questions.length || 0) + j }));
    if (target) next = next.map(e => e.id === target.id ? { ...e, passage: e.passage || s.passage, questions: [...e.questions,...questions] } : e);
    else next.push({ ...s, id: `ge-${batch}-${i}`, order: next.length, questions });
  });
  return next;
}
