"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { BookOpenText, Headphones, PenTool, Mic2, TrendingUp, Clock, Award } from "lucide-react";

export default function StudentDashboard() {
  const { data: session } = useSession();

  const sections = [
    { icon: BookOpenText, name: "Reading", href: "/reading", color: "blue" },
    { icon: Headphones, name: "Listening", href: "/listening", color: "purple" },
    { icon: PenTool, name: "Writing", href: "/writing", color: "green" },
    { icon: Mic2, name: "Speaking", href: "/speaking", color: "orange" },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">Ready to practice today?</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Tests Taken</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-sm text-gray-500 mt-1">No tests completed yet</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Average Score</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">-</p>
          <p className="text-sm text-gray-500 mt-1">Complete a test to see your score</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Study Time</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">0h</p>
          <p className="text-sm text-gray-500 mt-1">Start practicing to track time</p>
        </div>
      </div>

      {/* Practice Sections */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Practice Sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.name}
                href={section.href}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition group"
              >
                <div className={`inline-flex p-3 bg-${section.color}-50 rounded-lg mb-3`}>
                  <Icon className={`w-6 h-6 text-${section.color}-600`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{section.name}</h3>
                <p className="text-sm text-gray-500">Start practicing</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Exam Types */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Select Exam Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/ielts"
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:shadow-xl transition"
          >
            <h3 className="text-2xl font-bold mb-2">IELTS</h3>
            <p className="text-blue-100">International English Language Testing System</p>
          </Link>
          
          <Link
            href="/toefl"
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white hover:shadow-xl transition"
          >
            <h3 className="text-2xl font-bold mb-2">TOEFL</h3>
            <p className="text-purple-100">Test of English as a Foreign Language</p>
          </Link>
          
          <Link
            href="/sat"
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white hover:shadow-xl transition"
          >
            <h3 className="text-2xl font-bold mb-2">SAT</h3>
            <p className="text-green-100">Scholastic Assessment Test</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

