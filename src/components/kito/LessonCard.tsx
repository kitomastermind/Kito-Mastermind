'use client';

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
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
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
      <p className="text-sm font-semibold text-ink">{author}</p>
      <p className="text-xs text-muted">
        {chapterName} · {postedAt}
      </p>
      <h3 className="mt-2 font-display text-lg text-primary">{headline}</h3>
      <p className="mt-1 text-sm text-ink">{body}</p>
      <StarRating value={myRating ?? 0} readOnly={!canRate} />
      <p className="text-xs text-muted">
        {myRating
          ? `You rated this ${myRating}★ · thanks for voting`
          : `${avgRating} · ${ratingCount} votes · ${replyCount} replies`}
      </p>
    </article>
  );
}

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <span className="relative inline-flex size-11 items-center justify-center">
      Bell
      {unreadCount > 0 ? (
        <span className="absolute top-2 right-2 size-2 rounded-full bg-secondary" />
      ) : null}
    </span>
  );
}
