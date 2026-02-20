'use client';

import { Quote, Star } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    { 
      name: 'Aylin', 
      text: 'Band 6.0 → 7.0 in 6 weeks with daily mocks.',
      improvement: '+1.0',
      exam: 'IELTS'
    },
    { 
      name: 'Murad', 
      text: 'SAT 1210 → 1410 after structured practice.',
      improvement: '+200',
      exam: 'SAT'
    },
    { 
      name: 'Leyla', 
      text: 'TOEFL 85 → 103 thanks to AI feedback.',
      improvement: '+18',
      exam: 'TOEFL'
    },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Success Stories</h2>
          <p className="text-gray-600 text-lg">Real results from real students</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div 
              key={i} 
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden"
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 opacity-10">
                <Quote className="w-12 h-12 text-[#303380]" />
              </div>
              
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              {/* Testimonial Text */}
              <p className="text-gray-700 leading-relaxed mb-6 relative z-10">
                "{t.text}"
              </p>
              
              {/* Author and Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.exam} Student</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#303380]">{t.improvement}</div>
                  <div className="text-xs text-gray-500">Improvement</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
