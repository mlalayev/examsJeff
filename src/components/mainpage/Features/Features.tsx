'use client';

import styles from './Features.module.css';
import { Brain, Timer, LineChart, Users2, GraduationCap } from 'lucide-react';

export default function Features() {
  const features = [
    { icon: <Timer className="w-5 h-5 text-blue-600" />, title: 'Auto-Scoring', desc: 'Reading/Listening automatic scoring' },
    { icon: <Timer className="w-5 h-5 text-indigo-600" />, title: 'Real-time Timer & Autosave', desc: 'Never lose progress' },
    { icon: <Brain className="w-5 h-5 text-purple-600" />, title: 'AI + Teacher Grading', desc: 'Writing/Speaking dual review' },
    { icon: <LineChart className="w-5 h-5 text-emerald-600" />, title: 'Progress & Analytics', desc: 'Track band/score growth' },
    { icon: <Users2 className="w-5 h-5 text-orange-600" />, title: 'Multi-Exam Dashboard', desc: 'One place for all exams' },
    { icon: <GraduationCap className="w-5 h-5 text-rose-600" />, title: 'Teacher Classrooms', desc: 'Assign mocks, export reports' },
  ];

  return (
    <section>
      <div className={styles.container}>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">Features</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2">{f.icon}<span className="font-semibold text-gray-900">{f.title}</span></div>
              <div className="mt-2 text-gray-600 text-sm">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


