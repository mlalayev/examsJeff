import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/SessionProvider'
import ConditionalNavbar from '@/components/ConditionalNavbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JEFF Exams Portal - IELTS, TOEFL & SAT Mock Exams',
  description: 'Practice IELTS, TOEFL and SAT with AI-powered feedback and teacher grading',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <ConditionalNavbar />
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}