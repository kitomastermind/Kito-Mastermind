import { cn } from '@/lib/utils';

export function AvatarInitials({
  name,
  photoUrl,
  size = 'md',
  tone = 'primary',
}: {
  name: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'primary' | 'secondary';
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
  const dim = size === 'lg' ? 'size-14 text-lg' : size === 'sm' ? 'size-8 text-xs' : 'size-10 text-sm';
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photoUrl} alt="" className={cn(dim, 'rounded-full object-cover')} />
    );
  }
  return (
    <span
      className={cn(
        dim,
        'inline-flex items-center justify-center rounded-full font-semibold',
        tone === 'primary' ? 'bg-primary text-cream' : 'bg-secondary-pale text-primary',
      )}
    >
      {initials}
    </span>
  );
}
