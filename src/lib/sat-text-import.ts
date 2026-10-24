import type { Question, Section } from '@/components/admin/exams/create/types';

export const SAT_IMPORT_MODULES = ['verbal module 1', 'verbal module 2', 'math module 1', 'math module 2'];
export type SatImportResult = { modules: Question[][]; errors: string[] };

/** Strict, local-only parser. Never guesses answer keys or silently drops malformed input. */
export function parseSatText(text: string, images: Record<string, string> = {}): SatImportResult {
  const modules: Question[][] = [[], [], [], []];
  const errors: string[] = [];
  if (text.length > 200_000) return { modules, errors: ['Text exceeds 200,000 characters.'] };
  let moduleIndex = -1;
  const seen = new Set<number>();
  let current: { number: number; line: number; text: string; choices: Record<string, string>; answer: string; explanation: string; type?: string } | null = null;
  let field = 'text';
  const fail = (line: number, message: string) => errors.push(`Line ${line}: ${message}`);
  const extractImage = (value: string, line: number) => {
    let image: string | undefined;
    const clean = value.replace(/\[Image:\s*([^\]]+)\]/gi, (_, raw: string) => {
      const path = raw.trim();
      const resolved = images[path] || path;
      if (!/^\/api\/images\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp)$/.test(resolved)) fail(line, `Image not uploaded: ${path}. Upload the ZIP containing this image, or remove the marker and add it in Edit.`);
      else if (image) fail(line, 'Only one image per question or choice is supported.');
      else image = resolved;
      return '';
    }).trim();
    return { text: clean, image };
  };
  const finish = () => {
    if (!current || moduleIndex < 0) return;
    const q = current;
    const prompt = extractImage(q.text, q.line);
    const choices = ['a', 'b', 'c', 'd'].map(k => extractImage(q.choices[k] || '', q.line));
    if (q.number !== modules[moduleIndex].length + 1) fail(q.line, 'Number questions consecutively from 1 in each module.');
    if (!prompt.text && !prompt.image) fail(q.line, 'Question text is missing.');
    const isOpen = q.type === 'SHORT_TEXT';
    if (isOpen) {
      if (Object.keys(q.choices).length) fail(q.line, 'SHORT_TEXT questions must not have choices.');
      if (!q.answer || q.answer.split('|').some(a => !a.trim())) fail(q.line, 'Provide a non-empty Answer for SHORT_TEXT. Separate alternatives with |.');
    } else {
      if (!choices.every(c => c.text || c.image)) fail(q.line, 'Provide four non-empty choices: a, b, c, d. For open answers add Type: SHORT_TEXT.');
      if (!/^[a-d]$/i.test(q.answer)) fail(q.line, 'Provide Answer: A, B, C or D.');
    }
    modules[moduleIndex].push({
      id: `import-${moduleIndex}-${modules[moduleIndex].length}`, qtype: isOpen ? 'SHORT_TEXT' : 'MCQ_SINGLE',
      order: modules[moduleIndex].length, prompt: { text: prompt.text },
      ...(prompt.image ? { image: prompt.image } : {}),
      ...(isOpen ? {} : { options: { choices: choices.map(c => c.text), ...(choices.some(c => c.image) ? { choiceImages: choices.map(c => c.image || '') } : {}) } }),
      answerKey: isOpen ? { answers: q.answer.split('|').map(a => a.trim()) } : { index: 'abcd'.indexOf(q.answer.toLowerCase()) }, maxScore: 1,
      explanation: q.explanation.trim(),
    });
    current = null;
  };
  text.replace(/^\uFEFF/, '').split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line) return;
    const header = line.match(/^\[(.+)\]$/);
    if (header && !/^\[(Image:|text\]|textintro\]|question\])/i.test(line)) {
      finish();
      moduleIndex = SAT_IMPORT_MODULES.indexOf(header[1].toLowerCase().replace(/\s+/g, ' ').trim());
      if (moduleIndex < 0) fail(index + 1, `Unknown module: ${header[1]}`);
      else if (seen.has(moduleIndex)) fail(index + 1, 'Duplicate module heading.');
      else seen.add(moduleIndex);
      return;
    }
    if (moduleIndex < 0) { fail(index + 1, 'Add a valid module heading before questions.'); return; }
    const question = line.match(/^(\d+)[.)]\s*(.*)$/);
    if (question) {
      finish();
      current = { number: Number(question[1]), line: index + 1, text: question[2], choices: {}, answer: '', explanation: '' };
      field = 'text';
      return;
    }
    if (!current) { fail(index + 1, 'Expected a numbered question.'); return; }
    if (/^\[Image:/i.test(line)) {
      // Standalone markers belong to the question, not the preceding option or a new module.
      current.text += '\n' + line;
      return;
    }
    const choice = line.match(/^([a-d])[.)]\s*(.*)$/i);
    const answer = line.match(/^Answer\s*:\s*(.*)$/i);
    const explanation = line.match(/^Explanation\s*:\s*(.*)$/i);
    const type = line.match(/^Type\s*:\s*(.*)$/i);
    if (type) {
      if (current.type) fail(index + 1, 'Duplicate Type field.');
      current.type = type[1].trim().toUpperCase();
      if (!['MCQ_SINGLE', 'SHORT_TEXT'].includes(current.type)) fail(index + 1, 'Type must be MCQ_SINGLE or SHORT_TEXT.');
    } else if (choice) {
      field = choice[1].toLowerCase();
      if (Object.prototype.hasOwnProperty.call(current.choices, field)) fail(index + 1, 'Duplicate answer choice.');
      current.choices[field] = choice[2];
    } else if (answer) {
      if (current.answer) fail(index + 1, 'Duplicate Answer field.');
      current.answer = answer[1].trim(); field = 'answer';
    } else if (explanation) {
      field = 'explanation'; current.explanation += explanation[1];
    } else if (field === 'text') current.text += '\n' + line;
    else if (field === 'explanation') current.explanation += '\n' + line;
    else if (field === 'answer') fail(index + 1, 'Unexpected text after Answer. Use Explanation: for explanations.');
    else current.choices[field] += '\n' + line;
  });
  finish();
  SAT_IMPORT_MODULES.forEach((name, i) => { if (!modules[i].length) errors.push(`Missing questions in [${name}].`); });
  return { modules, errors };
}

export function appendSatImport(sections: Section[], result: SatImportResult, batchId: string): Section[] {
  if (result.errors.length || sections.length !== 4 || result.modules.some(m => !m.length)) throw new Error('Invalid SAT import.');
  return sections.map((section, i) => ({ ...section, questions: [
    ...section.questions,
    ...result.modules[i].map((q, j) => ({ ...q, id: `import-${batchId}-${i}-${j}`, order: section.questions.length + j })),
  ] }));
}
