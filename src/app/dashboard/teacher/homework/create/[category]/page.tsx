import { Suspense } from "react";
import HomeworkBuilderPage from "@/components/dashboard/homework/HomeworkBuilderPage";

type Props = { params: Promise<{ category: string }> };

export default async function TeacherHomeworkCreateCategoryPage(_props: Props) {
  return (
    <Suspense fallback={<div className="p-8 text-gray-600 text-sm">Loading...</div>}>
      <HomeworkBuilderPage role="teacher" mode="create" />
    </Suspense>
  );
}
