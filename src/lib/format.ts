import { formatInTimeZone } from 'date-fns-tz';

export const NAIROBI_TZ = 'Africa/Nairobi';

export function formatNairobiDate(
  value: Date | string,
  pattern = 'd MMM yyyy',
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return formatInTimeZone(date, NAIROBI_TZ, pattern);
}

export function formatNairobiDateTime(value: Date | string): string {
  return formatNairobiDate(value, "d MMM yyyy · HH:mm");
}

export function firstName(fullName: string): string {
  const [head] = fullName.trim().split(/\s+/);
  return head ?? fullName;
}

export function greetingForHour(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
