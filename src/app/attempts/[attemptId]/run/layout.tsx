import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Exam in Progress - JEFF Exams Portal',
  description: 'Complete your exam with AI-powered assessment',
  other: {
    'permissions-policy': 'camera=(), microphone=(self), geolocation=()',
  },
}

export default function ExamRunLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
