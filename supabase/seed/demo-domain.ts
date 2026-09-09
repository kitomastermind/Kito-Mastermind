import { seedLeadsAccessForumPoints } from './leads-and-forum';
import { seedMoneyAndSessions } from './money-and-sessions';
import type { Admin, IdMap } from './util';
import { requireId } from './util';

export async function seedDemoDomain(
  admin: Admin,
  chapters: IdMap,
  areas: IdMap,
  cycles: IdMap,
  people: IdMap,
): Promise<void> {
  const nairobi = requireId(chapters, 'NBO');
  const grace = requireId(people, 'grace.wanjiru@kito.test');
  const daniel = requireId(people, 'daniel.otieno@kito.test');
  const amara = requireId(people, 'amara.njeri@kito.test');
  const kevin = requireId(people, 'kevin.mwangi@kito.test');
  const amina = requireId(people, 'amina.hassan@kito.test');
  const cycleId = requireId(cycles, 'NBO:Q3 2026');

  const nairobiMembers = Object.entries(people)
    .filter(([email]) => !email.startsWith('fatma') && !email.startsWith('tom.') && !email.startsWith('rose.'))
    .map(([, id]) => id);

  await seedMoneyAndSessions(admin, nairobi, cycleId, nairobiMembers, grace, daniel, amina);
  await seedLeadsAccessForumPoints(
    admin,
    nairobi,
    cycleId,
    areas,
    grace,
    amara,
    kevin,
    daniel,
    amina,
  );
}
