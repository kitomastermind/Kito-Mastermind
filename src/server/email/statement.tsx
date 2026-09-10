import { render } from '@react-email/components';
import { EmailParagraph, KitoEmailLayout } from '@/server/email/layout';
import { sendEmail } from '@/server/email/send';
import { absoluteAppUrl } from '@/server/email/tokens';

export async function sendStatementEmail(
  to: string,
  input: { reference: string; format: string },
): Promise<void> {
  const href = absoluteAppUrl('/reports');
  const title = 'Statement generated';
  const body = `Your ${input.format} statement ${input.reference} is ready in Reports archive.`;
  const html = await render(
    <KitoEmailLayout preview={body} title={title} ctaHref={href} ctaLabel="Open Reports">
      <EmailParagraph>{body}</EmailParagraph>
      <EmailParagraph>
        The file is stored in your private archive and is only available through a short-lived
        signed link.
      </EmailParagraph>
    </KitoEmailLayout>,
  );
  await sendEmail({
    to,
    subject: title,
    html,
    text: `${title}\n\n${body}\n\n${href}`,
  });
}
