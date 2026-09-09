export function normalizeKenyaPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `+254${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `+254${digits}`;
  }
  return null;
}
