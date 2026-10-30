/** @jest-environment jsdom */
import { groupCategoryExams, type ExamListItem } from '@/components/dashboard/ExamGroupedList';
const exam = (id: string, track: string | null, title: string): ExamListItem => ({id,track,title,category:'GENERAL_ENGLISH',isActive:true,createdAt:'',_count:{sections:1,questions:1}});
test('groups English levels in order and sorts unit numbers naturally without losing exams',()=>{
 const input=[exam('1','B1','Unit 1'),exam('2','A1','Unit 10'),exam('3','A2','Unit 2'),exam('4',' a1 ','Unit 2'),exam('5','B1+','Unit 1'),exam('6',null,'Other')];
 const groups=groupCategoryExams('GENERAL_ENGLISH',input);
 expect(groups.map(g=>g.label)).toEqual(['General English - A1','General English - A2','General English - B1','General English - B1+','General English - Level not set']);
 expect(groups[0].exams.map(e=>e.id)).toEqual(['4','2']);
 expect(groups.flatMap(g=>g.exams)).toHaveLength(6);
 expect(input[0].id).toBe('1');
});
test('other exam categories retain their original list',()=>{
 const input=[exam('1',null,'SAT')];
 expect(groupCategoryExams('SAT',input)).toEqual([{key:'SAT',label:'SAT',exams:input}]);
});
