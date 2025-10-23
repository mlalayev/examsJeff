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
      {/* Hero */}
      <Hero />

      {/* Exam Selector */}
      <ExamSelector />
      <HowItWorks />
      <Features />
      <ForTeachers />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  );
}
