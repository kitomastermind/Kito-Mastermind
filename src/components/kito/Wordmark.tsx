import { BrandWordmark } from '@/components/brand/BrandMark';
import { BRAND } from '@/lib/brand';

export function Wordmark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <div className="flex flex-col items-center gap-2 text-[#9BA63E]">
      <BrandWordmark className={size === 'sm' ? 'h-8 w-auto' : 'h-12 w-auto'} />
      <p className="text-center text-xs font-medium tracking-[0.14em] text-[#9BA63E]">{BRAND.tagline}</p>
    </div>
  );
}
