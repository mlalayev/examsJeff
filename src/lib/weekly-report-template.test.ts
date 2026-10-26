import { formatWeeklyReport, generateWeeklyReports } from './weekly-report-ai';
const create = jest.fn();
jest.mock('@/lib/openai-client',()=>({getOpenAI:()=>({chat:{completions:{create:(...args:any[])=>create(...args)}}})}));
test('formats the requested Monday-Saturday heading and signature',()=>{
 const text=formatWeeklyReport('Nuray','SAT Verbal',{start:'2026-10-18',end:'2026-10-25'},'Report body.');
 expect(text).toContain('Nuray — SAT Verbal\n19.10.2026 – 24.10.2026');
 expect(text).toContain('Hörmətli valideyn,\n\nReport body.');
 expect(text.endsWith('Hörmətlə,\nJEFF Colleges')).toBe(true);
});
test('rejects mismatched student IDs instead of assigning another student report',async()=>{
 create.mockResolvedValue({choices:[{message:{content:JSON.stringify({reports:[{studentId:'wrong',text:'Other student'}]})}}]});
 const result=await generateWeeklyReports('MATH','SAT Math',[{studentId:'s',name:'Milada',lessonsHeld:3,lessonsAttended:3,hadAbsence:false,lateCount:0,lateMinutesTotal:0,topics:[],homeworkSummary:'',teacherNotes:[],behaviorNotes:[],performances:[]}],{start:'2026-10-18',end:'2026-10-25'});
 expect(result).toEqual([]);
});
