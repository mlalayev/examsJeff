"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Brain,
  Timer,
  LineChart,
  Users2,
  GraduationCap,
  Shield,
  BookOpenText,
  Headphones,
  PenTool,
  Mic2,
} from "lucide-react";
import Hero from "@/components/mainpage/Hero/Hero";
import ExamSelector from "@/components/mainpage/ExamSelector/ExamSelector";
import HowItWorks from "@/components/mainpage/HowItWorks/HowItWorks";
import Features from "@/components/mainpage/Features/Features";
import ForTeachers from "@/components/mainpage/ForTeachers/ForTeachers";
import Testimonials from "@/components/mainpage/Testimonials/Testimonials";
import FAQ from "@/components/mainpage/FAQ/FAQ";
import Footer from "@/components/mainpage/Footer/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero - Odd (gradient) */}
      <Hero />

      {/* Exam Selector - Even (white) */}
      <div className="bg-white">
        <ExamSelector />
      </div>

      {/* HowItWorks - Odd (gradient) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
        <HowItWorks />
      </div>

      {/* Features - Even (white) */}
      <div className="bg-white">
        <Features />
      </div>

      {/* ForTeachers - Odd (gradient) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
        <ForTeachers />
      </div>

      {/* Testimonials - Even (white) */}
      <div className="bg-white">
        <Testimonials />
      </div>

      {/* FAQ - Odd (gradient) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
        <FAQ />
      </div>

      {/* Footer - Even (white) */}
      <Footer />
    </div>
  );
}
