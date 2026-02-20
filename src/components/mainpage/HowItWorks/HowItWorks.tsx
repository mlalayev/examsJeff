'use client';

import { Search, Play, CheckCircle2, BarChart3 } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    { 
      num: 1, 
      icon: Search,
      title: 'Choose your exam', 
      desc: 'IELTS, TOEFL, SAT, Duolingo, General English, Math' 
    },
    { 
      num: 2, 
      icon: Play,
      title: 'Start practice', 
      desc: 'Take assigned exams or browse available tests' 
    },
    { 
      num: 3, 
      icon: CheckCircle2,
      title: 'Complete the test', 
      desc: 'Real exam environment with timer & autosave' 
    },
    { 
      num: 4, 
      icon: BarChart3,
      title: 'Review results', 
      desc: 'Instant scoring + detailed feedback and explanations' 
    },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">How It Works</h2>
          <p className="text-gray-600 text-lg">Get started in 4 simple steps</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-[#303380]/30">
                {/* Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-[#303380]/10 to-[#252a6b]/5 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#303380]" />
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
