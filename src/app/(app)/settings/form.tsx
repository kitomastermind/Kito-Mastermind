'use client';

import { resetPasswordAction } from '@/server/actions/auth';
import { updateEmailPreferencesAction, updateProfileAction } from '@/server/actions/settings';
import { useState } from 'react';

const TYPES = [
  'ACCESS_REQUESTED',
  'ACCESS_GRANTED',
  'VERIFICATION_NEEDED',
  'NUDGE',
  'MATCH_MESSAGE',
  'DEAL_CONFIRMATION_NEEDED',
] as const;

export function SettingsForm({
  fullName,
  phone,
  brokerage,
  digest,
  immediate,
}: {
  fullName: string;
  phone: string;
  brokerage: string;
  digest: boolean;
  immediate: string[];
}) {
  const [name, setName] = useState(fullName);
  const [phoneValue, setPhone] = useState(phone);
  const [broker, setBroker] = useState(brokerage);
  const [emailDigest, setDigest] = useState(digest);
  const [selected, setSelected] = useState(immediate);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [notice, setNotice] = useState('');
  return (
    <div className="portal-grid-2">
      <form
        className="form-surface space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await updateProfileAction({ fullName: name, phone: phoneValue, brokerage: broker });
          setNotice(result.ok ? 'Profile saved.' : result.error);
        }}
      >
        <p className="text-sm font-semibold">Profile</p>
        <label className="block text-sm" htmlFor="settings-name">Full name
          <input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        </label>
        <label className="block text-sm" htmlFor="settings-phone">Phone
          <input id="settings-phone" value={phoneValue} onChange={(e) => setPhone(e.target.value)} className="mt-1 h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        </label>
        <label className="block text-sm" htmlFor="settings-broker">Brokerage
          <input id="settings-broker" value={broker} onChange={(e) => setBroker(e.target.value)} className="mt-1 h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        </label>
        <button type="submit" className="btn-primary">Save profile</button>
      </form>
      <form
        className="form-surface space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await resetPasswordAction({ password, confirm });
          setNotice(result.ok ? 'Password updated.' : result.error);
        }}
      >
        <p className="text-sm font-semibold">Password</p>
        <label className="block text-sm" htmlFor="settings-password">New password
          <input id="settings-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        </label>
        <label className="block text-sm" htmlFor="settings-confirm">Confirm password
          <input id="settings-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        </label>
        <button type="submit" className="btn-primary">Change password</button>
      </form>
      <form
        className="form-surface space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await updateEmailPreferencesAction({ digest: emailDigest, immediate: selected });
          setNotice(result.ok ? 'Email preferences saved.' : result.error);
        }}
      >
        <p className="text-sm font-semibold">Email preferences</p>
        <label className="flex h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={emailDigest} onChange={(e) => setDigest(e.target.checked)} />
          Daily digest
        </label>
        {TYPES.map((type) => (
          <label key={type} className="flex h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(type)}
              onChange={(e) => {
                setSelected((current) =>
                  e.target.checked ? [...current, type] : current.filter((item) => item !== type),
                );
              }}
            />
            {type.replaceAll('_', ' ')}
          </label>
        ))}
        <button type="submit" className="btn-primary">Save preferences</button>
      </form>
      <section className="form-surface">
        <p className="text-sm font-semibold">CRM connections</p>
        <p className="mt-2 text-sm text-[#5A6B7D]">Follow Up Boss, HubSpot, kvCORE and Zoho are disabled in v1.</p>
        <button type="button" disabled className="btn-secondary mt-3 opacity-50">
          Connect CRM
        </button>
      </section>
      <p className="text-sm text-[#5A6B7D] md:col-span-2" aria-live="polite">{notice}</p>
    </div>
  );
}
