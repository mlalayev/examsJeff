"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import GenericExamBuilder from "@/components/admin/exams/create/GenericExamBuilder";
import type { ExamCategory } from "@/components/admin/exams/create/types";
import { slugToCategory } from "@/lib/exam-category-utils";
import {
  getHomeworkDashboardBase,
  getHomeworkSaveConfig,
  type HomeworkDashboardRole,
} from "@/lib/homework-dashboard";

type Props = {
  role: HomeworkDashboardRole;
  mode: "create" | "edit";
};

export default function HomeworkBuilderPage({ role, mode }: Props) {
  const router = useRouter();
  const params = useParams();
  const categorySlug = params.category as string | undefined;
  const homeworkId = params.id as string | undefined;

  const [category, setCategory] = useState<ExamCategory | null>(null);
  const [initial, setInitial] = useState<Parameters<typeof GenericExamBuilder>[0]["initial"]>();
  const [loading, setLoading] = useState(mode === "edit");
  const base = getHomeworkDashboardBase(role);
  const saveConfig = getHomeworkSaveConfig(role);

  useEffect(() => {
    if (mode === "create") {
      if (!categorySlug) {
        router.push(`${base}/create`);
        return;
      }
      const resolved = slugToCategory(categorySlug);
      if (!resolved) {
        router.push(`${base}/create`);
        return;
      }
      setCategory(resolved);
      return;
    }

    if (!homeworkId) return;

    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/homework/templates/${homeworkId}`);
        if (!res.ok) throw new Error("Failed to load homework");
        const data = await res.json();
        if (!active) return;
        setCategory(data.exam.category as ExamCategory);
        setInitial(data.initial);
      } catch {
        if (active) router.push(base);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [mode, categorySlug, homeworkId, router, base]);

  if (mode === "edit" && loading) {
    return (
      <div className="p-8 text-gray-600 text-sm">Loading homework...</div>
    );
  }

  if (!category) {
    return (
      <div className="p-8 text-gray-600 text-sm">Loading...</div>
    );
  }

  return (
    <GenericExamBuilder
      mode={mode}
      category={category}
      examId={mode === "edit" ? homeworkId : undefined}
      initial={initial}
      saveConfig={{
        ...saveConfig,
        backHref: mode === "edit" ? base : `${base}/create`,
      }}
    />
  );
}
