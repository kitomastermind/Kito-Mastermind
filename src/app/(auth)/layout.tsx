import { RingMotif } from '@/components/kito/RingMotif';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-primary text-cream">
      <RingMotif />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[420px] flex-col justify-center px-5 py-10">
        {children}
      </div>
    </div>
  );
}
