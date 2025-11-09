'use client';

import Link from 'next/link';
import styles from './Hero.module.css';
import { ArrowRight, GraduationCap, Shield, BookOpenText, Headphones, PenTool, Mic2 } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      <div className={styles.bgDecor} />
      <div className="max-w-[1200px] mx-auto px-4 py-16 md:py-24 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
              Jeff.az - Your Complete Exam Preparation Portal
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl">
              Practice with real mock exams for IELTS, TOEFL, SAT, Duolingo, General English, and Math. Get instant results and detailed feedback.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard/student/exams" className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800">
                Start Practice
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard/teacher/classes" className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50">
                For Teachers
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Real exam timing</div>
              <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /> AI + Teacher feedback</div>
            </div>
          </div>
          <div className="lg:block hidden">
            <div className="relative rounded-2xl border border-gray-200 bg-white shadow-xl">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2 text-blue-600 font-medium"><BookOpenText className="w-4 h-4" /> Reading</div>
                    <div className="h-2 bg-gray-200 rounded">
                      <div className="h-2 bg-blue-500 rounded w-2/3" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2 text-purple-600 font-medium"><Headphones className="w-4 h-4" /> Listening</div>
                    <div className="h-2 bg-gray-200 rounded">
                      <div className="h-2 bg-purple-500 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2 text-green-600 font-medium"><PenTool className="w-4 h-4" /> Writing</div>
                    <div className="h-2 bg-gray-200 rounded">
                      <div className="h-2 bg-green-500 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2 text-orange-600 font-medium"><Mic2 className="w-4 h-4" /> Speaking</div>
                    <div className="h-2 bg-gray-200 rounded">
                      <div className="h-2 bg-orange-500 rounded w-2/5" />
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">Exam interface preview</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


