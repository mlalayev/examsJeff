import { appendSatImport, parseSatText, SAT_IMPORT_MODULES } from './sat-text-import';
import { buildExamPayload } from '@/components/admin/exams/create/examSerializer';
import type { Section } from '@/components/admin/exams/create/types';
import { readFileSync } from 'fs';
import { join } from 'path';
import { MATH_IMPORT_INSTRUCTIONS } from './sat-import-instructions';

const question = '1. What is 2 + 3?\na. 4\nb. 5\nc. 6\nd. 7\nAnswer: B\nExplanation: Addition.';
const source = SAT_IMPORT_MODULES.map(m => `[${m}]\n${question}`).join('\n\n');

test('Math requires exactly its two modules and rejects Verbal or missing modules', () => {
  expect(MATH_IMPORT_INSTRUCTIONS).not.toContain('[verbal module');
  expect(MATH_IMPORT_INSTRUCTIONS).toContain('[math module 1]\n[math module 2]');
  const text = ['math module 1', 'math module 2'].map(m => `[${m}]\n${question}`).join('\n');
  const parsed = parseSatText(text, {}, 'MATH');
  expect(parsed.errors).toEqual([]);
  expect(parsed.modules.map(m => m.length)).toEqual([1, 1]);
  expect(parseSatText(source, {}, 'MATH').errors.join(' ')).toContain('Unknown module: verbal');
  expect(parseSatText(`[math module 1]\n${question}`, {}, 'MATH').errors).toContain('Missing questions in [math module 2].');
  expect(parseSatText(text).errors).toContain('Missing questions in [verbal module 1].');
  expect(() => appendSatImport(sections(), parsed, 'bad')).toThrow();
});
const sections = (): Section[] => ['READING', 'LISTENING', 'GRAMMAR', 'VOCABULARY'].map((type, i) => ({
  id: `s${i}`, type: type as Section['type'], title: SAT_IMPORT_MODULES[i], instruction: '', order: i, durationMin: i < 2 ? 32 : 35, questions: [],
}));

test('the supplied production QA example has exactly two valid questions per module', () => {
  const result = parseSatText(readFileSync(join(process.cwd(), 'examples/sat-mock-test-for-prod.txt'), 'utf8'));
  expect(result.errors).toEqual([]);
  expect(result.modules.map(m => m.length)).toEqual([2, 2, 2, 2]);
});

test('parses four modules, choices, answers and explanations into the existing save format', () => {
  const parsed = parseSatText(source);
  expect(parsed.errors).toEqual([]);
  const added = appendSatImport(sections(), parsed, 'batch');
  const payload = buildExamPayload('Test', 'SAT', '', null, added);
  expect(payload.sections).toHaveLength(4);
  expect(payload.sections.map(s => s.questions.length)).toEqual([1, 1, 1, 1]);
  expect(payload.sections[0].questions[0]).toMatchObject({ prompt: { text: 'What is 2 + 3?' }, options: { choices: ['4','5','6','7'] }, answerKey: { index: 1 }, explanation: 'Addition.' });
});

test.each([
  ['missing answer', source.replace('Answer: B', '')],
  ['invalid answer', source.replace('Answer: B', 'Answer: E')],
  ['empty choice', source.replace('b. 5', 'b.')],
  ['duplicate choice', source.replace('b. 5', 'a. 5')],
  ['missing module', source.slice(source.indexOf('[verbal module 2]'))],
  ['duplicate module', source + '\n[math module 2]\n' + question],
  ['unknown heading', source.replace('[math module 2]', '[math module 3]')],
  ['duplicate question number', source + '\n' + question],
  ['preamble', 'Here are your questions:\n' + source],
  ['oversized text', 'a'.repeat(200001)],
])('rejects %s without allowing partial import', (_, text) => {
  const result = parseSatText(text);
  expect(result.errors.length).toBeGreaterThan(0);
  expect(() => appendSatImport(sections(), result, 'bad')).toThrow();
});

test('supports CRLF, uppercase headings, multiline prompts and choices, optional explanation', () => {
  const text = source.replace('[verbal module 1]', '[VERBAL MODULE 1]').replace('What is 2 + 3?', 'Read this passage.\nWhat is the answer?').replace('a. 4', 'A) First line\nSecond line').replaceAll('\nExplanation: Addition.', '').replaceAll('\n', '\r\n');
  const parsed = parseSatText(text);
  expect(parsed.errors).toEqual([]);
  expect(parsed.modules[0][0].prompt.text).toContain('\nWhat is the answer?');
  expect(parsed.modules[0][0].options.choices[0]).toBe('First line\nSecond line');
});

test('appends without mutating existing IDs, answers, or section metadata; new batches have unique IDs', () => {
  const result = parseSatText(source);
  const first = appendSatImport(sections(), result, 'one');
  const before = JSON.stringify(first);
  const second = appendSatImport(first, result, 'two');
  expect(JSON.stringify(first)).toBe(before);
  expect(second.map(s => s.questions.length)).toEqual([2,2,2,2]);
  expect(second[0].questions[0]).toEqual(first[0].questions[0]);
  expect(second[0].questions[1].order).toBe(1);
  expect(new Set(second.flatMap(s => s.questions.map(q => q.id))).size).toBe(8);
});

test('mixed open and multiple-choice questions preserve editable answer keys through serialization', () => {
  const text = source + '\n2. What is one half?\nType: SHORT_TEXT\nAnswer: 0.5 | 1/2\nExplanation: Equivalent values.';
  const result = parseSatText(text);
  expect(result.errors).toEqual([]);
  const payload = buildExamPayload('Mixed', 'SAT', '', null, appendSatImport(sections(), result, 'mixed'));
  expect(payload.sections[3].questions[1]).toMatchObject({ qtype: 'SHORT_TEXT', prompt: { text: 'What is one half?' }, answerKey: { answers: ['0.5', '1/2'] } });
  expect(payload.sections[3].questions[1].options).toBeUndefined();
});

test.each([
  'Type: SHORT_TEXT\nAnswer:',
  'Type: SHORT_TEXT\nAnswer: 5 |',
  'Type: SHORT_TEXT\na. Five\nAnswer: 5',
  'Type: ESSAY\nAnswer: 5',
])('invalid open question is blocked: %s', fields => {
  expect(parseSatText(source + '\n2. Question?\n' + fields).errors.length).toBeGreaterThan(0);
});
