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
    <div className="mx-auto w-full max-w-[420px]">
      <div className="mb-6 text-center">
        <Eyebrow tone="onDark">Chapter circle · members only</Eyebrow>
      </div>
      <div className="shadow-login rounded-2xl bg-white p-6 text-left text-[#0E1F1A]">
        <h1 className="text-lg font-bold text-[#0E1F1A]">
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
          <p className="mt-4 text-sm text-[#5A6B7D]">{MESSAGES[invitation.state]}</p>
        )}
      </div>
    </div>
  );
}
