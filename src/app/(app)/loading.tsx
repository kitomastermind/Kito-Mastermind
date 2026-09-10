export default function PortalLoading() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <div className="page-hero h-14" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="page-skeleton h-28" />
        <div className="page-skeleton h-28" />
        <div className="page-skeleton h-40 sm:col-span-2" />
        <div className="page-skeleton h-40 sm:col-span-2" />
      </div>
    </div>
  );
}
