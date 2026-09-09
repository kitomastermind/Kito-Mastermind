import { formatInTimeZone } from 'date-fns-tz';
import { firstName, greetingForHour, NAIROBI_TZ } from '@/lib/format';
import { PageHeader } from '@/components/kito/PageHeader';
import { requireActor } from '@/server/supabase/server';

export default async function DashboardPage() {
  const actor = await requireActor();
  const now = new Date();
  const hour = Number(formatInTimeZone(now, NAIROBI_TZ, 'H'));
  const greeting = greetingForHour(Number.isFinite(hour) ? hour : 12);

  return (
    <PageHeader
      eyebrow="Your chapter"
      title={`Good ${greeting}, ${firstName(actor.fullName)}`}
    />
  );
}
