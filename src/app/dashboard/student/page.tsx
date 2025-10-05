"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { BookOpenText, Headphones, PenTool, Mic2, TrendingUp, Clock, Award, Calendar, CalendarClock } from "lucide-react";

interface Booking {
  id: string;
  startAt: string;
  status: string;
  sections: string[];
  exam: {
    id: string;
    title: string;
  };
  teacher: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export default function StudentDashboard() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/bookings?role=student");
      if (!response.ok) throw new Error("Failed to fetch bookings");
      const data = await response.json();
      setBookings(data.bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTimeBaku = (isoDate: string) => {
    const date = new Date(isoDate);
    // Format date in local timezone (Asia/Baku)
    return date.toLocaleString('en-US', {
      timeZone: 'Asia/Baku',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUpcoming = (startAt: string) => {
    return new Date(startAt) > new Date();
  };

  const upcomingBookings = bookings.filter(b => isUpcoming(b.startAt));
  const pastBookings = bookings.filter(b => !isUpcoming(b.startAt));

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

      {/* My Exams Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">My Scheduled Exams</h2>
        
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : upcomingBookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="inline-flex p-4 bg-gray-50 rounded-full mb-4">
              <CalendarClock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming exams</h3>
            <p className="text-gray-500">Your teacher will assign exams to you</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{booking.exam.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      By {booking.teacher?.name || booking.teacher?.email || "Teacher"}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {booking.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Calendar className="w-4 h-4" />
                  {formatDateTimeBaku(booking.startAt)}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {booking.sections.map((section) => (
                    <span
                      key={section}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
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
          <p className="text-3xl font-bold text-gray-900">{pastBookings.length}</p>
          <p className="text-sm text-gray-500 mt-1">
            {pastBookings.length === 0 ? "No tests completed yet" : "Completed exams"}
          </p>
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
