'use client';

import Link from 'next/link';
import styles from './ForTeachers.module.css';
import { ArrowRight } from 'lucide-react';

export default function ForTeachers() {
  return (
    <section>
      <div className={styles.container}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">For Teachers</h3>
            <p className="mt-3 text-gray-700">Create classes, assign exams, track student progress, and provide detailed feedback.</p>
          </div>
          <div className="md:text-right">
            <Link href="/dashboard/teacher/classes" className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-black">
              Teacher Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}


