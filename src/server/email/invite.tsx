import { render } from '@react-email/components';
import { EmailParagraph, KitoEmailLayout } from '@/server/email/layout';
import { sendEmail } from '@/server/email/send';

export async function renderInviteEmail(inviteUrl: string): Promise<{ html: string; text: string }> {
  const html = await render(
    <KitoEmailLayout
      preview="You have been invited to the private KITO Mastermind chapter network."
      title="You have been invited"
      ctaHref={inviteUrl}
      ctaLabel="Accept your invitation"
    >
      <EmailParagraph>
        A chapter lead invited you to KITO Mastermind, the private accountability circle for
        production chapters.
      </EmailParagraph>
      <EmailParagraph>
        This link expires in 14 days. After you accept, you will set your password and join your
        chapter. There is no public signup.
      </EmailParagraph>
    </KitoEmailLayout>,
  );
  const text = [
    'You have been invited to KITO Mastermind.',
    '',
    'Accept your invitation:',
    inviteUrl,
    '',
    'This link expires in 14 days. There is no public signup.',
  ].join('\n');
  return { html, text };
}

export async function sendInviteEmail(to: string, inviteUrl: string): Promise<void> {
  const rendered = await renderInviteEmail(inviteUrl);
  await sendEmail({
    to,
    subject: 'Your invitation to KITO Mastermind',
    html: rendered.html,
    text: rendered.text,
  });
}
