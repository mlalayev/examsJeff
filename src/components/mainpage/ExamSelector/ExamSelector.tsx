'use client';

import Link from 'next/link';
import styles from './ExamSelector.module.css';

export default function ExamSelector() {
  return (
    <section className={styles.wrapper}>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">Choose Your Exam</h2>
      <p className="text-gray-600 text-center mt-2">Modular design — easily extend with GMAT, GRE, and more</p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <p className="mt-2 text-gray-600">SAT — bölmələr, real vaxt taymer və nəticələr</p>
          <div className="mt-4 flex gap-3">
            <Link href="/sat" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">Try Now</Link>
            <Link href="/sat" className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Learn More</Link>
          </div>
        </div>
      </div>
    </section>
  );
}


