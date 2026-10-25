/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import Workspace, { weekDates, dayKey } from '@/components/teacher/ScheduleWorkspace';
let root: Root; let host: HTMLDivElement; let props: any;
const originalFetch = globalThis.fetch;
beforeEach(() => {
  jest.useFakeTimers(); jest.setSystemTime(new Date(2026,9,24,12));
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.fetch = jest.fn().mockResolvedValue({ok:true,json:async()=>({lessons:[]})});
  host=document.createElement('div'); document.body.appendChild(host); root=createRoot(host);
  props={ data:{year:2026,month:10,oddDays:[{}],evenDays:[],lessons:[{id:'l',title:'SAT',date:'2026-10-24T00:00:00Z',timeSlot:'10:00 - 11:00',status:'SCHEDULED',class:{name:'SAT',_count:{classStudents:2}}}]},loading:false,error:null,toast:null,applying:false,clearing:false,onNavigate:jest.fn(),onDay:jest.fn(),onSchedule:jest.fn(),onApply:jest.fn(),onClear:jest.fn(),onReport:jest.fn() };
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();jest.useRealTimers();globalThis.fetch=originalFetch;});
const mount=async()=>{await act(async()=>root.render(<Workspace {...props}/>));};
const click=async(text:string)=>{const b=Array.from(host.querySelectorAll('button')).find(b=>b.textContent===text || b.getAttribute('aria-label')===text);expect(b).toBeDefined();await act(async()=>b!.click());};
test('weekly default, monthly toggle and lesson selection preserve real dates',async()=>{
  await mount();expect(host.textContent).toContain('1 lessons this week');
  expect(host.textContent).toContain('2 students');
  const card=Array.from(host.querySelectorAll('button')).find(b=>b.textContent?.includes('2 students'))!;
  await act(async()=>card.click());expect(dayKey(props.onDay.mock.calls[0][0])).toBe('2026-10-24');
  await click('month');expect(host.textContent).toContain('October 2026');
  expect(host.textContent).not.toContain('Monthly report');
});
test('destructive action hidden in more menu and apply remains separate',async()=>{
  await mount();expect(host.textContent).not.toContain('Clear month & feedback');
  await click('More schedule actions');await click('Clear month & feedback');expect(props.onClear).toHaveBeenCalledTimes(1);
  await click('Apply to Oct');expect(props.onApply).toHaveBeenCalledTimes(1);
});
test('lesson card opens feedback directly when a lesson handler is provided',async()=>{
  props.onLesson=jest.fn(); await mount();
  const card=Array.from(host.querySelectorAll('button')).find(b=>b.textContent?.includes('2 students'))!;
  await act(async()=>card.click());
  expect(props.onDay).not.toHaveBeenCalled();
  expect(props.onLesson.mock.calls[0][1].id).toBe('l');
  expect(dayKey(props.onLesson.mock.calls[0][0])).toBe('2026-10-24');
});
test('empty state offers setup and hides apply until templates exist',async()=>{
  props.data={...props.data,oddDays:[],lessons:[]};await mount();
  expect(host.textContent).toContain('Build your teaching routine');expect(host.textContent).not.toContain('Apply to Oct');
  await click('Manage schedule');expect(props.onSchedule).toHaveBeenCalledTimes(1);
});
test('reports require explicit click and use Sunday to Saturday',async()=>{
  await mount();expect(props.onReport).not.toHaveBeenCalled();await click('Reports');
  expect(host.textContent).toContain('Week containing');await click('Open weekly reports');
  expect(dayKey(props.onReport.mock.calls[0][0])).toBe('2026-10-18');
});
test('weekly navigation loads adjacent month when crossing boundary',async()=>{
  jest.setSystemTime(new Date(2026,9,1,12));
  await mount();expect(globalThis.fetch).toHaveBeenCalledWith('/api/teacher/schedule/month?year=2026&month=9',expect.anything());
  await click('Next week');expect(dayKey(props.onNavigate.mock.calls[0][0])).toBe('2026-10-08');
});
test('year boundary and leap day produce seven consecutive dates',()=>{
  expect(weekDates(new Date(2027,0,1)).map(dayKey)).toEqual(['2026-12-27','2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02']);
  expect(weekDates(new Date(2028,1,29)).map(dayKey)).toContain('2028-02-29');
});
