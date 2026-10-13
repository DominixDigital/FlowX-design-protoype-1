import { useStore } from 'ditcore/store/store';
import { ageOn, athleteById } from 'ditcore/store/selectors';

export function useAthlete() {
  const { db, personas } = useStore();
  const person = db.people.find((p) => p.id === personas.athlete.personId)!;
  const a = athleteById(db, person.athleteId)!;
  return { person, a, first: a.name.split(' ')[0], viaParent: a.access === 'parent_device', age: ageOn(a.born) };
}
