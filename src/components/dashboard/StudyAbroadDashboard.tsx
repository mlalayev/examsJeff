"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { STUDY_ABROAD_LABEL } from "@/lib/portal-catalog";

const ACCENT = "#0f766e";

export default function StudyAbroadDashboard({
  studentsListHref,
}: {
  studentsListHref: string;
}) {
  return (
    <div className="max-w-[100vw] overflow-x-hidden p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
            <Link href={studentsListHref} className="hover:text-[#303380]">
              Students
            </Link>
            <span>/</span>
            <span className="font-medium text-gray-700">{STUDY_ABROAD_LABEL}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{STUDY_ABROAD_LABEL}</h1>
          <p className="mt-1 text-sm text-gray-600">
            Students and inquiries interested in studying abroad. Enrollment
            management for this track will be added here; CRM contacts can
            already be tagged with this interest.
          </p>
        </div>
        <div
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: ACCENT }}
        >
          <Globe className="h-4 w-4" />
          Foundation
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="py-16 text-center text-gray-500">
          <Globe className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="font-medium text-gray-700">No study abroad students yet</p>
          <p className="mt-1 text-sm">
            Tag CRM contacts with {STUDY_ABROAD_LABEL} when that is why they
            were contacted. Student records for this track will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
