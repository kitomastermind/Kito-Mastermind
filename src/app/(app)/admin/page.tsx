import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/kito/PageHeader';
import { requireActor } from '@/server/supabase/server';

const LINKS = [
  { href: '/admin/members', label: 'Members' },
  { href: '/admin/sessions', label: 'Sessions' },
  { href: '/admin/topics', label: 'Topics' },
  { href: '/admin/pairings', label: 'Pairings' },
  { href: '/admin/payments', label: 'Payments' },
  { href: '/admin/audit', label: 'Audit' },
] as const;

export default async function AdminPage() {
  const actor = await requireActor();
  if (actor.role !== 'ADMIN' && actor.role !== 'CHAPTER_LEAD') {
    redirect('/dashboard');
  }
  return (
    <>
      <PageHeader eyebrow="Administration" title="Chapter admin" />
      <ul className="grid gap-3 md:grid-cols-2">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="flex min-h-11 items-center rounded-[0.625rem] border border-[#0E1F1A]/10 bg-white px-4 text-sm font-medium text-[#0E1F1A]">
              {link.label}
            </Link>
          </li>
        ))}
        {actor.role === 'ADMIN' ? (
          <>
            <li>
              <Link href="/admin/chapters" className="flex min-h-11 items-center rounded-[0.625rem] border border-[#0E1F1A]/10 bg-white px-4 text-sm font-medium text-[#0E1F1A]">
                Chapters and dues
              </Link>
            </li>
            <li>
              <Link href="/admin/cycles" className="flex min-h-11 items-center rounded-[0.625rem] border border-[#0E1F1A]/10 bg-white px-4 text-sm font-medium text-[#0E1F1A]">
                Cycles
              </Link>
            </li>
          </>
        ) : null}
      </ul>
    </>
  );
}
