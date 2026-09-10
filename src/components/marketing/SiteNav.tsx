'use client';

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Menu, X } from 'lucide-react';
import { NavBrandMark } from '@/components/brand/BrandMark';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/utils';

function subscribeScroll(onStoreChange: () => void) {
  window.addEventListener('scroll', onStoreChange, { passive: true });
  return () => window.removeEventListener('scroll', onStoreChange);
}

function overlayProgress() {
  return Math.min(1, Math.max(0, window.scrollY / 180));
}

const LINKS = [
  { href: '/#how', label: 'How it works' },
  { href: '/#circle', label: 'The circle' },
  { href: '/login', label: 'Chapter login' },
] as const;

export function SiteNav({ overlay = false }: { overlay?: boolean }) {
  const progress = useSyncExternalStore(
    overlay ? subscribeScroll : () => () => undefined,
    overlay ? overlayProgress : () => 1,
    () => (overlay ? 0 : 1),
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const shadow = progress > 0.08 ? `0 8px 28px rgba(14,31,26, ${0.07 * progress})` : 'none';
  const blur = progress > 0.05 ? `blur(${12 * progress}px)` : 'none';

  return (
    <>
      <header
        className={cn('nav', overlay && 'on-hero', progress > 0.72 && 'scrolled')}
        style={
          {
            '--nav-progress': progress,
            boxShadow: shadow,
            backdropFilter: blur,
          } as React.CSSProperties
        }
      >
        <div className="container nav-inner">
          <Link href="/" className="brand">
            <span className="brand-tile">
              <NavBrandMark />
            </span>
            <span className="brand-word">{BRAND.name}</span>
          </Link>
          <nav className="nav-links">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="nav-right">
            <Link href="/login" className="sign-in">
              Sign in
            </Link>
            <Link href="/login" className="btn btn-dark">
              Enter chapter
              <span className="node" aria-hidden>
                →
              </span>
            </Link>
            <button type="button" className="burger" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>
      {open ? (
        <div className="mobile-sheet">
          <div className="mb-6 flex items-center justify-between">
            <span className="font-marketing text-lg font-bold text-white">{BRAND.product}</span>
            <button type="button" aria-label="Close menu" className="touch-target text-white" onClick={() => setOpen(false)}>
              <X size={22} />
            </button>
          </div>
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link href="/login" onClick={() => setOpen(false)}>
            Sign in
          </Link>
        </div>
      ) : null}
    </>
  );
}
