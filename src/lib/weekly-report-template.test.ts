import { attendanceSummary, formatWeeklyReport, generateWeeklyReports, type WeeklyReportStudent } from './weekly-report-ai';
const create = jest.fn();
jest.mock('@/lib/openai-client',()=>({getOpenAI:()=>({chat:{completions:{create:(...args:any[])=>create(...args)}}})}));
const period = {start:'2026-10-18',end:'2026-10-25'};
const student: WeeklyReportStudent = {studentId:'s',name:'Nuray',lessonsHeld:3,lessonsAttended:2,hadAbsence:true,lateCount:1,lateMinutesTotal:12,topics:['Past Simple'],homeworkSummary:'2 dərs üzrə tam, 1 dərs üzrə qismən',teacherNotes:['Feilləri təkrar etsin.'],behaviorNotes:[],performances:['yaxşı']};
const report = {studentId:'s',topics:'Dərslərdə Past Simple mövzusu işlənmişdir.',homework:'Nuray tapşırıqları iki dərsdə tam, bir dərsdə qismən yerinə yetirib.',participation:'Suallara yaxşı cavab verib.',notes:'Feillərin təkrarı faydalı olar.'};
const respond = (reports: unknown) => create.mockResolvedValue({choices:[{message:{content:JSON.stringify({reports})}}]});
beforeEach(()=>create.mockReset());
test('formats heading, greeting and signature',()=>{
 const text=formatWeeklyReport('Nuray','SAT Verbal',period,'Report body.');
 expect(text).toContain('Nuray — SAT Verbal\n19.10.2026 – 24.10.2026');
 expect(text).toContain('Hörmətli valideyn,\n\nReport body.');
 expect(text.endsWith('Hörmətlə,\nJEFF Colleges')).toBe(true);
});
test('produces requested sections with exact attendance and individual notes',async()=>{
 respond([report]);
 const [result]=await generateWeeklyReports('ENGLISH','A1',[student],period);
 expect(result.text).toContain('3 dərsdən 2 dərsdə iştirak edib, 1 dərsi buraxıb.');
 expect(result.text).toContain('1 dərsə gecikib; ümumi gecikmə 12 dəqiqə olub.');
 expect(result.text).toContain(`${report.topics}\n${report.homework}\n${report.participation}\n\nƏlavə qeydlər: ${report.notes}`);
 expect(result.text).not.toMatch(/\[.*\]/);
});
test('uses actual lesson count and keeps excused absence separate',()=>{
 const text=attendanceSummary({...student,lessonsHeld:5,lessonsAttended:3,lessonsExcused:1,lateCount:0});
 expect(text).toContain('5 dərsdən 3 dərsdə iştirak edib, 1 dərsi buraxıb, 1 dərsdə üzrlü səbəbdən iştirak etməyib.');
 expect(text).not.toContain('gecik');
});
test('maps separate personalized reports by ID even when AI reverses their order',async()=>{
 respond([{...report,studentId:'other',homework:'Əli ev tapşırıqlarını yerinə yetirməyib.',notes:'Əliyə əlavə praktika tövsiyə olunur.'}, report]);
 const result=await generateWeeklyReports('ENGLISH','A1',[student,{...student,studentId:'other',name:'Əli',lessonsAttended:3,lateCount:0,homeworkSummary:'yerinə yetirilməyib'}],period);
 expect(result[0].studentId).toBe('s');
 expect(result[0].text).toContain('Nuray');
 expect(result[0].text).not.toContain('Əliyə');
 expect(result[1].text).toContain('3 dərsdən 3 dərsdə iştirak edib.');
 expect(result[1].text).toContain('Əliyə əlavə praktika');
});
test.each([
 [{...report,studentId:'wrong'}],
 [],
 [{studentId:'s',text:'Old format'}],
 [report, report],
].map(reports => [reports]))('rejects incomplete, mismatched or duplicate output',async reports=>{
 respond(reports);
 await expect(generateWeeklyReports('MATH','Math',[student],period)).rejects.toThrow();
});
test('does not accept an identical body for two students',async()=>{
 respond([report,{...report,studentId:'other'}]);
 await expect(generateWeeklyReports('ENGLISH','A1',[student,{...student,studentId:'other',name:'Əli'}],period)).rejects.toThrow('identical');
});
test('empty input does not call AI',async()=>{
 expect(await generateWeeklyReports('ENGLISH','A1',[],period)).toEqual([]);
 expect(create).not.toHaveBeenCalled();
});
