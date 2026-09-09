'use client';

import { createInvitationAction } from '@/server/actions/auth';
import { changeRoleAction, deactivateMemberAction, resendInvitationAction } from '@/server/actions/members';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Member = {
  id: string;
  name: string;
  email: string;
  role: 'MEMBER' | 'TREASURER' | 'CHAPTER_LEAD' | 'ADMIN';
  active: boolean;
  chapterId: string;
  chapterName: string;
};

export function MembersRoster({
  members,
  invitations,
  chapterId,
  canInviteAdmin,
}: {
  members: Member[];
  invitations: { id: string; email: string; role: string; expires_at: string }[];
  chapterId: string;
  canInviteAdmin: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'TREASURER' | 'CHAPTER_LEAD' | 'ADMIN'>('MEMBER');
  const [notice, setNotice] = useState('');
  return (
    <div className="space-y-6">
      <form
        className="space-y-3 rounded-[6px] border border-line bg-cream-flat p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await createInvitationAction({ email, chapterId, role });
          setNotice(result.ok ? (result.data.inviteUrl ?? 'Invitation sent.') : result.error);
          if (result.ok) router.refresh();
        }}
      >
        <p className="text-sm font-semibold">Invite a member</p>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm" />
        <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="h-11 w-full rounded-[4px] border border-line bg-cream px-3 text-sm">
          <option value="MEMBER">Member</option>
          <option value="TREASURER">Treasurer</option>
          {canInviteAdmin ? <option value="CHAPTER_LEAD">Chapter lead</option> : null}
          {canInviteAdmin ? <option value="ADMIN">Admin</option> : null}
        </select>
        <button type="submit" className="h-11 rounded-[4px] bg-secondary px-4 text-sm font-semibold text-primary-deep">
          Send invitation
        </button>
        <p className="text-sm text-muted" aria-live="polite">{notice}</p>
      </form>
      <ul className="divide-y divide-line rounded-[6px] border border-line bg-cream-flat">
        {members.map((member) => (
          <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">{member.name}</p>
              <p className="text-xs text-muted">{member.email} · {member.chapterName} · {member.active ? member.role : 'Inactive'}</p>
            </div>
            {member.active ? (
              <div className="flex flex-wrap gap-2">
                <select
                  defaultValue={member.role}
                  className="h-11 rounded-[4px] border border-line bg-cream px-2 text-sm"
                  onChange={async (event) => {
                    await changeRoleAction({ profileId: member.id, role: event.target.value });
                    router.refresh();
                  }}
                >
                  <option value="MEMBER">Member</option>
                  <option value="TREASURER">Treasurer</option>
                  <option value="CHAPTER_LEAD">Chapter lead</option>
                  {canInviteAdmin ? <option value="ADMIN">Admin</option> : null}
                </select>
                <button
                  type="button"
                  className="h-11 rounded-[4px] border border-line px-3 text-sm text-danger-ink"
                  onClick={async () => {
                    await deactivateMemberAction({ profileId: member.id });
                    router.refresh();
                  }}
                >
                  Deactivate
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <ul className="space-y-2">
        {invitations.map((invite) => (
          <li key={invite.id} className="flex items-center justify-between gap-2 text-sm">
            <span>{invite.email} · {invite.role}</span>
            <button
              type="button"
              className="h-11 px-3"
              onClick={async () => {
                const result = await resendInvitationAction({ invitationId: invite.id });
                setNotice(result.ok ? (result.data.inviteUrl ?? 'Resent.') : result.error);
              }}
            >
              Resend
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
