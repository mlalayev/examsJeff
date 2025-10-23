'use client';

import Link from 'next/link';
import styles from './ExamSelector.module.css';

export default function ExamSelector() {
  return (
    <section className={styles.wrapper}>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">Choose Your Exam</h2>
      <p className="text-gray-600 text-center mt-2">Practice with real mock exams for all major standardized tests</p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-gray-900">IELTS</div>
            <div className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">4 sections</div>
          </div>
          <p className="mt-2 text-gray-600">IELTS — 4 bölmə, avtomatik qiymətləndirmə</p>
          <div className="mt-4 flex gap-3">
            <Link href="/reading" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Try Now</Link>
            <Link href="/reading" className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Learn More</Link>
          </div>
        </div>
        <div className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-gray-900">TOEFL</div>
            <div className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">4 sections</div>
          </div>
          <p className="mt-2 text-gray-600">TOEFL — 4 bölmə, avtomatik qiymətləndirmə</p>
          <div className="mt-4 flex gap-3">
            <Link href="/toefl" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">Try Now</Link>
            <Link href="/toefl" className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Learn More</Link>
          </div>
        </div>
        <div className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-gray-900">SAT</div>
            <div className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">Math + Reading</div>
          </div>
          <p className="mt-2 text-gray-600">SAT — Math and Reading sections with real-time timer</p>
          <div className="mt-4 flex gap-3">
            <Link href="/sat" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">Try Now</Link>
            <Link href="/sat" className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Learn More</Link>
          </div>
        </div>
        <div className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-gray-900">Duolingo</div>
            <div className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">Adaptive</div>
          </div>
          <p className="mt-2 text-gray-600">Duolingo English Test — adaptive format with all question types</p>
          <div className="mt-4 flex gap-3">
            <Link href="/duolingo" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Try Now</Link>
            <Link href="/duolingo" className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Learn More</Link>
          </div>
        </div>
        <div className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-gray-900">General English</div>
            <div className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">A1-C2</div>
          </div>
          <p className="mt-2 text-gray-600">General English — Unit-based exams from A1 to C2 levels</p>
          <div className="mt-4 flex gap-3">
            <Link href="/dashboard/catalog" className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">Browse Units</Link>
            <Link href="/dashboard/catalog" className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Learn More</Link>
          </div>
        </div>
        <div className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-gray-900">Math</div>
            <div className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">Algebra + Geometry</div>
          </div>
          <p className="mt-2 text-gray-600">Math — Algebra, Geometry, and advanced mathematics topics</p>
          <div className="mt-4 flex gap-3">
            <Link href="/math" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Try Now</Link>
            <Link href="/math" className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Learn More</Link>
          </div>
        </div>
      </div>
    </section>
  );
}


