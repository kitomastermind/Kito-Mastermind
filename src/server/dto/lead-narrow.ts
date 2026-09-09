import type { LeadView } from '@/server/dto/lead';

/** Type-level guard: reading clientPhone without narrowing must not typecheck. */
export function mustNarrow(lead: LeadView): string {
  if (lead.contactVisible) {
    return lead.clientPhone;
  }
  // @ts-expect-error clientPhone requires contactVisible === true
  return lead.clientPhone;
}
