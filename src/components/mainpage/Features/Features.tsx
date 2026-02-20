'use client';

import { Brain, Timer, LineChart, Users2, GraduationCap, Calendar } from 'lucide-react';

export default function Features() {
  const features = [
    { icon: GraduationCap, title: 'Multiple Exam Types', desc: 'IELTS, TOEFL, SAT, Duolingo, General English, Math' },
    { icon: Brain, title: 'Instant Auto-Scoring', desc: 'Get immediate results for objective questions' },
    { icon: LineChart, title: 'Progress Tracking', desc: 'Monitor your improvement over time' },
    { icon: Users2, title: 'Teacher Feedback', desc: 'Detailed feedback on writing and speaking tasks' },
    { icon: Timer, title: 'Real Exam Conditions', desc: 'Practice under authentic test conditions' },
    { icon: Calendar, title: 'Flexible Scheduling', desc: 'Take exams anytime, anywhere' },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Features</h2>
          <p className="text-gray-600 text-lg">Everything you need to succeed</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div 
                key={i} 
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-[#303380]/30 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#303380]/10 to-[#252a6b]/5 rounded-xl flex items-center justify-center mb-4 group-hover:from-[#303380]/20 group-hover:to-[#252a6b]/10 transition-all duration-200">
                  <Icon className="w-6 h-6 text-[#303380]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
