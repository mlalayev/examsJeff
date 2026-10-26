// Run on the production server. Password is read from stdin, never logged or stored reversibly.
require('@next/env').loadEnvConfig(process.cwd());
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const db = new PrismaClient();
async function main() {
 const [oldEmail,newEmail] = process.argv.slice(2).map(s=>s.toLowerCase().trim());
 if(!oldEmail || !newEmail || oldEmail===newEmail) throw new Error('Provide distinct old and new email addresses');
 let password='';for await(const chunk of process.stdin) password+=chunk;
 password=password.replace(/\r?\n$/, '');
 if(password.length<12) throw new Error('Password must contain at least 12 characters');
 const hash=await bcrypt.hash(password,12);
 await db.$transaction(async tx=>{
  const old=await tx.user.findUnique({where:{email:oldEmail}});
  if(!old || old.role!=='CREATOR') throw new Error('Expected old creator not found; no changes made');
  if(await tx.user.findUnique({where:{email:newEmail}})) throw new Error('New email already exists; no changes made');
  // Preserve the internal ID so exams, audit history and other records are not deleted.
  const updated=await tx.user.update({where:{id:old.id},data:{email:newEmail,firstName:'Murad',lastName:'Lalayev',passwordHash:hash,passwordEncrypted:null,approved:true}});
  if(!await bcrypt.compare(password,updated.passwordHash)) throw new Error('Password verification failed');
  await tx.session.deleteMany({where:{userId:old.id}});
 });
 password='';console.log('Creator login replaced. Old email no longer exists. Related data preserved.');
}
main().catch(()=>{console.error('Creator rotation failed. Check emails and database connection; no credentials printed.');process.exitCode=1;}).finally(()=>db.$disconnect());
