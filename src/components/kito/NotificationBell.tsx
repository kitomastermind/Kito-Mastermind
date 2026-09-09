'use client';

import { useState } from 'react';
import Link from 'next/link';
import { markNotificationReadAction } from '@/server/actions/notifications';
import type { NotificationDto } from '@/server/repositories/notifications';

export function NotificationBell({
  unreadCount,
  items,
}: {
  unreadCount: number;
  items: NotificationDto[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex size-11 items-center justify-center text-cream"
      >
        Bell
        {unreadCount > 0 ? (
          <span className="absolute top-2 right-2 size-2 rounded-full bg-secondary" />
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-[6px] border border-line bg-cream p-3 text-ink shadow-none">
          <p className="text-xs font-semibold tracking-[0.05em] text-primary uppercase">Today</p>
          {items.length === 0 ? (
            <p className="mt-2 text-sm text-muted">You are caught up.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {items.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.linkPath ?? '/notifications'}
                    className="block text-sm"
                    onClick={() => {
                      void markNotificationReadAction({ id: item.id });
                      setOpen(false);
                    }}
                  >
                    <span className="font-semibold">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-muted">{item.body}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/notifications" className="mt-3 block text-sm text-primary-soft">
            Open inbox
          </Link>
        </div>
      ) : null}
    </div>
  );
}
