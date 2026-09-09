'use client';

import { AvatarInitials } from '@/components/kito/AvatarInitials';

export function StarRating({
  value,
  onChange,
  readOnly,
  size = 'md',
}: {
  value: number;
  onChange?: (next: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      className="flex gap-1"
      role="radiogroup"
      aria-label="Rating"
      onKeyDown={(event) => {
        if (readOnly) return;
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
          event.preventDefault();
          onChange?.(Math.min(5, (value || 0) + 1));
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
          event.preventDefault();
          onChange?.(Math.max(1, (value || 1) - 1));
        }
      }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star`}
          disabled={readOnly}
          className={size === 'sm' ? 'size-8' : 'size-11'}
          onClick={() => onChange?.(star)}
        >
          {star <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}

export function LessonCard({
  author,
  chapterName,
  postedAt,
  headline,
  body,
  avgRating,
  ratingCount,
  replyCount,
  myRating,
  isTop,
  canRate,
  onRate,
}: {
  author: string;
  chapterName: string;
  postedAt: string;
  headline: string;
  body: string;
  avgRating: string;
  ratingCount: number;
  replyCount: number;
  myRating: number | null;
  isTop?: boolean;
  canRate: boolean;
  onRate?: (stars: number) => void;
}) {
  return (
    <article
      className={
        isTop
          ? 'rounded-[6px] border border-secondary bg-cream-flat p-4'
          : 'rounded-[6px] border border-line bg-cream-flat p-4'
      }
    >
      {isTop ? <p className="mb-2 text-xs text-secondary-deep">★ Top lesson</p> : null}
      <div className="flex items-center gap-3">
        <AvatarInitials name={author} size="sm" />
        <div>
          <p className="text-sm font-semibold text-ink">{author}</p>
          <p className="text-xs text-muted">
            {chapterName} · {postedAt}
          </p>
        </div>
      </div>
      <h3 className="mt-2 font-display text-lg text-primary">{headline}</h3>
      <p className="mt-1 text-sm text-ink">{body}</p>
      <StarRating value={myRating ?? 0} readOnly={!canRate} onChange={onRate} />
      <p className="text-xs text-muted">
        {myRating
          ? `You rated this ${myRating}★ · thanks for voting`
          : `${avgRating} · ${ratingCount} votes · ${replyCount} replies`}
      </p>
    </article>
  );
}

export { NotificationBell } from '@/components/kito/NotificationBell';
