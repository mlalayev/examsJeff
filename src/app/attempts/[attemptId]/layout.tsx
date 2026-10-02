import { ExamSecurityGate } from '@/components/attempts/ExamSecurityGate';
export default function AttemptLayout({ children }: { children: React.ReactNode }) {
  return <ExamSecurityGate>{children}</ExamSecurityGate>;
}
