'use client';

import styles from './FAQ.module.css';

export default function FAQ() {
  const faqs = [
    { q: 'How are exams scored?', a: 'Reading/Listening are auto-scored. Writing/Speaking receive AI + teacher grading with detailed rubrics.' },
    { q: 'Do I get certificates?', a: 'Yes, monthly bundle includes completion certificates based on your performance.' },
    { q: 'Can teachers monitor my performance?', a: 'Teachers can manage classrooms, assign mocks, and view detailed reports.' },
  ];

  return (
    <section>
      <div className={styles.container}>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">FAQ</h2>
        <div className="mt-8 w-full space-y-4">
          {faqs.map((item, i) => (
            <details key={i} className="rounded-2xl border border-gray-200 bg-white p-5 group">
              <summary className="cursor-pointer list-none font-medium text-gray-900 flex items-center justify-between">
                {item.q}
                <span className="ml-4 text-gray-400 group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="mt-2 text-gray-600 text-sm">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}


