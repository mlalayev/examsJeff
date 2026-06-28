import HomeworkBuilderPage from "@/components/dashboard/homework/HomeworkBuilderPage";

type Props = { params: Promise<{ category: string }> };

export default async function AdminHomeworkCreateCategoryPage(_props: Props) {
  return <HomeworkBuilderPage role="admin" mode="create" />;
}
