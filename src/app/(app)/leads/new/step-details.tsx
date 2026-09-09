'use client';

import type { AreaOption } from '@/server/actions/areas';

export const fieldClass =
  'h-11 w-full rounded-[4px] border border-line bg-cream-flat px-3 text-ink focus-visible:border-secondary';
export const labelClass =
  'mb-1 block font-sans text-[11px] font-semibold tracking-[0.05em] text-primary uppercase';

export type LeadFormState = {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  leadType: string;
  areaFreeText: string;
  propertyType: string;
  budgetMin: string;
  budgetMax: string;
  timeline: string;
  source: string;
  notes: string;
};

export function LeadDetailsForm({
  form,
  setForm,
  areaQuery,
  setAreaQuery,
  setAreaId,
  areas,
  setAreas,
  notice,
  submitting,
  onScan,
  onDraft,
}: {
  form: LeadFormState;
  setForm: (next: LeadFormState) => void;
  areaQuery: string;
  setAreaQuery: (value: string) => void;
  setAreaId: (value: string | null) => void;
  areas: AreaOption[];
  setAreas: (value: AreaOption[]) => void;
  notice: string;
  submitting: boolean;
  onScan: () => void;
  onDraft: () => void;
}) {
  return (
    <form
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        onScan();
      }}
    >
      <label>
        <span className={labelClass}>Client full name</span>
        <input className={fieldClass} required value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
      </label>
      <label>
        <span className={labelClass}>Phone number</span>
        <input className={fieldClass} type="tel" required value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} />
      </label>
      <label>
        <span className={labelClass}>Email</span>
        <input className={fieldClass} type="email" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} />
      </label>
      <label>
        <span className={labelClass}>Lead type</span>
        <select className={fieldClass} required value={form.leadType} onChange={(e) => setForm({ ...form, leadType: e.target.value })}>
          <option value="BUYER">Buyer</option>
          <option value="SELLER">Seller</option>
          <option value="RENTAL_SEEKER">Rental seeker</option>
          <option value="RENTAL_LISTER">Rental lister</option>
        </select>
      </label>
      <label className="md:col-span-2">
        <span className={labelClass}>Area / neighbourhood</span>
        <input
          className={fieldClass}
          required
          value={areaQuery}
          onChange={(e) => {
            setAreaId(null);
            setAreaQuery(e.target.value);
            setForm({ ...form, areaFreeText: e.target.value });
          }}
        />
        {areas.length > 0 ? (
          <ul className="mt-1 border border-line bg-cream-flat">
            {areas.map((area) => (
              <li key={area.id}>
                <button
                  type="button"
                  className="h-11 w-full px-3 text-left"
                  onClick={() => {
                    setAreaId(area.id);
                    setAreaQuery(`${area.name}, ${area.city}`);
                    setAreas([]);
                  }}
                >
                  {area.name} · {area.city}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </label>
      <label>
        <span className={labelClass}>Property type</span>
        <select className={fieldClass} value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })}>
          <option value="">Select</option>
          <option value="APARTMENT">Apartment</option>
          <option value="TOWNHOUSE">Townhouse</option>
          <option value="STANDALONE_HOUSE">Standalone house</option>
          <option value="LAND">Land</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className={labelClass}>Budget min</span>
          <input className={fieldClass} value={form.budgetMin} onChange={(e) => setForm({ ...form, budgetMin: e.target.value })} />
        </label>
        <label>
          <span className={labelClass}>Budget max</span>
          <input className={fieldClass} value={form.budgetMax} onChange={(e) => setForm({ ...form, budgetMax: e.target.value })} />
        </label>
      </div>
      <label>
        <span className={labelClass}>Timeline</span>
        <select className={fieldClass} value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })}>
          <option value="">Select</option>
          <option value="IMMEDIATE">Immediate</option>
          <option value="ONE_TO_THREE_MONTHS">1-3 months</option>
          <option value="THREE_TO_SIX_MONTHS">3-6 months</option>
          <option value="BROWSING">Just browsing</option>
        </select>
      </label>
      <label>
        <span className={labelClass}>Source</span>
        <select className={fieldClass} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
          <option value="">Select</option>
          <option value="REFERRAL">Referral</option>
          <option value="WEBSITE">Website</option>
          <option value="WALK_IN">Walk-in</option>
          <option value="SOCIAL_MEDIA">Social media</option>
        </select>
      </label>
      <label className="md:col-span-2">
        <span className={labelClass}>Notes</span>
        <textarea className="min-h-24 w-full rounded-[4px] border border-line bg-cream-flat p-3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </label>
      <div className="md:col-span-2 rounded-[6px] border border-line bg-cream-flat p-4">
        <label className="flex items-start gap-3">
          <input type="checkbox" checked disabled className="mt-1" title="Always on. Contact details are never shared without your approval." />
          <span>
            <strong>Keep client contact details private.</strong> Your client&apos;s name, phone, and email stay visible only to you. If KITO Mastermind finds a matching lead, the other member sees a match summary, not the contact info, until you approve access.
          </span>
        </label>
      </div>
      <label className="md:col-span-2 flex items-start gap-3">
        <input type="checkbox" required className="mt-1 size-4" />
        <span>I confirm my client has agreed to their details being recorded.</span>
      </label>
      <div className="md:col-span-2 flex flex-wrap gap-2">
        <span className="rounded-full bg-cream-dim px-3 py-2 text-sm">None</span>
        <span className="rounded-full bg-cream-dim px-3 py-2 text-sm text-muted" title="Coming soon">Follow Up Boss</span>
        <span className="rounded-full bg-cream-dim px-3 py-2 text-sm text-muted" title="Coming soon">HubSpot</span>
        <span className="rounded-full bg-cream-dim px-3 py-2 text-sm text-muted" title="Coming soon">kvCORE</span>
        <span className="rounded-full bg-cream-dim px-3 py-2 text-sm text-muted" title="Coming soon">Zoho CRM</span>
      </div>
      <p className="md:col-span-2 min-h-4 text-sm text-danger-ink" aria-live="polite">{notice}</p>
      <div className="md:col-span-2 flex gap-2">
        <button type="button" className="h-11 rounded-[4px] border border-line px-4" disabled={submitting} onClick={onDraft}>Save as draft</button>
        <button type="submit" className="h-11 rounded-[4px] bg-secondary px-4 font-semibold text-primary-deep" disabled={submitting}>Find matches</button>
      </div>
    </form>
  );
}
