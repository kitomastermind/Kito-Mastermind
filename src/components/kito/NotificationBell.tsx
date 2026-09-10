'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { markNotificationReadAction } from '@/server/actions/notifications';
import type { NotificationDto } from '@/server/repositories/notifications';

export function NotificationBell({
  unreadCount,
  items,
  className,
}: {
  unreadCount: number;
  items: NotificationDto[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`relative inline-flex size-11 items-center justify-center ${className ?? ''}`}
      >
        <Bell size={18} strokeWidth={1.75} />
        {unreadCount > 0 ? (
          <span className="absolute top-2 right-2 size-2 rounded-full bg-[#F0C419]" />
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-[#E3E7E0] bg-white p-3 text-[#0E1F1A] shadow-[0_18px_44px_rgba(14,31,26,0.14)]">
          <p className="text-[11px] font-bold tracking-wide text-[#5A6B7D] uppercase">Today</p>
          {items.length === 0 ? (
            <p className="mt-2 text-sm text-[#5A6B7D]">You are caught up.</p>
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
                    <span className="mt-0.5 block text-xs text-[#5A6B7D]">{item.body}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/notifications" className="mt-3 block text-sm font-semibold text-[#0E1F1A]">
            Open inbox
          </Link>
        </div>
      ) : null}
    </div>
  );
}
