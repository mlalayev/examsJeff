import { summarizeMonthlyLessons, SummaryLesson } from './monthly-lesson-summary';
const student=(id:string)=>({id,firstName:id,lastName:'Test',email:`${id}@example.com`});
const lesson=(id:string,ids:string[],subject='IELTS'):SummaryLesson=>({id,title:subject,class:{name:subject},status:'SCHEDULED',studentRecords:ids.map(id=>({student:student(id)}))});
test('groups identical rosters irrespective of order and separates different sizes',()=>{
 const result=summarizeMonthlyLessons([lesson('1',['a','b']),lesson('2',['b','a']),lesson('3',['a','b','c']),lesson('4',['d','e'])]);
 expect(result.total).toBe(4);expect(result.subjects[0].sizes.map(g=>[g.size,g.total])).toEqual([[2,3],[3,1]]);
 expect(result.subjects[0].sizes[0].groups.map(g=>g.count)).toEqual([2,1]);
});
test('does not count cancelled or unrecorded lessons as held',()=>{
 const result=summarizeMonthlyLessons([{...lesson('1',['a']),status:'CANCELLED'},lesson('2',[]),lesson('3',['a'],'Math')]);
 expect(result.total).toBe(1);expect(result.unrecorded).toBe(1);expect(result.subjects[0].subject).toBe('Math');
});
test('uses student IDs, not display names, to distinguish groups',()=>{
 const a=lesson('1',['a']);const b=lesson('2',['b']);b.studentRecords[0].student.firstName='a';
 expect(summarizeMonthlyLessons([a,b]).subjects[0].sizes[0].groups).toHaveLength(2);
});
