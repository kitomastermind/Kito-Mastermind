import { loadDashboard } from '@/server/repositories/dashboard';
import { requireActor } from '@/server/supabase/server';
import { DashboardView } from './dashboard-view';

export default async function DashboardPage() {
  const actor = await requireActor();
  const model = await loadDashboard(actor);
  return <DashboardView model={model} />;
}
