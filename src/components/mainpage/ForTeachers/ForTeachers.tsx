'use client';

import Link from 'next/link';
import { ArrowRight, Users, BookOpen, BarChart3, MessageSquare, GraduationCap } from 'lucide-react';

export default function ForTeachers() {
  const features = [
    { icon: Users, text: 'Manage classes and students' },
    { icon: BookOpen, text: 'Assign mock exams' },
    { icon: BarChart3, text: 'Track student progress' },
    { icon: MessageSquare, text: 'Provide detailed feedback' },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 md:p-12">
            {/* Left Side - Content */}
            <div className="flex flex-col justify-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-[#303380]/10 rounded-xl mb-6">
                <GraduationCap className="w-7 h-7 text-[#303380]" />
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                For Teachers
              </h3>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Empower your teaching with comprehensive tools to manage classes, assign exams, and track student progress.
              </p>

              {/* Features List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {features.map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-[#303380]" />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{feature.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* CTA Button */}
              <Link 
                href="/dashboard/teacher/classes" 
                className="inline-flex items-center justify-center gap-2 text-white px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 bg-gradient-to-r from-[#303380] to-[#252a6b] hover:from-[#252a6b] hover:to-[#1a1f4a] w-fit"
              >
                Access Teacher Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Right Side - Visual Element */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full h-full min-h-[300px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#303380]/10 to-[#252a6b]/5 rounded-2xl"></div>
                <div className="relative z-10 flex items-center justify-center h-full">
                  <div className="grid grid-cols-2 gap-4 p-8">
                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                      <Users className="w-8 h-8 text-[#303380] mb-3" />
                      <div className="text-2xl font-bold text-gray-900">Classes</div>
                      <div className="text-sm text-gray-500">Manage easily</div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                      <BarChart3 className="w-8 h-8 text-[#303380] mb-3" />
                      <div className="text-2xl font-bold text-gray-900">Analytics</div>
                      <div className="text-sm text-gray-500">Track progress</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
