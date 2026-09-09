export function Wordmark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const mark = size === 'sm' ? 'h-8' : 'h-[42px] w-[168px]';
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${mark} flex items-center justify-center font-display text-5xl font-[450] text-cream`}
        aria-hidden
      >
        K
      </div>
      <p className="font-display text-[28px] font-[450] text-cream">
        KITO <span className="text-secondary">Mastermind</span>
      </p>
    </div>
  );
}
