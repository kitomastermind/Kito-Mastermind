export type ContributionType = 'DUES' | 'FINE' | 'EVENT_FEE' | 'DONATION';
export type PaymentMethod = 'MPESA' | 'CASH' | 'BANK_TRANSFER';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REVERSED';

export type ContributionView = {
  id: string;
  profileId: string;
  chapterId: string;
  type: ContributionType;
  description: string;
  amountCents: string;
  amountLabel: string;
  method: PaymentMethod | null;
  status: PaymentStatus;
  dueDate: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  periodKey: string | null;
  createdAt: string;
};

export type ReportsStats = {
  cycleLabel: string;
  cycleSub: string;
  allTimeLabel: string;
  outstandingLabel: string;
  outstandingSub: string;
  outstandingWarn: boolean;
  chapterCycleLabel: string;
};

export type MonthBar = {
  month: string;
  shillings: number;
};

export type StatementArchiveItem = {
  id: string;
  reference: string;
  format: 'PDF' | 'CSV';
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
};
