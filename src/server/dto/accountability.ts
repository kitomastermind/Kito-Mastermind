export type ActionStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'VERIFIED'
  | 'OVERDUE';

export type AccountabilityActionView = {
  id: string;
  description: string;
  dueDate: string;
  status: ActionStatus;
  ownerId: string;
  ownerName: string;
  partnerId: string | null;
  partnerName: string | null;
  sessionHeldAt: string | null;
  completedAt: string | null;
  verifiedAt: string | null;
  nudgedAt: string | null;
  chapterId: string;
};

export type PairingView = {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerEmail: string | null;
  startedAt: string;
  chapterName: string;
  mutualRate: string;
  stepsTogether: number;
};

export type PastPartnerView = {
  partnerId: string;
  partnerName: string;
  mutualRate: string;
  endedAt: string;
};

export type SessionOption = {
  id: string;
  heldAt: string;
};

export type AccountabilityStats = {
  completionRate: string;
  streak: string;
  completedAllTime: string;
  chapterAverage: string;
};

export type TrendPoint = {
  label: string;
  rate: number;
};

export type AccountabilityPageModel = {
  stats: AccountabilityStats;
  pairing: PairingView | null;
  myActions: AccountabilityActionView[];
  partnerActions: AccountabilityActionView[];
  sessions: SessionOption[];
  trend: TrendPoint[];
  pastPartners: PastPartnerView[];
  chapterName: string;
  actorName: string;
  actorId: string;
};
