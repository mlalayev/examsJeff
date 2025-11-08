'use client';

import Link from 'next/link';
import styles from './ExamSelector.module.css';

export default function ExamSelector() {
  const exams = [
    { name: 'IELTS', badge: '4 sections', desc: 'IELTS — 4 bölmə, avtomatik qiymətləndirmə', tryLink: '/reading', learnLink: '/reading' },
    { name: 'TOEFL', badge: '4 sections', desc: 'TOEFL — 4 bölmə, avtomatik qiymətləndirmə', tryLink: '/toefl', learnLink: '/toefl' },
    { name: 'SAT', badge: 'Math + Reading', desc: 'SAT — Math and Reading sections with real-time timer', tryLink: '/sat', learnLink: '/sat' },
    { name: 'Duolingo', badge: 'Adaptive', desc: 'Duolingo English Test — adaptive format with all question types', tryLink: '/duolingo', learnLink: '/duolingo' },
    { name: 'General English', badge: 'A1-C2', desc: 'General English — Unit-based exams from A1 to C2 levels', tryLink: '/dashboard/catalog', learnLink: '/dashboard/catalog', tryText: 'Browse Units' },
    { name: 'Math', badge: 'Algebra + Geometry', desc: 'Math — Algebra, Geometry, and advanced mathematics topics', tryLink: '/math', learnLink: '/math' },
  ];

  return (
    <section className={styles.wrapper}>
      <h2 className="text-xl sm:text-2xl font-medium text-gray-900 text-center mb-2">Choose Your Exam</h2>
      <p className="text-gray-500 text-center text-sm sm:text-base mb-8 sm:mb-12">Practice with real mock exams for all major standardized tests</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {exams.map((exam, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-md p-4 sm:p-6 hover:border-gray-300 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="text-base sm:text-lg font-medium text-gray-900">{exam.name}</div>
              <div className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700">{exam.badge}</div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">{exam.desc}</p>
            <div className="flex flex-wrap gap-2">
              <Link 
                href={exam.tryLink} 
                className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-xs sm:text-sm font-medium hover:bg-gray-800 transition"
              >
                {exam.tryText || 'Try Now'}
              </Link>
              <Link 
                href={exam.learnLink} 
                className="px-3 py-1.5 border border-gray-200 rounded-md text-xs sm:text-sm font-medium hover:bg-gray-50 transition"
              >
                Learn More
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


