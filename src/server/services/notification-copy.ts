import type { Database } from '@/lib/types/database';

export type NotificationType = Database['public']['Enums']['notification_type'];

export type NotificationCopy = {
  title: string;
  body: string;
  linkPath: string | null;
};

/**
 * Copy inputs are redacted on purpose. Agent names, areas, types and dates only.
 * Never pass client name, phone, email or notes into this module.
 */
export type NotificationCopyInput = {
  otherName: string;
  areaLabel?: string;
  leadType?: string;
  dueLabel?: string;
  topicTitle?: string;
  pointsLabel?: string;
  matchId?: string;
  leadId?: string;
  topicId?: string;
};

export const NOTIFICATION_TYPES: readonly NotificationType[] = [
  'LEAD_MATCH',
  'ACCESS_REQUESTED',
  'ACCESS_GRANTED',
  'ACCESS_DENIED',
  'ACCESS_REVOKED',
  'ACCOUNTABILITY_DUE',
  'ACCOUNTABILITY_OVERDUE',
  'VERIFICATION_NEEDED',
  'ACTION_VERIFIED',
  'NUDGE',
  'CONTRIBUTION_DUE',
  'CONTRIBUTION_RECEIVED',
  'FORUM_TOPIC_OPENED',
  'FORUM_REPLY',
  'MATCH_MESSAGE',
  'DEAL_CONFIRMATION_NEEDED',
  'POINTS_AWARDED',
] as const;

export const IMMEDIATE_EMAIL_TYPES: readonly NotificationType[] = [
  'ACCESS_REQUESTED',
  'ACCESS_GRANTED',
  'VERIFICATION_NEEDED',
  'NUDGE',
  'MATCH_MESSAGE',
  'DEAL_CONFIRMATION_NEEDED',
] as const;

export function leadTypeLabel(type: string): string {
  return type.replaceAll('_', ' ').toLowerCase();
}

export function notificationCopy(
  type: NotificationType,
  input: NotificationCopyInput,
): NotificationCopy {
  const name = input.otherName;
  const area = input.areaLabel ?? 'your chapter';
  const kind = input.leadType ? leadTypeLabel(input.leadType) : 'lead';
  switch (type) {
    case 'LEAD_MATCH':
      return {
        title: 'New lead match found',
        body: `${name} logged a matching lead in ${area}.`,
        linkPath: '/leads',
      };
    case 'ACCESS_REQUESTED':
      return {
        title: 'Access request',
        body: `${name} requested contact access on a ${kind} lead in ${area}.`,
        linkPath: input.leadId ? `/leads/${input.leadId}` : '/leads',
      };
    case 'ACCESS_GRANTED':
      return {
        title: 'Access granted',
        body: `${name} approved your contact access request.`,
        linkPath: input.leadId ? `/leads/${input.leadId}` : '/leads',
      };
    case 'ACCESS_DENIED':
      return {
        title: 'Access not shared',
        body: `${name} is not sharing contact details for this lead.`,
        linkPath: '/leads',
      };
    case 'ACCESS_REVOKED':
      return {
        title: 'Access revoked',
        body: `${name} revoked contact access for a lead.`,
        linkPath: '/leads',
      };
    case 'ACCOUNTABILITY_DUE':
      return {
        title: 'Action due',
        body: `An action step is due${input.dueLabel ? ` ${input.dueLabel}` : ''}.`,
        linkPath: '/accountability',
      };
    case 'ACCOUNTABILITY_OVERDUE':
      return {
        title: 'Action overdue',
        body: `An action step is overdue${input.dueLabel ? ` since ${input.dueLabel}` : ''}.`,
        linkPath: '/accountability',
      };
    case 'VERIFICATION_NEEDED':
      return {
        title: 'Verification needed',
        body: `${name} marked an action complete. Please verify it.`,
        linkPath: '/accountability',
      };
    case 'ACTION_VERIFIED':
      return {
        title: 'Action verified',
        body: `${name} verified your action step.`,
        linkPath: '/accountability',
      };
    case 'NUDGE':
      return {
        title: 'Nudge',
        body: `${name} sent a nudge on an overdue action step.`,
        linkPath: '/accountability',
      };
    case 'CONTRIBUTION_DUE':
      return {
        title: 'Contribution due',
        body: `A chapter contribution is due${input.dueLabel ? ` ${input.dueLabel}` : ''}.`,
        linkPath: '/reports',
      };
    case 'CONTRIBUTION_RECEIVED':
      return {
        title: 'Contribution recorded',
        body: 'A contribution was recorded and added to the chapter ledger.',
        linkPath: '/reports',
      };
    case 'FORUM_TOPIC_OPENED':
      return {
        title: 'New monthly topic',
        body: input.topicTitle
          ? `This month’s topic is open: ${input.topicTitle}.`
          : 'A new monthly topic is open.',
        linkPath: '/forum',
      };
    case 'FORUM_REPLY':
      return {
        title: 'Forum reply',
        body: `${name} replied to your lesson.`,
        linkPath: input.topicId ? `/forum/${input.topicId}` : '/forum',
      };
    case 'MATCH_MESSAGE':
      return {
        title: 'New match message',
        body: `${name} sent a message in KITO Mastermind.`,
        linkPath: input.matchId ? `/matches/${input.matchId}` : '/leads',
      };
    case 'DEAL_CONFIRMATION_NEEDED':
      return {
        title: 'Deal confirmation needed',
        body: `${name} proposed a closed-business split. Confirm your share.`,
        linkPath: '/dashboard',
      };
    case 'POINTS_AWARDED':
      return {
        title: 'Points updated',
        body: input.pointsLabel
          ? `Points were awarded: ${input.pointsLabel}.`
          : 'Your points for this cycle were updated.',
        linkPath: '/points',
      };
  }
}

export function isImmediateEmailType(type: NotificationType): boolean {
  return IMMEDIATE_EMAIL_TYPES.includes(type);
}

export function digestWouldSkip(input: {
  emailDigest: boolean;
  unread: ReadonlyArray<{ type: NotificationType; emailedAt: string | null }>;
}): boolean {
  if (!input.emailDigest) return true;
  const pending = input.unread.filter(
    (row) => row.emailedAt === null && !isImmediateEmailType(row.type),
  );
  return pending.length === 0;
}
