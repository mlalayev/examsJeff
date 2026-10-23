/** @jest-environment jsdom */
import React, { act, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useExamDraft } from '@/hooks/useExamDraft';
jest.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: { id: 'admin' } }, status: 'authenticated' }) }));
const key = 'exam-draft:v1:admin:sat:create:new';
let root: Root; let host: HTMLDivElement; let api: any;
function Editor({ scope = 'sat:create:new' }: { scope?: string }) {
  const [value, setValue] = useState({ title: 'Empty', sections: [], editingQuestion: null as any });
  const draft = useExamDraft(scope, value, setValue);
  api = { draft, setValue, value };
  return <>{draft.notice}<span>{value.title}</span></>;
}
beforeEach(() => { localStorage.clear(); (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); jest.restoreAllMocks(); });
const mount = async (scope?: string) => { await act(async () => root.render(<Editor scope={scope} />)); };
test('restores sections and open question before default state can overwrite draft', async () => {
  const data = { title: 'Recovered', sections: [{ id: 's', questions: [{ id: 'q', prompt: { text: 'Question' }, image: '/api/images/a.png' }] }], editingQuestion: { id: 'draft', prompt: { text: 'Unfinished' } } };
  localStorage.setItem(key, JSON.stringify({ version: 1, data })); await mount();
  expect(api.value).toEqual(data); expect(JSON.parse(localStorage.getItem(key)!).data).toEqual(data);
});
test('changes persist and successful save clears without pagehide resurrecting draft', async () => {
  await mount(); await act(async () => api.setValue({ ...api.value, title: 'New' }));
  expect(JSON.parse(localStorage.getItem(key)!).data.title).toBe('New');
  await act(async () => api.draft.clear());
  await act(async () => window.dispatchEvent(new Event('pagehide')));
  expect(localStorage.getItem(key)).toBeNull();
});
test('without success acknowledgement draft survives unmount and refresh', async () => {
  await mount(); await act(async () => api.setValue({ ...api.value, title: 'Not saved to server' }));
  await act(async () => root.unmount()); root = createRoot(host); await mount();
  expect(api.value.title).toBe('Not saved to server');
});
test('different exams do not restore each other', async () => {
  localStorage.setItem(key, JSON.stringify({ version: 1, data: { title: 'Other', sections: [], editingQuestion: null } }));
  await mount('sat:edit:exam2'); expect(api.value.title).toBe('Empty');
});
test('corrupt draft is retained and warning is visible', async () => {
  localStorage.setItem(key, 'invalid'); await mount();
  expect(localStorage.getItem(key)).toBe('invalid'); expect(host.textContent).toContain('Draft oxuna bilmədi');
});
test('quota failure is visible rather than reporting successful persistence', async () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota'); });
  await mount(); await act(async () => api.setValue({ ...api.value, title: 'Changed' }));
  expect(host.textContent).toContain('Draft saxlanmadı');
});
test('another tab draft is neither overwritten nor cleared', async () => {
  await mount(); localStorage.setItem(key, 'other-tab');
  await act(async () => api.setValue({ ...api.value, title: 'Local' }));
  expect(host.textContent).toContain('başqa tabda');
  await act(async () => api.draft.clear()); expect(localStorage.getItem(key)).toBe('other-tab');
});
test('save response does not delete edits made after request began', async () => {
  await mount(); const acknowledge = api.draft.clear;
  await act(async () => api.setValue({ ...api.value, title: 'Newer edit' }));
  await act(async () => acknowledge());
  expect(JSON.parse(localStorage.getItem(key)!).data.title).toBe('Newer edit');
});
