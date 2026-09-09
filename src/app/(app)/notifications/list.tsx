'use client';

import Link from 'next/link';
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/server/actions/notifications';
import type { NotificationDto } from '@/server/repositories/notifications';

function groupLabel(createdAt: string, now: Date): 'Today' | 'This week' | 'Earlier' {
  const created = new Date(createdAt);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  if (created >= startOfToday) return 'Today';
  if (created >= startOfWeek) return 'This week';
  return 'Earlier';
}

export function NotificationList({ items }: { items: NotificationDto[] }) {
  const now = new Date();
  const groups: Record<'Today' | 'This week' | 'Earlier', NotificationDto[]> = {
    Today: [],
    'This week': [],
    Earlier: [],
  };
  for (const item of items) {
    groups[groupLabel(item.createdAt, now)].push(item);
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        className="h-11 rounded-[4px] border border-line px-3 text-sm"
        onClick={() => {
          void markAllNotificationsReadAction();
        }}
      >
        Mark all as read
      </button>
      {(['Today', 'This week', 'Earlier'] as const).map((label) => (
        <section key={label}>
          <h2 className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">{label}</h2>
          {groups[label].length === 0 ? (
            <p className="mt-2 text-sm text-muted">Nothing here.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line rounded-[6px] border border-line bg-cream-flat">
              {groups[label].map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.linkPath ?? '/notifications'}
                    className="block px-4 py-3"
                    onClick={() => {
                      void markNotificationReadAction({ id: item.id });
                    }}
                  >
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    <p className="text-sm text-muted">{item.body}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
