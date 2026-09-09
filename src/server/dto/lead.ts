import type { Database } from '@/lib/types/database';

export type LeadType = Database['public']['Enums']['lead_type'];
export type PropertyType = Database['public']['Enums']['property_type'];
export type LeadTimeline = Database['public']['Enums']['lead_timeline'];
export type LeadStatus = Database['public']['Enums']['lead_status'];
export type LeadSource = Database['public']['Enums']['lead_source'];

export type RedactedLead = {
  id: string;
  ownerId: string;
  ownerName: string;
  chapterId: string;
  leadType: LeadType;
  propertyType: PropertyType | null;
  areaLabel: string | null;
  budgetMinCents: string | null;
  budgetMaxCents: string | null;
  timeline: LeadTimeline | null;
  status: LeadStatus;
  createdAt: string;
  contactVisible: false;
};

export type FullLead = Omit<RedactedLead, 'contactVisible'> & {
  contactVisible: true;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  notes: string | null;
  source: LeadSource | null;
};

export type LeadView = RedactedLead | FullLead;
