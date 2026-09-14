'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  BarChart3,
  Bell,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Settings,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { BrandMark } from '@/components/brand/BrandMark';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/server/actions/auth';

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; short?: string };

const PRIMARY: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: FileText },
  { href: '/accountability', label: 'Accountability', icon: ClipboardCheck, short: 'Actions' },
  { href: '/forum', label: 'Forum', icon: Users },
];

const MORE: NavItem[] = [
  { href: '/reports', label: 'Reports', icon: Wallet },
  { href: '/points', label: 'Points', icon: BarChart3 },
  { href: '/notifications', label: 'Inbox', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const WARM_HREFS = [...PRIMARY, ...MORE, { href: '/leads/new' }].map((item) => item.href);

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PortalShell({
  children,
  fullName,
  chapterName,
  role,
  canAdmin,
  desktopBell,
  mobileBell,
}: {
  children: React.ReactNode;
  fullName: string;
  chapterName: string;
  role: string;
  canAdmin: boolean;
  desktopBell: ReactNode;
  mobileBell: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [drawerPath, setDrawerPath] = useState(pathname);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  if (pathname !== drawerPath) {
    setDrawerPath(pathname);
    setMoreOpen(false);
  }
  if (pendingHref && pathname === pendingHref) {
    setPendingHref(null);
  }
  const current = pendingHref ?? pathname;
  const initial = (fullName.trim()[0] ?? 'K').toUpperCase();
  const sidebar = [
    ...PRIMARY,
    ...MORE,
    ...(canAdmin ? [{ href: '/admin', label: 'Admin', icon: Settings }] : []),
  ];

  useEffect(() => {
    const html = document.documentElement;
    const previousHtml = html.style.overflow;
    const previousBody = document.body.style.overflow;
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = previousHtml;
      document.body.style.overflow = previousBody;
    };
  }, []);

  useEffect(() => {
    for (const href of WARM_HREFS) {
      router.prefetch(href);
    }
    if (canAdmin) {
      router.prefetch('/admin');
    }
  }, [canAdmin, router]);

  function go(href: string) {
    if (href !== pathname) {
      setPendingHref(href);
    }
    setMoreOpen(false);
  }

  return (
    <div className="portal-shell">
      <div className="portal-backdrop" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BRAND.photos.portal} alt="" className="portal-backdrop__photo" />
        <div className="portal-backdrop__veil" />
      </div>

      <div className="relative z-10 flex h-full gap-2 overflow-hidden p-2 lg:p-3">
        <aside className="sidebar-glass hidden h-full w-[15.5rem] shrink-0 flex-col overflow-hidden rounded-2xl xl:w-64 lg:flex">
          <div className="shrink-0 flex items-center gap-2.5 px-3 py-3">
            <BrandMark className="h-9 w-9" />
            <div>
              <p className="text-sm font-bold tracking-tight text-white">{BRAND.product}</p>
              <p className="text-[11px] font-medium text-[#E8F0EA]/65">{chapterName} chapter</p>
            </div>
          </div>
          <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain px-2">
            {sidebar.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={() => go(item.href)}
                  className={cn('sidebar-nav-link', isActive(current, item.href) && 'is-active')}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mx-3 my-2 h-px shrink-0 bg-white/8" />
          <div className="flex shrink-0 items-center gap-2 px-3 pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#9BA63E] text-xs font-bold text-[#204559]">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{fullName}</p>
              <p className="truncate text-[10px] text-[#E8F0EA]/65">{role.replaceAll('_', ' ')}</p>
            </div>
            {desktopBell}
            <form action={logoutAction}>
              <button type="submit" aria-label="Sign out" className="touch-target text-[#E8F0EA]">
                <LogOut size={18} strokeWidth={1.5} />
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="glass-nav safe-pad-x safe-pad-top mb-2 flex items-center gap-2 rounded-xl px-2 py-1.5 lg:hidden">
            <button
              type="button"
              aria-label="Open menu"
              className="touch-target text-[#204559]"
              onClick={() => setMoreOpen(true)}
            >
              <Menu size={20} />
            </button>
            <Link href="/dashboard" prefetch onClick={() => go('/dashboard')} className="flex flex-1 items-center gap-2">
              <BrandMark className="h-8 w-8" />
              <span className="text-sm font-bold text-[#204559]">{BRAND.name}</span>
            </Link>
            {mobileBell}
          </header>

          <main className="relative min-h-0 flex-1 overflow-y-auto scroll-touch pb-[calc(var(--tab-bar-h)+var(--safe-bottom))] lg:pb-0">
            {pendingHref && pendingHref !== pathname ? <div className="nav-progress" aria-hidden /> : null}
            <div className="main-pad">
              <div className="content-canvas">
                <div className="portal-page">{children}</div>
              </div>
            </div>
          </main>

          <nav className="glass-tabbar safe-pad-x safe-pad-bottom fixed right-0 bottom-0 left-0 z-20 grid grid-cols-5 lg:hidden">
            {PRIMARY.map((item) => {
              const Icon = item.icon;
              const active = isActive(current, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={() => go(item.href)}
                  className="flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-[#5A6B7D]"
                >
                  <span className={cn('rounded-md p-1', active && 'bg-[#9BA63E]/25 text-[#204559]')}>
                    <Icon size={18} strokeWidth={1.5} />
                  </span>
                  {item.short ?? item.label}
                </Link>
              );
            })}
            <button
              type="button"
              aria-label="More"
              onClick={() => setMoreOpen(true)}
              className="flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-[#5A6B7D]"
            >
              <MoreHorizontal size={18} />
              More
            </button>
          </nav>
        </div>
      </div>

      {moreOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMoreOpen(false)}
          />
          <aside className="sidebar-glass animate-fade-in absolute inset-y-0 left-0 flex h-full w-[min(20rem,88vw)] flex-col overflow-hidden safe-pad-top">
            <div className="flex shrink-0 items-center justify-between px-3 py-3">
              <div className="flex items-center gap-2">
                <BrandMark className="h-8 w-8" />
                <span className="text-sm font-bold text-white">{BRAND.product}</span>
              </div>
              <button type="button" aria-label="Close menu" className="touch-target text-white" onClick={() => setMoreOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain px-2">
              {sidebar.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    onClick={() => go(item.href)}
                    className={cn('sidebar-nav-link', isActive(current, item.href) && 'is-active')}
                  >
                    <Icon size={18} strokeWidth={1.5} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <form action={logoutAction} className="shrink-0 p-3">
              <button type="submit" className="sidebar-nav-link w-full">
                <LogOut size={18} strokeWidth={1.5} />
                Sign out
              </button>
            </form>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
