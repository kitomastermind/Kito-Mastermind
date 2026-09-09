import { Html, Head, Body, Container, Text, Heading, render } from '@react-email/components';
import { sendEmail } from '@/server/email/send';

function KitoEmail({ title, body }: { title: string; body: string }) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#204559', margin: 0, padding: '32px 16px' }}>
        <Container
          style={{
            backgroundColor: '#f6f3ea',
            borderRadius: '6px',
            padding: '28px 24px',
            maxWidth: '420px',
          }}
        >
          <Text
            style={{
              fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
              fontSize: '11px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#9ba63e',
              margin: 0,
            }}
          >
            KITO Mastermind
          </Text>
          <Heading
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: '22px',
              fontWeight: 450,
              color: '#204559',
              margin: '12px 0',
            }}
          >
            {title}
          </Heading>
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '15px',
              lineHeight: '1.5',
              color: '#1b2e37',
              margin: 0,
            }}
          >
            {body}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderNotificationEmail(
  title: string,
  body: string,
): Promise<{ html: string; text: string }> {
  return {
    html: await render(<KitoEmail title={title} body={body} />),
    text: `${title}\n\n${body}`,
  };
}

export async function sendNotificationEmail(
  to: string,
  title: string,
  body: string,
): Promise<void> {
  const rendered = await renderNotificationEmail(title, body);
  await sendEmail({
    to,
    subject: title,
    html: rendered.html,
    text: rendered.text,
  });
}
