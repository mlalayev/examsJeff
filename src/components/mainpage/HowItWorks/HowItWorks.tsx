'use client';

import styles from './HowItWorks.module.css';

export default function HowItWorks() {
  const steps = [
    { step: '1️⃣', title: 'Choose your exam', desc: 'IELTS, TOEFL, SAT — more coming soon' },
    { step: '2️⃣', title: 'Set your schedule', desc: 'Pick date/time and exam sections' },
    { step: '3️⃣', title: 'Take the test', desc: 'Real exam environment with timer & autosave' },
    { step: '4️⃣', title: 'Get feedback & improve', desc: 'Instant scoring + teacher feedback' },
  ];

  return (
    <section className="bg-gray-50">
      <div className={styles.container}>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">How It Works</h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((item, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="text-2xl">{item.step}</div>
              <div className="mt-3 font-semibold text-gray-900">{item.title}</div>
              <div className="mt-1 text-gray-600 text-sm">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


