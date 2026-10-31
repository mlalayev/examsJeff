import { enrollStudent, teacherAssignmentsSchema } from './student-enrollment';
import { classExamCategories } from './teacher-exam-scope';
jest.mock('./prisma',()=>({prisma:{}}));

function transaction() {
  return {user:{count:jest.fn().mockResolvedValue(2)},class:{upsert:jest.fn()},classStudent:{create:jest.fn()},classMonthlyPayment:{create:jest.fn()}};
}
const rows=[
  {teacherId:'fidan',subjects:['SAT_VERBAL','SAT_MATH'],monthlyFee:700},
  {teacherId:'murad',subjects:['IELTS'],monthlyFee:300}
];
test('each teacher gets one roster link and one unpaid charge for their whole package',async()=>{
  const tx=transaction();
  await enrollStudent(tx as any,'student','STUDENT','branch',teacherAssignmentsSchema.parse(rows),'2026-10-20');
  expect(tx.user.count).toHaveBeenCalledWith({where:{id:{in:['fidan','murad']},role:'TEACHER',approved:true,branchId:'branch'}});
  const classes=tx.class.upsert.mock.calls.map(([arg])=>arg.create);
  expect(classes.map(c=>classExamCategories(c.name))).toEqual([['SAT'],['IELTS']]);
  expect(tx.classStudent.create.mock.calls.map(([arg])=>arg.data)).toEqual(classes.map((c,i)=>({classId:c.id,studentId:'student',monthlyFee:rows[i].monthlyFee,paymentDueDay:20})));
  expect(tx.classMonthlyPayment.create.mock.calls.map(([arg])=>[arg.data.teacherId,arg.data.expected,arg.data.paid])).toEqual([['fidan',700,0],['murad',300,0]]);
});
test('teacher selection is optional',async()=>{
  const tx=transaction();
  await enrollStudent(tx as any,'student','STUDENT','branch',teacherAssignmentsSchema.parse(undefined));
  expect(tx.user.count).not.toHaveBeenCalled();expect(tx.classStudent.create).not.toHaveBeenCalled();
});
test('rejects duplicate teachers, invalid fees and teachers outside the branch',async()=>{
  expect(teacherAssignmentsSchema.safeParse([rows[0],rows[0]]).success).toBe(false);
  expect(teacherAssignmentsSchema.safeParse([{...rows[0],monthlyFee:-5}]).success).toBe(false);
  const tx=transaction();tx.user.count.mockResolvedValue(1);
  await expect(enrollStudent(tx as any,'student','STUDENT','branch',rows)).rejects.toThrow('approved teachers');
  expect(tx.classStudent.create).not.toHaveBeenCalled();
});
