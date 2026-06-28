import HomeworkBuilderPage from "@/components/dashboard/homework/HomeworkBuilderPage";

type Props = { params: Promise<{ category: string }> };

export default async function TeacherHomeworkCreateCategoryPage(_props: Props) {
  return <HomeworkBuilderPage role="teacher" mode="create" />;
}
