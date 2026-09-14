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
        tone === 'secondary' && 'text-[#204559]',
        tone === 'onDark' && 'text-[#9BA63E]',
      )}
    >
      {children}
    </p>
  );
}
