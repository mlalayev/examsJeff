import { ExamSecurityGate } from '@/components/attempts/ExamSecurityGate';
import { ExamNotice } from '@/components/attempts/ExamNotice';
export default function AttemptLayout({ children }: { children: React.ReactNode }) {
  return <><ExamNotice /><ExamSecurityGate>{children}</ExamSecurityGate></>;
}
