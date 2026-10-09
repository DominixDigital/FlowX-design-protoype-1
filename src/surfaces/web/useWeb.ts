import { useStore } from '../../store/store';

/** Capabilities = person + role + academy (build brief). Approval authority is an open decision — see policy.ts. */
export function useWeb() {
  const { db, personas } = useStore();
  const person = db.people.find((p) => p.id === personas.web.personId)!;
  const membership = person.memberships.find((m) => m.academyId === personas.web.academyId);
  const academy = db.academies.find((a) => a.id === personas.web.academyId)!;
  const role = membership?.role;
  const coach = db.coaches.find((c) => c.personId === person.id);
  return {
    person, academy, role, coach,
    actorName: person.name,
    canApprove: role === 'head_coach',
    canManageOrg: role === 'owner' || role === 'head_coach',
    canCoach: role === 'head_coach',
  };
}
