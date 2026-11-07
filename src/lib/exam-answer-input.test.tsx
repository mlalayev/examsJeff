/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { disableAnswerAssistance, examAnswerInputProps } from './exam-answer-input';
import { QOpenText } from '@/components/questions/QOpenText';

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });

test('writing textarea retains text and emits browser opt-out attributes', async () => {
  await act(async () => root.render(<textarea {...examAnswerInputProps} defaultValue="There is two cars." />));
  const field = host.querySelector('textarea')!;
  expect(field.value).toBe('There is two cars.');
  expect(field.getAttribute('spellcheck')).toBe('false');
  expect(field.getAttribute('writingsuggestions')).toBe('false');
  expect(field.getAttribute('autocorrect')).toBe('off');
  expect(field.getAttribute('autocomplete')).toBe('off');
});

test('open answer and inline gap fields disable assistance', async () => {
  for (const [qtype, text] of [['OPEN', 'Answer'], ['GAP', 'I ____ here.']]) {
    await act(async () => root.render(<QOpenText question={{ id: 'q', qtype, prompt: { text } } as any} value="live" readOnly={false} onChange={() => {}} />));
    const field = host.querySelector('input')!;
    expect(field.value).toBe('live');
    expect(field.getAttribute('spellcheck')).toBe('false');
    expect(field.getAttribute('writingsuggestions')).toBe('false');
  }
});

test('imported HTML opt-ins are overridden without altering answers', () => {
  const doc = document.implementation.createHTMLDocument();
  doc.body.innerHTML = '<textarea spellcheck="true" writingsuggestions="true">My answer</textarea><input value="answer"><div contenteditable="true">text</div>';
  disableAnswerAssistance(doc);
  doc.querySelectorAll('input, textarea, [contenteditable]').forEach(field => {
    expect(field.getAttribute('spellcheck')).toBe('false');
    expect(field.getAttribute('writingsuggestions')).toBe('false');
  });
  expect(doc.querySelector('textarea')!.value).toBe('My answer');
  expect(doc.querySelector('input')!.value).toBe('answer');
});
