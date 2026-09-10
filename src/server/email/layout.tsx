import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { ReactNode } from 'react';
import { EMAIL } from '@/server/email/tokens';

export function KitoEmailLayout({
  preview,
  title,
  children,
  ctaHref,
  ctaLabel,
}: {
  preview: string;
  title: string;
  children: ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: EMAIL.forest, margin: 0, padding: '32px 16px' }}>
        <Container
          style={{
            backgroundColor: EMAIL.paper,
            borderRadius: '10px',
            maxWidth: '520px',
            overflow: 'hidden',
          }}
        >
          <Section style={{ backgroundColor: EMAIL.forest, padding: '22px 28px 18px' }}>
            <Text
              style={{
                color: EMAIL.lime,
                fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.18em',
                margin: '0 0 10px',
                textTransform: 'uppercase',
              }}
            >
              {EMAIL.eyebrow}
            </Text>
            <Text
              style={{
                color: EMAIL.paper,
                fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              KITO <span style={{ color: EMAIL.lime }}>Mastermind</span>
            </Text>
          </Section>
          <Section style={{ height: '4px', backgroundColor: EMAIL.lime, padding: 0 }} />
          <Section style={{ padding: '28px 28px 8px' }}>
            <Heading
              style={{
                color: EMAIL.ink,
                fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: '1.25',
                margin: '0 0 16px',
              }}
            >
              {title}
            </Heading>
            {children}
            {ctaHref && ctaLabel ? (
              <Button
                href={ctaHref}
                style={{
                  backgroundColor: EMAIL.forest,
                  borderRadius: '8px',
                  color: EMAIL.paper,
                  display: 'inline-block',
                  fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
                  fontSize: '15px',
                  fontWeight: 700,
                  margin: '8px 0 12px',
                  padding: '14px 22px',
                  textDecoration: 'none',
                }}
              >
                {ctaLabel}
              </Button>
            ) : null}
          </Section>
          <Section style={{ padding: '0 28px 28px' }}>
            <Hr style={{ borderColor: '#E3E7E0', margin: '8px 0 16px' }} />
            <Text
              style={{
                color: EMAIL.muted,
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '12px',
                lineHeight: '1.5',
                margin: 0,
              }}
            >
              {EMAIL.footer}
            </Text>
            <Text
              style={{
                color: EMAIL.gold,
                fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
                fontSize: '10px',
                letterSpacing: '0.14em',
                margin: '12px 0 0',
                textTransform: 'uppercase',
              }}
            >
              KITO Mastermind © 2026
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailParagraph({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        color: EMAIL.ink,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '15px',
        lineHeight: '1.55',
        margin: '0 0 14px',
      }}
    >
      {children}
    </Text>
  );
}
