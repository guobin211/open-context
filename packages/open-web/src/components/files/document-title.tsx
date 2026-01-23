interface DocumentTitleProps {
  title: string;
}

export function DocumentTitle({ title }: DocumentTitleProps) {
  return (
    <h1 className="mb-6 text-3xl font-bold text-gray-900" style={{ fontFamily: 'PingFang SC, sans-serif' }}>
      {title}
    </h1>
  );
}
