import { render } from '@react-email/components';
import { EmailParagraph, KitoEmailLayout } from '@/server/email/layout';
import { sendEmail } from '@/server/email/send';
import { absoluteAppUrl } from '@/server/email/tokens';

export async function renderNotificationEmail(
  title: string,
  body: string,
  options?: { href?: string | null; ctaLabel?: string },
): Promise<{ html: string; text: string }> {
  const href = options?.href ? absoluteAppUrl(options.href) : undefined;
  const html = await render(
    <KitoEmailLayout
      preview={body}
      title={title}
      ctaHref={href}
      ctaLabel={href ? (options?.ctaLabel ?? 'Open in KITO') : undefined}
    >
      <EmailParagraph>{body}</EmailParagraph>
    </KitoEmailLayout>,
  );
  const text = [title, '', body, href ? `\n${href}` : ''].filter(Boolean).join('\n');
  return { html, text };
}

export async function sendNotificationEmail(
  to: string,
  title: string,
  body: string,
  options?: { href?: string | null; ctaLabel?: string },
): Promise<void> {
  const rendered = await renderNotificationEmail(title, body, options);
  await sendEmail({
    to,
    subject: title,
    html: rendered.html,
    text: rendered.text,
  });
}
