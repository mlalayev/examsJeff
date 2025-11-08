'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './FAQ.module.css';

export default function FAQ() {
  const faqs = [
    { q: 'How are exams scored?', a: 'Reading/Listening are auto-scored. Writing/Speaking receive AI + teacher grading with detailed rubrics.' },
    { q: 'Do I get certificates?', a: 'Yes, monthly bundle includes completion certificates based on your performance.' },
    { q: 'Can teachers monitor my performance?', a: 'Teachers can manage classrooms, assign mocks, and view detailed reports.' },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section>
      <div className={styles.container}>
        <h2 className="text-xl sm:text-2xl font-medium text-gray-900 text-center mb-8 sm:mb-12">FAQ</h2>
        <div className="w-full space-y-3">
          {faqs.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <button
                  onClick={() => toggleAccordion(i)}
                  className="w-full cursor-pointer list-none bg-white px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm sm:text-base font-medium text-gray-900 pr-4 text-left">{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


