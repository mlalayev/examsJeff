'use client';

import styles from './HowItWorks.module.css';

export default function HowItWorks() {
  const steps = [
    { num: 1, title: 'Choose your exam', desc: 'IELTS, TOEFL, SAT, Duolingo, General English, Math' },
    { num: 2, title: 'Start practice', desc: 'Take assigned exams or browse available tests' },
    { num: 3, title: 'Complete the test', desc: 'Real exam environment with timer & autosave' },
    { num: 4, title: 'Review results', desc: 'Instant scoring + detailed feedback and explanations' },
  ];

  return (
    <section>
      <div className={styles.container}>
        <h2 className="text-xl sm:text-2xl font-medium text-gray-900 text-center mb-8 sm:mb-12">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {steps.map((item, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-md p-4 sm:p-6">
              <div className="w-8 h-8 flex items-center justify-center text-white rounded-md text-sm font-medium mb-3" style={{ backgroundColor: "#303380" }}>
                {item.num}
              </div>
              <div className="text-sm sm:text-base font-medium text-gray-900 mb-2">{item.title}</div>
              <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


