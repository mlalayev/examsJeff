'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

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
    <section className="py-16 md:py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">Frequently Asked Questions</h2>
        <p className="text-center text-gray-600 mb-12">Everything you need to know</p>
        
        <div className="space-y-4">
          {faqs.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div 
                key={i} 
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleAccordion(i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-base font-semibold text-gray-900 pr-4">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed">{item.a}</p>
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
