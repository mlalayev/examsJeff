/** @jest-environment jsdom */
import React, { act, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import SatTextImport from '@/components/admin/exams/create/SatTextImport';
import { SAT_IMPORT_MODULES } from './sat-text-import';

const source = SAT_IMPORT_MODULES.map(m => `[${m}]\n1. Question?\na. One\nb. Two\nc. Three\nd. Four\nAnswer: A`).join('\n');

let host: HTMLDivElement; let root: Root;
beforeEach(() => { (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
const button = (text: string) => Array.from(host.querySelectorAll('button')).find(b => b.textContent === text);
const click = async (text: string) => { await act(async () => button(text)!.click()); };

test('Save Questions validates directly and applies only once without a preview step', async () => {
  const onImport = jest.fn();
  function Harness() {
    const [text, setText] = useState(source);
    return <SatTextImport text={text} onTextChange={setText} onImport={onImport} disabled={false} />;
  }
  await act(async () => root.render(<Harness />));
  await click('Save Questions');
  await click('Save Questions');
  expect(onImport).toHaveBeenCalledTimes(1);
  expect(host.querySelector('textarea')!.value).toBe('');
  expect(button('Add validated questions to modules')).toBeUndefined();
});

test('Save Questions rejects malformed text without a partial import', async () => {
  const onImport = jest.fn();
  await act(async () => root.render(<SatTextImport text="bad text" onTextChange={jest.fn()} onImport={onImport} disabled={false} />));
  await click('Save Questions');
  expect(host.querySelector('[role="alert"]')!.textContent).toContain('heading');
  expect(button('Add validated questions to modules')).toBeUndefined();
  expect(onImport).not.toHaveBeenCalled();
});

test('saving disables import actions', async () => {
  await act(async () => root.render(<SatTextImport text={source} onTextChange={jest.fn()} onImport={jest.fn()} disabled />));
  expect(button('Validate and preview')!.disabled).toBe(true);
  expect(host.querySelector('textarea')!.disabled).toBe(true);
});

test('loads a complete text file and saves all modules', async () => {
  const onImport = jest.fn();
  function Harness() {
    const [text, setText] = useState('');
    return <SatTextImport text={text} onTextChange={setText} onImport={onImport} disabled={false} />;
  }
  await act(async () => root.render(<Harness />));
  const fileInput = host.querySelector('input[type="file"]')!;
  Object.defineProperty(fileInput, 'files', { value: [{ name: 'exam.txt', size: source.length, text: async () => source }] });
  await act(async () => fileInput.dispatchEvent(new Event('change', { bubbles: true })));
  expect(host.querySelector('textarea')!.value).toBe(source);
  await click('Save Questions');
  expect(onImport.mock.calls[0][0].modules.map((m: unknown[]) => m.length)).toEqual([1,1,1,1]);
});

test('invalid file keeps existing text', async () => {
  const onTextChange = jest.fn();
  await act(async () => root.render(<SatTextImport text={source} onTextChange={onTextChange} onImport={jest.fn()} disabled={false} />));
  const fileInput = host.querySelector('input[type="file"]')!;
  Object.defineProperty(fileInput, 'files', { value: [{ name: 'exam.pdf', size: 100 }] });
  await act(async () => fileInput.dispatchEvent(new Event('change', { bubbles: true })));
  expect(onTextChange).not.toHaveBeenCalled();
  expect(host.textContent).toContain('Choose a .txt file');
});

test('ZIP uses a single authenticated upload request and keeps returned image URLs in the draft text', async () => {
  const previousFetch = globalThis.fetch;
  const uploaded = source.replace('Question?', 'Question?\n[Image: /api/images/zip-question.png]');
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ text: uploaded, imageCount: 1 }) });
  globalThis.fetch = fetchMock;
  const onImport = jest.fn();
  function Harness() {
    const [text, setText] = useState('');
    return <SatTextImport text={text} onTextChange={setText} onImport={onImport} disabled={false} />;
  }
  try {
    await act(async () => root.render(<Harness />));
    const fileInput = host.querySelector('input[type="file"]')!;
    Object.defineProperty(fileInput, 'files', { value: [new File(['zip'], 'sat-exam.zip')] });
    await act(async () => fileInput.dispatchEvent(new Event('change', { bubbles: true })));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/admin/upload/sat-zip');
    expect(host.querySelector('textarea')!.value).toContain('/api/images/zip-question.png');
    await click('Save Questions');
    expect(onImport.mock.calls[0][0].modules[0][0].image).toBe('/api/images/zip-question.png');
  } finally { globalThis.fetch = previousFetch; }
});
