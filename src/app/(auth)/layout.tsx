import { AUTH_SHADE, BRAND } from '@/lib/brand';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-[#0E1F1A]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND.photos.auth}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
      />
      <div className="absolute inset-0" style={{ background: AUTH_SHADE }} aria-hidden />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl items-center px-5 py-10">
        {children}
      </div>
    </div>
  );
}
