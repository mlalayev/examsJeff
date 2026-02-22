'use client';

import Link from 'next/link';
import { BookOpen, ArrowRight, ExternalLink } from 'lucide-react';

export default function ExamSelector() {
  const exams = [
    { name: 'IELTS', badge: '4 sections', desc: 'IELTS — 4 sections, automatic evaluation', tryLink: '/reading', learnLink: '/reading' },
    { name: 'TOEFL', badge: '4 sections', desc: 'TOEFL — 4 sections, automatic evaluation', tryLink: '/toefl', learnLink: '/toefl' },
    { name: 'SAT', badge: 'Math + Reading', desc: 'SAT — Math and Reading sections with real-time timer', tryLink: '/sat', learnLink: '/sat' },
    { name: 'Duolingo', badge: 'Adaptive', desc: 'Duolingo English Test — adaptive format with all question types', tryLink: '/duolingo', learnLink: '/duolingo' },
    { name: 'General English', badge: 'A1-C2', desc: 'General English — Unit-based exams from A1 to C2 levels', tryLink: '/dashboard/catalog', learnLink: '/dashboard/catalog', tryText: 'Browse Units' },
    { name: 'Math', badge: 'Algebra + Geometry', desc: 'Math — Algebra, Geometry, and advanced mathematics topics', tryLink: '/math', learnLink: '/math' },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Choose Your Exam</h2>
          <p className="text-gray-600 text-lg">Practice with real mock exams for all major standardized tests</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam, i) => (
            <div 
              key={i} 
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-[#303380]/30 transition-all duration-200 group flex flex-col min-h-[200px]"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#303380]/10 to-[#252a6b]/5 rounded-lg flex items-center justify-center group-hover:from-[#303380]/20 group-hover:to-[#252a6b]/10 transition-all duration-200">
                    <BookOpen className="w-5 h-5 text-[#303380]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{exam.name}</h3>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-medium text-gray-700">
                  {exam.badge}
                </div>
              </div>
              
              {/* Description */}
              <p className="text-sm text-gray-600 mb-6 leading-relaxed flex-1">
                {exam.desc}
              </p>
              
              {/* Buttons - aligned at bottom, same width */}
              <div className="flex gap-2 mt-auto">
                <Link 
                  href={exam.tryLink} 
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#303380] to-[#252a6b] text-white rounded-lg text-sm font-semibold hover:from-[#252a6b] hover:to-[#1a1f4a] transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 group/btn"
                >
                  {exam.tryText || 'Try Now'}
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href={exam.learnLink} 
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Learn More
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
