'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { createLeadAction } from '@/server/actions/leads';
import { searchAreasAction, type AreaOption } from '@/server/actions/areas';
import { requestContactAccessAction } from '@/server/actions/access';
import type { MatchCardView } from '@/server/admin/insert-matches';
import { MatchCard } from '@/components/kito/MatchCard';
import { ConfirmDialog, Stepper } from '@/components/kito/interactive';
import { LeadDetailsForm, labelClass, type LeadFormState } from './step-details';

const STEPS = ['Details', 'Matching', 'Review'];
const CHECKS = [
  'Checking area overlap',
  'Checking budget range',
  'Checking property type and timeline',
  'Ranking match confidence',
];

function subscribeReduced(onStoreChange: () => void): () => void {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

export function LeadWizard() {
  const router = useRouter();
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
  const [step, setStep] = useState(0);
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [matches, setMatches] = useState<MatchCardView[]>([]);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [scanNote, setScanNote] = useState(0);
  const [areaQuery, setAreaQuery] = useState('');
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [areaId, setAreaId] = useState<string | null>(null);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<LeadFormState>({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    leadType: 'BUYER',
    areaFreeText: '',
    propertyType: '',
    budgetMin: '',
    budgetMax: '',
    timeline: '',
    source: '',
    notes: '',
  });

  useEffect(() => {
    if (areaQuery.trim().length < 2) return;
    const handle = window.setTimeout(() => {
      void searchAreasAction({ query: areaQuery }).then((result) => {
        if (result.ok) setAreas(result.data);
      });
    }, 200);
    return () => window.clearTimeout(handle);
  }, [areaQuery]);

  const payload = useMemo(
    () => ({
      clientName: form.clientName,
      clientPhone: form.clientPhone,
      clientEmail: form.clientEmail,
      leadType: form.leadType,
      areaId,
      areaFreeText: areaId ? null : form.areaFreeText || areaQuery || null,
      propertyType: form.propertyType || null,
      budgetMin: form.budgetMin,
      budgetMax: form.budgetMax,
      timeline: form.timeline || null,
      source: form.source || null,
      notes: form.notes,
      consentConfirmed: true as const,
      crmSyncTarget: 'NONE' as const,
    }),
    [form, areaId, areaQuery],
  );

  async function save(next: 'scan' | 'draft') {
    setSubmitting(true);
    setNotice('');
    const started = Date.now();
    if (next === 'scan') {
      setStep(1);
      setScanNote(0);
    }
    const result = await createLeadAction(payload);
    const elapsed = Date.now() - started;
    if (!result.ok) {
      setSubmitting(false);
      setStep(0);
      setNotice(result.error);
      return;
    }
    setLeadId(result.data.leadId);
    setMatches(result.data.matches);
    if (next === 'draft') {
      router.push(`/leads/${result.data.leadId}`);
      return;
    }
    if (elapsed > 4000) {
      setNotice('We are still scanning. We will notify you when matches are found.');
    }
    const wait = Math.max(1200 - elapsed, 0);
    window.setTimeout(() => {
      setStep(2);
      setSubmitting(false);
    }, reduced ? 0 : wait);
  }

  useEffect(() => {
    if (step !== 1 || reduced) return;
    const id = window.setInterval(() => {
      setScanNote((n) => (n < 3 ? n + 1 : n));
    }, 450);
    return () => window.clearInterval(id);
  }, [step, reduced]);

  const strong = matches.filter((m) => m.score >= 80).length;
  const partial = matches.filter((m) => m.score < 80).length;

  return (
    <div className="space-y-6">
      <Stepper steps={STEPS} current={step} />
      {step === 0 ? (
        <LeadDetailsForm
          form={form}
          setForm={setForm}
          areaQuery={areaQuery}
          setAreaQuery={setAreaQuery}
          setAreaId={setAreaId}
          areas={areaQuery.trim().length < 2 ? [] : areas}
          setAreas={setAreas}
          notice={notice}
          submitting={submitting}
          onScan={() => void save('scan')}
          onDraft={() => void save('draft')}
        />
      ) : null}
      {step === 1 ? (
        <div className="space-y-3">
          {reduced ? (
            <ul className="text-sm text-muted">
              {CHECKS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="size-24 animate-spin rounded-full border-4 border-line border-t-secondary" />
              <p className="text-sm text-muted">{CHECKS[scanNote] ?? CHECKS[0]}</p>
            </div>
          )}
          <p className="text-sm text-muted" aria-live="polite">{notice}</p>
        </div>
      ) : null}
      {step === 2 ? (
        <div className="space-y-4">
          {matches.length === 0 ? (
            <p>No matches in your chapter right now. Your lead is saved, and we will notify you the moment a matching lead is logged.</p>
          ) : (
            <p>
              <strong>{strong} strong match</strong> and {partial} partial match found.
            </p>
          )}
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              ownerName={match.ownerName}
              loggedAt={new Date(match.loggedAt).toLocaleDateString('en-KE')}
              chapterName={match.chapterName}
              score={match.score}
              facets={match.facets}
              requestState={match.requestState}
              onRequest={() => setRequesting(match.otherLeadId)}
              onMessage={() => router.push(`/matches/${match.id}`)}
            />
          ))}
          <p className="text-sm text-muted">Both matched owners will be notified automatically that this lead was matched.</p>
          <div className="flex gap-2">
            <button type="button" className="h-11 rounded-[4px] border border-line px-4" onClick={() => router.push('/leads/new')}>Start over</button>
            <button type="button" className="h-11 rounded-[4px] bg-secondary px-4 font-semibold text-primary-deep" onClick={() => leadId && router.push(`/leads/${leadId}`)}>Notify owners and save lead</button>
          </div>
        </div>
      ) : null}
      <ConfirmDialog
        open={requesting !== null}
        title="Request contact access"
        body="Add an optional note. Links are stored as text. The owner sees who you are, not your client."
        confirmLabel="Send request"
        onClose={() => setRequesting(null)}
        onConfirm={() => {
          const match = matches.find((row) => row.otherLeadId === requesting);
          if (!match) return;
          void requestContactAccessAction({
            leadId: match.otherLeadId,
            matchId: match.id,
            message,
          }).then((result) => {
            setRequesting(null);
            setNotice(result.ok ? 'Request sent.' : result.error);
          });
        }}
      />
      {requesting ? (
        <label className="block">
          <span className={labelClass}>Message</span>
          <textarea className="min-h-20 w-full rounded-[4px] border border-line p-3" maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} />
        </label>
      ) : null}
    </div>
  );
}
