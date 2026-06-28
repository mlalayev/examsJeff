import { Suspense } from "react";
import HomeworkBuilderPage from "@/components/dashboard/homework/HomeworkBuilderPage";

type Props = { params: Promise<{ category: string }> };

export default async function AdminHomeworkCreateCategoryPage(_props: Props) {
  return (
    <Suspense fallback={<div className="p-8 text-gray-600 text-sm">Loading...</div>}>
      <HomeworkBuilderPage role="admin" mode="create" />
    </Suspense>
  );
}
