export type PairingMember = {
  id: string;
  name: string;
};

export type PairHistory = {
  a: string;
  b: string;
  cyclesAgo: number;
};

export type SuggestedGroup = {
  memberIds: string[];
  kind: 'pair' | 'triple';
  cyclesSince: number | null;
};

function pairKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

function lastPaired(
  a: string,
  b: string,
  history: ReadonlyArray<PairHistory>,
): number {
  let best = Number.POSITIVE_INFINITY;
  for (const row of history) {
    if (pairKey(row.a, row.b) !== pairKey(a, b)) continue;
    if (row.cyclesAgo < best) best = row.cyclesAgo;
  }
  return best;
}

function groupCyclesSince(
  ids: readonly string[],
  history: ReadonlyArray<PairHistory>,
): number | null {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const a = ids[i];
      const b = ids[j];
      if (!a || !b) continue;
      const since = lastPaired(a, b, history);
      if (since < best) best = since;
    }
  }
  return Number.isFinite(best) ? best : null;
}

function pickPartner(
  memberId: string,
  remaining: PairingMember[],
  history: ReadonlyArray<PairHistory>,
): PairingMember {
  const ranked = [...remaining].sort((left, right) => {
    const leftSince = lastPaired(memberId, left.id, history);
    const rightSince = lastPaired(memberId, right.id, history);
    if (rightSince !== leftSince) return rightSince - leftSince;
    return left.id.localeCompare(right.id);
  });
  const chosen = ranked[0];
  if (!chosen) {
    throw new Error('No partner available');
  }
  return chosen;
}

export function suggestPairings(
  members: ReadonlyArray<PairingMember>,
  history: ReadonlyArray<PairHistory>,
): SuggestedGroup[] {
  const remaining = [...members].sort((a, b) => a.id.localeCompare(b.id));
  const groups: SuggestedGroup[] = [];
  while (remaining.length > 0) {
    if (remaining.length === 1) {
      break;
    }
    if (remaining.length === 3) {
      const ids = remaining.map((row) => row.id);
      groups.push({
        memberIds: ids,
        kind: 'triple',
        cyclesSince: groupCyclesSince(ids, history),
      });
      remaining.length = 0;
      break;
    }
    const head = remaining.shift();
    if (!head) break;
    const partner = pickPartner(head.id, remaining, history);
    const partnerIndex = remaining.findIndex((row) => row.id === partner.id);
    if (partnerIndex >= 0) remaining.splice(partnerIndex, 1);
    const ids = [head.id, partner.id];
    groups.push({
      memberIds: ids,
      kind: 'pair',
      cyclesSince: groupCyclesSince(ids, history),
    });
  }
  return groups;
}
