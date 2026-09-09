import { Eyebrow } from '@/components/kito/Eyebrow';

export function PageHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="font-display text-3xl font-[450] text-primary">{title}</h1>
      </div>
      {right}
    </div>
  );
}
