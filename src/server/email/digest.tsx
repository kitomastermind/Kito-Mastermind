import { render, Text } from '@react-email/components';
import { EmailParagraph, KitoEmailLayout } from '@/server/email/layout';
import { sendEmail } from '@/server/email/send';
import { EMAIL, absoluteAppUrl } from '@/server/email/tokens';

export type DigestItem = {
  title: string;
  body: string;
};

export async function renderDigestEmail(
  items: readonly DigestItem[],
): Promise<{ html: string; text: string }> {
  const inbox = absoluteAppUrl('/notifications');
  const html = await render(
    <KitoEmailLayout
      preview={`You have ${items.length} update${items.length === 1 ? '' : 's'} in KITO Mastermind.`}
      title="Your daily digest"
      ctaHref={inbox}
      ctaLabel="Open inbox"
    >
      <EmailParagraph>
        Here is what waited for you overnight. Immediate alerts were already sent separately.
      </EmailParagraph>
      {items.map((item, index) => (
        <Text
          key={`${index}:${item.title}`}
          style={{
            borderLeft: `3px solid ${EMAIL.lime}`,
            color: EMAIL.ink,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '14px',
            lineHeight: '1.5',
            margin: '0 0 12px',
            padding: '0 0 0 12px',
          }}
        >
          <strong>{item.title}</strong>
          <br />
          {item.body}
        </Text>
      ))}
    </KitoEmailLayout>,
  );
  const text = [
    'Your KITO Mastermind digest',
    '',
    ...items.map((item) => `${item.title}: ${item.body}`),
    '',
    inbox,
  ].join('\n');
  return { html, text };
}

export async function sendDigestEmail(to: string, items: readonly DigestItem[]): Promise<void> {
  const rendered = await renderDigestEmail(items);
  await sendEmail({
    to,
    subject: 'Your KITO Mastermind digest',
    html: rendered.html,
    text: rendered.text,
  });
}
