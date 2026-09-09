export type DashboardMatch = {
  ownerName: string;
  loggedAt: string;
  chapterName: string;
  score: number;
  facets: { label: string; kind: 'exact' | 'partial' }[];
  otherLeadId: string;
  matchId: string;
};

export type DashboardModel = {
  actorId: string;
  greeting: string;
  firstName: string;
  eyebrow: string;
  nextSession: string;
  pointsValue: string | null;
  pointsSub: string;
  segments: { label: string; points: number; color: string }[];
  responseValue: string | null;
  responseSub: string;
  volumeValue: string | null;
  volumeSub: string;
  referralsValue: string;
  referralsSub: string;
  actions: { title: string; meta: string; status: string }[];
  pipeline: { memberName: string; activeCount: number; stages: boolean[]; leadingIndex: number }[] | null;
  match: DashboardMatch | null;
  topic: {
    title: string;
    prompt: string;
    topHeadline: string | null;
    topAuthor: string | null;
  } | null;
  deals: {
    id: string;
    saleVolumeLabel: string;
    closedAt: string;
    verifiedAt: string | null;
    participants: { profileId: string; confirmedAt: string | null }[];
  }[];
  canVerifyDeals: boolean;
};
