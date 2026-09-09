import Link from 'next/link';
import { AvatarInitials } from '@/components/kito/AvatarInitials';
import { StatusPill } from '@/components/kito/StatusPill';
import { logoutAction } from '@/server/actions/auth';
import { createClient, requireActor } from '@/server/supabase/server';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/leads', label: 'Leads' },
  { href: '/accountability', label: 'Accountability' },
  { href: '/forum', label: 'Forum' },
  { href: '/reports', label: 'Reports' },
] as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, chapter_id, chapters(name)')
    .eq('id', actor.id)
    .single();
  const chapterName =
    profile?.chapters && typeof profile.chapters === 'object' && 'name' in profile.chapters
      ? String(profile.chapters.name)
      : 'Chapter';

  return (
    <div className="min-h-screen bg-cream pb-16 md:pb-0">
      <header className="sticky top-0 z-20 flex items-center gap-4 bg-primary px-4 py-3 text-cream">
        <Link href="/dashboard" className="shrink-0 font-display text-lg font-[450]">
          K <span className="text-secondary">Mastermind</span>
        </Link>
        <nav className="hidden flex-1 justify-center gap-5 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm hover:text-secondary">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/notifications" className="relative text-sm" aria-label="Notifications">
            Bell
          </Link>
          {actor.role !== 'MEMBER' ? (
            <StatusPill tone="neutral">{actor.role.replace('_', ' ')}</StatusPill>
          ) : null}
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-cream/80 hover:text-cream">
              Sign out
            </button>
          </form>
          <div className="hidden items-center gap-2 md:flex">
            <AvatarInitials name={actor.fullName} size="sm" />
            <div className="leading-tight">
              <p className="text-sm">{actor.fullName}</p>
              <p className="text-xs text-cream/70">{chapterName} Chapter</p>
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
      <nav className="fixed right-0 bottom-0 left-0 z-20 grid grid-cols-5 border-t border-line bg-cream-flat md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-11 items-center justify-center px-1 text-center text-[11px] text-primary"
          >
            {item.label === 'Accountability' ? 'Actions' : item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
