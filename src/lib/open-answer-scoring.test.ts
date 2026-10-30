import { scoreQuestion } from './scoring';
test.each([[2,'2'],['2',2],[{'0':2},'2'],[0,'0'],['0',0],['  SCHOOL. ','school'],['new\u00a0 york','New York'],['don\u2019t',"don't"],['caf\u0065\u0301','caf\u00e9']])('accepts equivalent open answers %p / %p', (actual,expected)=>{
 expect(scoreQuestion('SHORT_TEXT',actual,{answers:[expected]})).toBe(1);
});
test.each([['-2','2'],['1/2','12'],['2.5','25'],['',''],[null,0],[false,'false'],['is not',"isn't"],['cat','cats']])('rejects genuinely different or blank answers %p / %p',(actual,expected)=>{
 expect(scoreQuestion('SHORT_TEXT',actual,{answers:[expected]})).toBe(0);
});
test('alternate answers, numeric gaps and empty keys are handled',()=>{
 expect(scoreQuestion('SHORT_TEXT','blue',{answers:['red','blue']})).toBe(1);
 expect(scoreQuestion('FILL_IN_BLANK',{'0':2,'1':' School '},{blanks:['2','school']})).toBe(1);
 expect(scoreQuestion('DND_GAP',{'0':[0]},{blanks:['0']})).toBe(1);
 expect(scoreQuestion('DND_GAP',{},{})).toBe(0);
 expect(scoreQuestion('SHORT_TEXT','2',{answers:2})).toBe(0);
});
