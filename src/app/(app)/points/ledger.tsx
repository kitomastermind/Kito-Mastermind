'use client';

import type { PointsCategoryBlock } from '@/server/repositories/points';

export function PointsLedger({ categories }: { categories: PointsCategoryBlock[] }) {
  return (
    <div className="space-y-3">
      {categories.map((block) => (
        <details key={block.category} className="rounded-[6px] border border-line bg-cream-flat">
          <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm">
            <span className="font-semibold text-ink">{block.label}</span>
            <span className="text-muted">
              {block.points} / {block.cap}
            </span>
          </summary>
          <div className="border-t border-line px-4 py-3">
            {block.zeroNote ? <p className="text-sm text-muted">{block.zeroNote}</p> : null}
            {block.entries.length > 0 ? (
              <ul className="space-y-2">
                {block.entries.map((entry) => (
                  <li key={entry.id} className="flex items-start justify-between gap-3 text-sm">
                    <span>
                      <span className="block text-ink">{entry.reason}</span>
                      <span className="text-xs text-muted">{entry.awardedAt}</span>
                    </span>
                    <span className="font-semibold text-primary">{entry.points}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}
