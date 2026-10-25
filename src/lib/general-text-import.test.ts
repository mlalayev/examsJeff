import { parseGeneralText, appendGeneralImport } from './general-text-import';
import { buildExamPayload } from '@/components/admin/exams/create/examSerializer';
import { scoreQuestion } from './scoring';
import { readFileSync } from 'fs';
import { join } from 'path';

test('downloadable example contains all five valid sections', () => {
  const result = parseGeneralText(readFileSync(join(process.cwd(), 'examples/general-english-import.txt'), 'utf8'));
  expect(result.errors).toEqual([]);
  expect(result.sections).toHaveLength(5);
});

const source = `[section: GRAMMAR]
Title: Grammar
1. Choose the correct word.
Type: MCQ_SINGLE
a. is
b. are
Answer: A
2. Choose two verbs.
Type: MCQ_MULTI
a. run
b. blue
c. walk
Answer: A, C
3. Water is wet.
Type: TF
Answer: TRUE
4. The author is famous.
Type: TF_NG
Answer: NOT GIVEN
5. Name a colour.
Type: SHORT_TEXT
Answer: red | blue
6. She [input] a book and [input] happy.
Type: FILL_IN_BLANK
Answer: has | is
7. Choose the verb.
Type: INLINE_SELECT
a. read
b. green
Answer: A
8. Put the words in order.
Type: ORDER_SENTENCE
Tokens: am | I | happy
Answer: 2, 1, 3
9. I ___ a book.
Type: DND_GAP
Bank: have | green
Answer: have
[section: READING]
Title: The park
Duration: 15
[passage]
1. Anna went to the park.
She travelled by bus.
[/passage]
1. How did she travel?
Type: SHORT_TEXT
Answer: bus | by bus
[section: LISTENING]
1. Where are the speakers?
Type: SHORT_TEXT
Answer: school
[section: WRITING]
1. Write 100 words about your town.
Explain what you enjoy there.
Type: ESSAY`;

test('all ten types map to normal editable questions; passages and metadata survive serialization', () => {
  const result = parseGeneralText(source); expect(result.errors).toEqual([]);
  const sections = appendGeneralImport([], result, 'test');
  const payload = buildExamPayload('General English', 'GENERAL_ENGLISH', '', null, sections);
  expect(payload.category).toBe('GENERAL_ENGLISH');
  expect(payload.sections.map(s => s.questions.length)).toEqual([9,1,1,1]);
  expect(JSON.parse(payload.sections[1].instruction).passage).toContain('1. Anna went');
  expect(payload.sections[1].durationMin).toBe(15);
  expect(payload.sections[3].questions[0].answerKey).toBeNull();
  expect(result.warnings).toHaveLength(2);
  const qs = sections[0].questions;
  for (const [i, answer] of [[0,0],[1,[0,2]],[2,true],[3,'NOT GIVEN'],[4,'blue'],[5,{'0':'has','1':'is'}],[6,0],[7,[1,0,2]],[8,{'0':['have']}]] as [number,any][]) {
    expect(scoreQuestion(qs[i].qtype, answer, qs[i].answerKey)).toBe(1);
  }
  expect(scoreQuestion('FILL_IN_BLANK', {'0':'has'}, qs[5].answerKey)).toBe(0);
  expect(scoreQuestion('FILL_IN_BLANK', {'0':'wrong','1':'is'}, qs[5].answerKey)).toBe(0);
});
test.each([
  source.replace('Answer: A\n','Answer: Z\n'),
  source.replace('Type: MCQ_SINGLE','Type: HTML_CSS'),
  source.replace('Type: MCQ_SINGLE','Type: ESSAY'),
  source.replace('Answer: has | is','Answer: has'),
  source.replace('Answer: 2, 1, 3','Answer: 1, 1, 3'),
  source.replace('[/passage]',''),
  source.replace('[section: LISTENING]','[section: READING]'),
  source.replace('Type: ESSAY','Type: MCQ_SINGLE'),
  source.replace('Answer: A\n','Answer: A\nAnswer: B\n'),
])('invalid input is rejected atomically', text => {
  const result = parseGeneralText(text); expect(result.errors.length).toBeGreaterThan(0);
  expect(() => appendGeneralImport([], result, 'bad')).toThrow();
});
test('selection restrictions, duplicate sections and existing exams are protected', () => {
  expect(parseGeneralText(source, ['SHORT_TEXT']).errors.length).toBeGreaterThan(0);
  expect(parseGeneralText(source, undefined, ['READING']).errors.length).toBeGreaterThan(0);
  const result = parseGeneralText(source); const existing = appendGeneralImport([],result,'first');
  const snapshot = JSON.stringify(existing);
  const next = appendGeneralImport(existing,result,'second');
  expect(next[0].questions).toHaveLength(18);
  expect(new Set(next[0].questions.map(q => q.id)).size).toBe(18);
  expect(next[0].id).toBe(existing[0].id);
  expect(() => appendGeneralImport(existing,parseGeneralText(source.replace('Anna went','Bob went')),'bad')).toThrow('passage differs');
  expect(JSON.stringify(existing)).toBe(snapshot);
});
