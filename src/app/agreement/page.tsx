import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { SiteNav } from '@/components/marketing/SiteNav';
import { BRAND } from '@/lib/brand';

export default function AgreementPage() {
  return (
    <div className="kito-site min-h-dvh bg-[#F7F8F5]">
      <SiteNav />
      <main className="container max-w-2xl py-16">
        <BrandMark className="h-10 w-10" />
        <h1 className="mt-6 font-marketing text-4xl font-bold tracking-tight text-[#0E1F1A]">
          {BRAND.product} member agreement
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#5A6B60]">
          Version 2026-01. By accepting an invitation you agree that a client&apos;s name, phone, email and
          notes belong to the agent who logged the lead. You will not export, screenshot or reuse another
          member&apos;s client details obtained through a grant. Access is per lead, revocable, and never
          implied by role.
        </p>
        <Link href="/login" className="btn btn-dark mt-8">
          Enter chapter
          <span className="node" aria-hidden>
            →
          </span>
        </Link>
      </main>
    </div>
  );
}
