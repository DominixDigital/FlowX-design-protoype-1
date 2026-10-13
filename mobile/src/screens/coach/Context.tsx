import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Check } from 'lucide-react-native';
import { useStore } from 'ditcore/store/store';
import { fmtDate } from 'ditcore/store/selectors';
import { useCoach } from 'ditcore/surfaces/coach/useCoach';
import { useTheme } from '../../theme/ThemeProvider';
import { Banner, Card, Display, ListRow, Txt } from '../../ui';
import { useCompanionContext } from '../../companion/Companion';
import { CoachPage } from './parts';

const ROLE: Record<string, string> = { owner: 'Owner', head_coach: 'Head coach', coach: 'Coach', assistant: 'Assistant coach', parent: 'Parent', athlete: 'Athlete' };

/** CM01.02–03 · XS01: identify role, choose academy, handle parent+coach overlap. */
export function Context() {
  const { db, setPersona, personas } = useStore();
  const c = useCoach();
  const nav = useNavigation<any>();
  const t = useTheme();
  useCompanionContext({ surface: 'coach', title: 'Academy and role', prompts: ['What can you help with?'] });
  return (
    <CoachPage back>
      <View style={{ gap: 4 }}><Txt variant="small" muted>Signed in as {c.person.name}</Txt><Display size={40}>Choose academy</Display></View>
      <Card flush>
        {c.person.memberships.map((m, i) => {
          const ac = db.academies.find((a) => a.id === m.academyId)!;
          const isCurrent = personas.coach.academyId === m.academyId;
          const coachRole = ['head_coach', 'coach', 'assistant'].includes(m.role);
          return (
            <ListRow key={m.academyId + m.role} last={i === c.person.memberships.length - 1} label={ac.name} onPress={coachRole ? () => { setPersona('coach', { academyId: m.academyId }); nav.navigate('Tabs'); } : undefined}>
              <View style={{ flex: 1 }}>
                <Txt variant="small" strong>{ac.name}</Txt>
                <Txt variant="xs" muted>{coachRole ? `${ROLE[m.role]}${m.expiresOn ? ` · temporary until ${fmtDate(m.expiresOn)}` : ''}${m.status === 'removed' ? ' · access removed' : ''}` : `${ROLE[m.role]}: opens in the Parent app (web build)`}</Txt>
              </View>
              {isCurrent ? <Check size={18} color={t.roleText} accessibilityLabel="Current" /> : null}
            </ListRow>
          );
        })}
      </Card>
      {c.person.memberships.some((m) => m.role === 'parent') ? <Banner tone="info">You’re also a parent. Coaching and family views are kept apart: your child’s internal coaching notes never show in the Parent app, even to you.</Banner> : null}
      {c.membership?.expiresOn ? <Banner tone="warn">Temporary access ends {fmtDate(c.membership.expiresOn)}. After that, open tasks return to the head coach.</Banner> : null}
    </CoachPage>
  );
}
