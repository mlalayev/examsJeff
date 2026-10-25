/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import GenericExamBuilder from '@/components/admin/exams/create/GenericExamBuilder';
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }) }));
jest.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: { id: 'general-test' } }, status: 'authenticated' }) }));
let host: HTMLDivElement; let root: Root;
const oldFetch = globalThis.fetch;
const source = '[section: READING]\n[passage]\nAnna likes parks.\n[/passage]\n1. What does Anna like?\nType: SHORT_TEXT\nAnswer: parks';
beforeEach(() => {
  localStorage.clear(); (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(crypto,'randomUUID',{configurable:true,value:()=> 'batch'});
  host=document.createElement('div'); document.body.append(host); root=createRoot(host);
});
afterEach(async()=>{ await act(async()=>root.unmount());host.remove();globalThis.fetch=oldFetch; });
const click=async(label:string)=>{const b=Array.from(host.querySelectorAll('button')).find(b=>b.textContent?.trim()===label)!;expect(b).toBeDefined();await act(async()=>b.click());};
const mount=async()=>{await act(async()=>root.render(<GenericExamBuilder mode="create" category="GENERAL_ENGLISH" initial={{title:'General test',track:'',durationMin:null,sections:[]}}/>));};
const upload=async(text:string)=>{const el=host.querySelector('input[type="file"]')!;Object.defineProperty(el,'files',{configurable:true,value:[{name:'questions.txt',size:text.length,text:async()=>text}]});await act(async()=>el.dispatchEvent(new Event('change',{bubbles:true})));};
test('type selection excludes HTML/CSS',async()=>{
  await mount();await click('Import questions from text / .txt');
  const fields = Array.from(host.querySelectorAll('fieldset')).map(f=>f.textContent).join(' ');
  expect(fields).not.toContain('HTML/CSS');
});
test('valid file creates sections and preserves unsaved data until successful server save',async()=>{
  await mount();await click('Import questions from text / .txt');await upload(source);await click('Save Questions');
  const key='exam-draft:v1:general-test:generic:exams:GENERAL_ENGLISH:create:new';
  expect(JSON.parse(localStorage.getItem(key)!).data.sections[0].questions).toHaveLength(1);
  await act(async()=>root.unmount());root=createRoot(host);await mount();
  const fetchMock=jest.fn().mockResolvedValueOnce({ok:false,json:async()=>({error:'Offline'})}).mockResolvedValueOnce({ok:true,json:async()=>({examId:'new-id'})});globalThis.fetch=fetchMock;
  await click('Save Exam');expect(localStorage.getItem(key)).not.toBeNull();
  // Dismiss save error before retrying.
  const close=Array.from(host.querySelectorAll('button')).find(b=>b.textContent?.trim()==='OK' || b.textContent?.trim()==='Close');
  if(close)await act(async()=>close.click());
  await click('Save Exam');
  const payload=JSON.parse(fetchMock.mock.calls[1][1].body);
  expect(payload.category).toBe('GENERAL_ENGLISH');
  expect(JSON.parse(payload.sections[0].instruction).passage).toContain('Anna likes parks.');
  expect(payload.sections[0].questions[0].answerKey).toEqual({answers:['parks']});
  expect(localStorage.getItem(key)).toBeNull();
});
test('bad file leaves imported text and existing exam unchanged',async()=>{
  await mount();await click('Import questions from text / .txt');await upload(source.replace('Type: SHORT_TEXT','Type: HTML_CSS'));await click('Save Questions');
  expect(host.querySelector('[role="alert"]')?.textContent).toContain('Unsupported');
  expect(host.querySelector<HTMLTextAreaElement>('textarea')?.value).toContain('HTML_CSS');
  expect(JSON.parse(localStorage.getItem('exam-draft:v1:general-test:generic:exams:GENERAL_ENGLISH:create:new')!).data.sections).toEqual([]);
});
