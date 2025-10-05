'use client';

import styles from './Testimonials.module.css';
import { CheckCircle2 } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    { name: 'Aylin', text: 'Band 6.0 → 7.0 in 6 weeks with daily mocks.' },
    { name: 'Murad', text: 'SAT 1210 → 1410 after structured practice.' },
    { name: 'Leyla', text: 'TOEFL 85 → 103 thanks to AI feedback.' },
  ];

  return (
    <section>
      <div className={styles.container}>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">Success Stories</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="w-4 h-4" /> Verified</div>
              <p className="mt-3 text-gray-700">"{t.text}"</p>
              <div className="mt-3 text-sm text-gray-500">— {t.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


