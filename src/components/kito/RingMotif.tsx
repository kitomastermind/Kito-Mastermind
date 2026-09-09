export function RingMotif() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -right-16 -bottom-16 size-[620px] rounded-full border border-secondary/15" />
      <div className="absolute -right-4 bottom-10 size-[446px] rounded-full border border-secondary/10 opacity-70" />
      <div className="absolute -left-10 -top-10 size-[260px] rounded-full border border-secondary/10" />
    </div>
  );
}
