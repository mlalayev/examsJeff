'use client';

import styles from './Testimonials.module.css';

export default function Testimonials() {
  const testimonials = [
    { name: 'Aylin', text: 'Band 6.0 → 7.0 in 6 weeks with daily mocks.' },
    { name: 'Murad', text: 'SAT 1210 → 1410 after structured practice.' },
    { name: 'Leyla', text: 'TOEFL 85 → 103 thanks to AI feedback.' },
  ];

  return (
    <section>
      <div className={styles.container}>
        <h2 className="text-xl sm:text-2xl font-medium text-gray-900 text-center mb-8 sm:mb-12">Success Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-md p-4 sm:p-6">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">"{t.text}"</p>
              <div className="text-xs sm:text-sm text-gray-500 font-medium">— {t.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


