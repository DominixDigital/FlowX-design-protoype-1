import { useStore } from '../../store/store';
import { TODAY } from '../../data/fixtures';

/** Resolves the signed-in coach's capabilities from person + role + academy + object state (build brief). */
export function useCoach() {
  const { db, personas } = useStore();
  const p = personas.coach;
  const person = db.people.find((x) => x.id === p.personId)!;
  const membership = person.memberships.find((m) => m.academyId === p.academyId);
  const academy = db.academies.find((a) => a.id === p.academyId)!;
  const coach = db.coaches.find((c) => c.personId === person.id && c.academyId === p.academyId);
  const expired = !!membership?.expiresOn && membership.expiresOn < TODAY;
  const isCoachRole = !!membership && ['head_coach', 'coach', 'assistant'].includes(membership.role);
  const canAct = !!membership && membership.status === 'active' && !expired && isCoachRole && coach?.status === 'active';

  // Assistants only see athletes they hold work for (XS01.07, XS02.S02)
  let scopeAthleteIds: string[] | 'all' = 'all';
  if (membership?.role === 'assistant' && coach) {
    scopeAthleteIds = Array.from(new Set([
      ...db.tasks.filter((t) => t.assigneeId === coach.id).map((t) => t.athleteId),
      ...db.handovers.filter((h) => h.toId === coach.id).map((h) => h.athleteId),
      ...db.athletes.filter((a) => a.supportingCoachIds.includes(coach.id)).map((a) => a.id),
    ]));
  }
  const inScope = (athleteId: string) => scopeAthleteIds === 'all' || scopeAthleteIds.includes(athleteId);

  return { person, membership, academy, coach, canAct, expired, isCoachRole, scopeAthleteIds, inScope, role: membership?.role };
}

export function denyReason(c: ReturnType<typeof useCoach>) {
  if (!c.membership) return 'You don’t belong to this academy.';
  if (c.membership.status === 'removed') return `Your access to ${c.academy.name} was removed by an admin. Anything already saved is kept.`;
  if (c.expired) return `Your temporary access ended on ${c.membership.expiresOn}. Ask the head coach to extend it.`;
  if (!c.isCoachRole) return `You’re a ${c.membership.role} at ${c.academy.name}, not a coach. Open the Parent App for this academy.`;
  return 'You don’t have permission to do this.';
}
