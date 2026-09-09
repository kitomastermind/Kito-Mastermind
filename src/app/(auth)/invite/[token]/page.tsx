import { Eyebrow } from '@/components/kito/Eyebrow';
import { InviteForm } from '@/app/(auth)/invite/[token]/invite-form';
import { loadInvitation } from '@/server/actions/invite';

const MESSAGES = {
  unknown: 'This invitation link is not recognised.',
  expired: 'This invitation has expired. Ask your chapter lead to send a new one.',
  revoked: 'This invitation was revoked. Ask your chapter lead for a new link.',
  accepted: 'This invitation has already been accepted. Sign in instead.',
} as const;

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await loadInvitation(token);

  return (
    <div className="text-center">
      <Eyebrow tone="onDark">CHAPTER NETWORK · MEMBERS ONLY</Eyebrow>
      <div className="shadow-login mt-8 rounded-[6px] border border-line bg-cream p-6 text-left text-ink">
        <h1 className="font-display text-2xl font-[450] text-primary">
          Join your chapter
        </h1>
        {invitation.state === 'valid' ? (
          <div className="mt-5">
            <InviteForm
              token={token}
              email={invitation.email}
              chapterName={invitation.chapterName}
              role={invitation.role}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">{MESSAGES[invitation.state]}</p>
        )}
      </div>
    </div>
  );
}
