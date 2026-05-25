type Props = {
  title: string;
  description?: string;
};

export default function PageHeader({ title, description }: Props) {
  return (
    <div className="mb-8 sm:mb-12">
      <h1 className="text-xl sm:text-2xl font-medium text-gray-900">{title}</h1>
      {description ? (
        <p className="text-gray-500 mt-1 text-sm sm:text-base">{description}</p>
      ) : null}
    </div>
  );
}
