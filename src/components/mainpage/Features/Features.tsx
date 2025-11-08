'use client';

import styles from './Features.module.css';
import { Brain, Timer, LineChart, Users2, GraduationCap } from 'lucide-react';

export default function Features() {
  const features = [
    { icon: Timer, title: 'Multiple Exam Types', desc: 'IELTS, TOEFL, SAT, Duolingo, General English, Math' },
    { icon: Brain, title: 'Instant Auto-Scoring', desc: 'Get immediate results for objective questions' },
    { icon: LineChart, title: 'Progress Tracking', desc: 'Monitor your improvement over time' },
    { icon: Users2, title: 'Teacher Feedback', desc: 'Detailed feedback on writing and speaking tasks' },
    { icon: GraduationCap, title: 'Real Exam Conditions', desc: 'Practice under authentic test conditions' },
    { icon: Timer, title: 'Flexible Scheduling', desc: 'Take exams anytime, anywhere' },
  ];

  return (
    <section>
      <div className={styles.container}>
        <h2 className="text-xl sm:text-2xl font-medium text-gray-900 text-center mb-8 sm:mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-white border border-gray-200 rounded-md p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md">
                    <Icon className="w-4 h-4 text-gray-700" />
                  </div>
                  <span className="text-sm sm:text-base font-medium text-gray-900">{f.title}</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">{f.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


