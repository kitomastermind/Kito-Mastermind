import { cn } from '@/lib/utils';

export function Eyebrow({
  children,
  tone = 'secondary',
}: {
  children: React.ReactNode;
  tone?: 'secondary' | 'muted' | 'onDark';
}) {
  return (
    <p
      className={cn(
        'font-marketing text-[12px] font-semibold tracking-[0.16em] uppercase',
        tone === 'muted' && 'text-[#5A6B7D]',
        tone === 'secondary' && 'text-[#3B7A4E]',
        tone === 'onDark' && 'text-[#D3F36B]',
      )}
    >
      {children}
    </p>
  );
}
