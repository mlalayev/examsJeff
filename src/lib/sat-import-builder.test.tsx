/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import SatDigitalBuilder from '@/components/admin/exams/create/SatDigitalBuilder';
import { SAT_IMPORT_MODULES } from './sat-text-import';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }) }));
jest.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: { id: 'import-test' } }, status: 'authenticated' }) }));

let root: Root; let host: HTMLDivElement;
beforeEach(() => {
  localStorage.clear();
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(globalThis.crypto, 'randomUUID', { configurable: true, value: () => 'test-batch' });
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
const click = async (label: string) => {
  const button = Array.from(host.querySelectorAll('button')).find(b => b.textContent?.trim() === label);
  expect(button).toBeDefined();
  await act(async () => button!.click());
};

test('Add Question file import creates normal cards in all modules, supports edit and restores draft', async () => {
  await act(async () => root.render(<SatDigitalBuilder mode="create" />));
  await click('Add Question');
  await click('Import questions from text / .txt file');
  expect(host.querySelector('[role="dialog"]')).not.toBeNull();
  const source = SAT_IMPORT_MODULES.map((m, i) => `[${m}]\n1. MCQ for ${m}\na. A\nb. B\nc. C\nd. D\nAnswer: B\n2. Open for ${m}\nType: SHORT_TEXT\nAnswer: ${i + 1}`).join('\n');
  const file = host.querySelector('input[type="file"]')!;
  Object.defineProperty(file, 'files', { value: [{ name: 'all.txt', size: source.length, text: async () => source }] });
  await act(async () => file.dispatchEvent(new Event('change', { bubbles: true })));
  await click('Save Questions');
  expect(host.textContent).not.toContain('Save Questions');
  for (const [i, tab] of ['Verbal 1', 'Verbal 2', 'Math 1', 'Math 2'].entries()) {
    await click(tab);
    expect(host.textContent).toContain(`MCQ for ${SAT_IMPORT_MODULES[i]}`);
    expect(host.textContent).toContain(`Open for ${SAT_IMPORT_MODULES[i]}`);
    expect(host.textContent).toContain('Short Text Answer');
    expect(Array.from(host.querySelectorAll('button')).filter(b => b.textContent?.includes('Edit'))).toHaveLength(2);
  }
  const edits = Array.from(host.querySelectorAll('button')).filter(b => b.textContent?.trim() === 'Edit');
  await act(async () => edits[1].click());
  expect(Array.from(host.querySelectorAll('textarea')).map(t => t.value)).toContain('4');
  expect(host.textContent).toContain('Correct Answers');
  await act(async () => root.unmount()); root = createRoot(host);
  await act(async () => root.render(<SatDigitalBuilder mode="create" />));
  expect(host.textContent).toContain('Open for math module 2');
  const saved = JSON.parse(localStorage.getItem('exam-draft:v1:import-test:sat:create:new')!);
  expect(saved.data.sections.map((s: any) => s.questions.length)).toEqual([2,2,2,2]);
  await click('Save Question');
  const previousFetch = globalThis.fetch;
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ examId: 'local-mock-id' }) });
  globalThis.fetch = fetchMock;
  try {
    await click('Save Exam');
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/admin/exams');
    expect(payload.sections.map((s: any) => s.questions.length)).toEqual([2,2,2,2]);
    expect(payload.sections[3].questions[1].answerKey).toEqual({ answers: ['4'] });
    expect(localStorage.getItem('exam-draft:v1:import-test:sat:create:new')).toBeNull();
  } finally { globalThis.fetch = previousFetch; }
});
