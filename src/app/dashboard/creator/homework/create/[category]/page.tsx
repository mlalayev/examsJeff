import HomeworkBuilderPage from "@/components/dashboard/homework/HomeworkBuilderPage";

type Props = { params: Promise<{ category: string }> };

export default async function CreatorHomeworkCreateCategoryPage(_props: Props) {
  return <HomeworkBuilderPage role="creator" mode="create" />;
}
