type Student = { id:string; firstName:string|null; lastName:string|null; email:string };
export type SummaryLesson = { id:string; title:string; status:string; class:{name:string}|null; studentRecords:{student:Student}[] };
export function summarizeMonthlyLessons(lessons:SummaryLesson[]) {
  const subjects = new Map<string,Map<number,Map<string,{names:string[];count:number}>>>();
  let total=0, unrecorded=0;
  for(const lesson of lessons) {
    if(lesson.status==='CANCELLED') continue;
    if(!lesson.studentRecords.length){unrecorded++;continue;}
    const roster=[...new Map(lesson.studentRecords.map(r=>[r.student.id,r.student])).values()].sort((a,b)=>a.id.localeCompare(b.id));
    const subject=lesson.class?.name || lesson.title;
    if(!subjects.has(subject)) subjects.set(subject,new Map());
    const sizes=subjects.get(subject)!;
    if(!sizes.has(roster.length)) sizes.set(roster.length,new Map());
    const groups=sizes.get(roster.length)!;const key=JSON.stringify(roster.map(s=>s.id));
    if(!groups.has(key))groups.set(key,{names:roster.map(s=>[s.firstName,s.lastName].filter(Boolean).join(' ')||s.email),count:0});
    groups.get(key)!.count++;total++;
  }
  return {total,unrecorded,subjects:[...subjects].sort(([a],[b])=>a.localeCompare(b)).map(([subject,sizes])=>({subject,total:[...sizes.values()].reduce((n,g)=>n+[...g.values()].reduce((s,r)=>s+r.count,0),0),sizes:[...sizes].sort(([a],[b])=>a-b).map(([size,groups])=>({size,total:[...groups.values()].reduce((n,g)=>n+g.count,0),groups:[...groups.values()].sort((a,b)=>b.count-a.count||a.names.join().localeCompare(b.names.join()))}))}))};
}
