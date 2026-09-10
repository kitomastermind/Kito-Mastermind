import { BrandMark } from '@/components/brand/BrandMark';
import { BRAND } from '@/lib/brand';

export function Wordmark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <BrandMark className={size === 'sm' ? 'h-8 w-8' : 'h-12 w-12'} />
      <p className="font-marketing text-[28px] font-bold tracking-[-0.03em] text-[#F3FAF5]">
        {BRAND.name} <span className="text-[#D3F36B]">Mastermind</span>
      </p>
    </div>
  );
}
