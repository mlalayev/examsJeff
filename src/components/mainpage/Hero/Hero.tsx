'use client';

import Link from 'next/link';
import styles from './Hero.module.css';
import { ArrowRight, GraduationCap, Shield, BookOpenText, Headphones, PenTool, Mic2 } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className={styles.bgDecor} />
      <div className="max-w-[1200px] mx-auto px-4 py-16 md:py-24 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              Jeff.az — Your Complete Exam Preparation Portal
            </h1>
            <p className="mt-4 text-gray-600 max-w-lg">
              Practice with real mock exams for IELTS, TOEFL, SAT, Duolingo, General English, and Math. Instant results and detailed feedback.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                href="/dashboard/student/exams"
                className="inline-flex items-center gap-2 bg-[#303380] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#252a6b] transition-colors"
              >
                Start Practice
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard/teacher/classes"
                className="inline-flex items-center gap-2 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                For Teachers
              </Link>
            </div>
            <div className="mt-6 flex gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Real exam timing
              </span>
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" /> AI + Teacher feedback
              </span>
            </div>
          </div>

          {/* Right: Simple browser mockup */}
          <div className="lg:block hidden w-full">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden min-h-[280px] w-full max-w-[500px] ml-auto">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2 text-blue-600 text-sm font-medium">
                      <BookOpenText className="w-4 h-4" /> Reading
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className="h-full bg-blue-500 rounded-full w-2/3" />
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2 text-purple-600 text-sm font-medium">
                      <Headphones className="w-4 h-4" /> Listening
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className="h-full bg-purple-500 rounded-full w-1/2" />
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2 text-green-600 text-sm font-medium">
                      <PenTool className="w-4 h-4" /> Writing
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className="h-full bg-green-500 rounded-full w-1/3" />
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2 text-orange-600 text-sm font-medium">
                      <Mic2 className="w-4 h-4" /> Speaking
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className="h-full bg-orange-500 rounded-full w-2/5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
