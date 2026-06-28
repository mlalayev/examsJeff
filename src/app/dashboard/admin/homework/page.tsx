"use client";

import { useState } from "react";
import PageHeader from "@/components/dashboard/student/PageHeader";
import HomeworkManagementList from "@/components/dashboard/homework/HomeworkManagementList";
import HomeworkTemplatesList from "@/components/dashboard/homework/HomeworkTemplatesList";

export default function AdminHomeworkPage() {
  const [tab, setTab] = useState<"templates" | "assignments">("templates");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Homework"
        description="Create homework with exam question types and assign to students."
      />

      <div className="inline-flex rounded-md border border-gray-200 bg-white p-0.5 mb-6">
        <button
          type="button"
          onClick={() => setTab("templates")}
          className={`px-3 py-1.5 text-sm font-medium rounded transition ${
            tab === "templates"
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Homework Bank
        </button>
        <button
          type="button"
          onClick={() => setTab("assignments")}
          className={`px-3 py-1.5 text-sm font-medium rounded transition ${
            tab === "assignments"
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Assignments
        </button>
      </div>

      {tab === "templates" ? (
        <HomeworkTemplatesList role="admin" />
      ) : (
        <HomeworkManagementList apiBase="/api/admin/homework" />
      )}
    </div>
  );
}
