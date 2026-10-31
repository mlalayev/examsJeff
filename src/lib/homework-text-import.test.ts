import { parseHomeworkText } from './homework-text-import';
import { GET } from '@/app/api/attempts/[attemptId]/results/route';
import { prisma } from './prisma';
import { requireAuth } from './auth-utils';
jest.mock('./prisma', () => ({ prisma: {attempt:{findUnique:jest.fn()},exam:{findFirst:jest.fn()},attemptAnswer:{findMany:jest.fn()},examIntegrity:{findUnique:jest.fn()}} }));
jest.mock('./auth-utils', () => ({requireAuth:jest.fn()}));
jest.mock('./coins', () => ({getAttemptCoinReward:jest.fn()}));
const db = prisma as any;
const question='1. What is 1+1?\nType: SHORT_TEXT\nAnswer: 2';
test.each(['GENERAL_ENGLISH','TOEFL','IELTS','KIDS','SAT','MATH'] as const)('imports explained questions for %s', category => {
  const heading=['SAT','MATH'].includes(category)?'[math module 1]':'[grammar]';
  expect(parseHomeworkText(heading+'\n'+question,category).errors.join(' ')).toContain('Explanation');
  const result=parseHomeworkText(heading+'\n'+question+'\nExplanation: Adding one to one gives two.',category);
  expect(result.errors).toEqual([]);
  expect(result.sections[0].questions[0].explanation).toContain('gives two');
});
beforeEach(()=>{jest.clearAllMocks();(requireAuth as jest.Mock).mockResolvedValue({id:'s',role:'STUDENT'});});
const get=()=>GET({} as any,{params:Promise.resolve({attemptId:'a'})});
test.each([['IN_PROGRESS','s'],['SUBMITTED','other']])('hides homework keys for %s / %s',async(status,studentId)=>{
 db.attempt.findUnique.mockResolvedValue({assignmentId:'asg',studentId,status});
 expect((await get()).status).toBe(403);
 expect(db.exam.findFirst).not.toHaveBeenCalled();
});
test('owner gets correct, incorrect and manual feedback after submission',async()=>{
 db.attempt.findUnique.mockResolvedValue({id:'a',assignmentId:'asg',studentId:'s',examId:'e',status:'SUBMITTED',sections:[]});
 db.exam.findFirst.mockResolvedValue({title:'Practice',category:'GENERAL_ENGLISH',sections:[{id:'sec',title:'Practice',questions:[
 {id:'q1',qtype:'SHORT_TEXT',answerKey:{answers:['2']},explanation:'One plus one is two.'},
 {id:'q2',qtype:'SHORT_TEXT',answerKey:{answers:['four']},explanation:'Double two.'},
 {id:'q3',qtype:'ESSAY',explanation:'Use supporting details.'}]}]});
 db.attemptAnswer.findMany.mockResolvedValue([{questionId:'q1',answer:2},{questionId:'q2',answer:'three'}]);
 const res=await get();expect(res.status).toBe(200);
 const questions=(await res.json()).homeworkReview[0].questions;
 expect(questions.map((q:any)=>q.correct)).toEqual([true,false,null]);
 expect(questions[0].explanation).toBe('One plus one is two.');
});
