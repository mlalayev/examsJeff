"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import GenericExamBuilder from "@/components/admin/exams/create/GenericExamBuilder";
import type { ExamCategory } from "@/components/admin/exams/create/types";
import { slugToCategory } from "@/lib/exam-category-utils";

export default function CreateExamPage() {
  const router = useRouter();
  const params = useParams();
  const categorySlug = params.category as string;

  const [category, setCategory] = useState<ExamCategory | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const resolvedCategory = slugToCategory(categorySlug);
    if (!resolvedCategory) {
      router.push("/dashboard/admin/exams/create");
      return;
    }
    setCategory(resolvedCategory);
    setResolved(true);
  }, [categorySlug, router]);

  if (!resolved || !category) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return <GenericExamBuilder mode="create" category={category} />;
}
