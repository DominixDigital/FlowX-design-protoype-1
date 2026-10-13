import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight, Smartphone, User } from 'lucide-react-native';
import { useStore } from 'ditcore/store/store';
import type { Surface } from 'ditcore/data/types';
import { computeDitScore } from 'ditcore/score/ditScore';
import { ThemeProvider } from '../theme/ThemeProvider';
import { fonts, radius, raw, space } from '../theme/tokens';
import { Display, Row, Screen, Stack, Txt } from '../ui';
import { DitAvatar, Wordmark } from '../ui/Dit';
import { ScoreDiscs } from '../ui/score';
import { goToPath } from '../navigation/ref';

const APPS: { surface: 'athlete' | 'coach'; name: string; who: string; role: 'athlete' | 'coach'; Icon: typeof User; home: string; personas: { id: string; label: string; academy?: string }[] }[] = [
  { surface: 'athlete', role: 'athlete', name: 'Athlete', who: 'Focus, practice, feedback, Dit Score', Icon: User, home: '/athlete',
    personas: [{ id: 'p-tara', label: 'Tara Singh · 13, own login' }, { id: 'p-kabir', label: 'Kabir Singh · 15, parent’s device' }] },
  { surface: 'coach', role: 'coach', name: 'Coach', who: 'Courtside sessions, notes, reassessment, offline', Icon: Smartphone, home: '/coach',
    personas: [{ id: 'p-neha', label: 'Neha Rao · coach, U16 Elite' }, { id: 'p-rohan', label: 'Rohan Shah · head coach' }, { id: 'p-arjun', label: 'Arjun Patel · temporary assistant' }, { id: 'p-sanjay', label: 'Sanjay Menon · coach at Harbour', academy: 'ac-harbour' }] },
];

const FLOWS: { k: string; label: string; surface: 'athlete' | 'coach'; person: string; to: string }[] = [
  { k: 'A', label: 'Meet dit for the first time', surface: 'athlete', person: 'p-tara', to: '/athlete?intro=1' },
  { k: 'B', label: 'Explain my mistake', surface: 'athlete', person: 'p-tara', to: '/athlete/session/s-0991' },
  { k: 'C', label: 'Understand my Dit Score', surface: 'athlete', person: 'p-tara', to: '/athlete/score' },
  { k: 'D', label: 'Celebrate a milestone', surface: 'athlete', person: 'p-tara', to: '/athlete?milestone=1' },
  { k: 'E', label: 'Coach note → approved feedback', surface: 'coach', person: 'p-neha', to: '/coach/athlete/a-kabir?session=s-1005' },
  { k: 'G', label: 'Squad progress comparison', surface: 'athlete', person: 'p-kabir', to: '/athlete/score/compare' },
];

export function Launcher() {
  const { setPersona, db } = useStore();
  const nav = useNavigation<any>();
  const tara = computeDitScore(db, 'a-tara');

  const go = (s: Surface, personId: string, academyId = 'ac-velocity', to = '') => {
    setPersona(s, { personId, academyId });
    const root = s === 'coach' ? 'Coach' : 'Athlete';
    nav.navigate(root);
    if (to && to !== (s === 'coach' ? '/coach' : '/athlete')) setTimeout(() => goToPath(to), 0);
  };

  return (
    <ThemeProvider role="athlete" mode="floodlit">
      <Screen bottomPad={40} style={{ paddingTop: 56 }}>
        <Wordmark size={34} />
        <Stack gap={3}>
          <Display size={52}>What’s your{'\n'}Dit Score?</Display>
          <Txt muted>ditdit turns everyday coaching into a development story athletes understand. Coaches stay the source of truth, ditdit keeps the record, and dit, the companion, explains it.</Txt>
        </Stack>
        <View style={{ padding: space[4], borderRadius: radius.xl, backgroundColor: raw.char[500], borderWidth: 1, borderColor: raw.char[400], alignItems: 'center', gap: space[3] }}>
          <ScoreDiscs state={tara} size={270} />
          <Row gap={2} center={false}>
            <DitAvatar state="insight" form="face" size={34} />
            <Txt variant="small" muted style={{ flex: 1, maxWidth: 240 }}>“Your score went up since last week. Want to see why?”</Txt>
          </Row>
          <Txt variant="xs" faint style={{ textAlign: 'center' }}>Tara’s illustrative score, calculated from prototype records</Txt>
        </View>

        <Txt variant="h2">Open an app</Txt>
        <Stack gap={3}>
          {APPS.map((app) => {
            const hl = app.role === 'coach' ? raw.teal[500] : raw.grey[500];
            return (
              <View key={app.surface} style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: raw.char[400], backgroundColor: raw.char[600], overflow: 'hidden' }}>
                <View style={{ height: 6, backgroundColor: hl }} />
                <View style={{ padding: space[4], gap: space[3] }}>
                  <Row gap={3}><app.Icon size={22} color={hl} /><Txt variant="h2">{app.name}</Txt></Row>
                  <Txt variant="small" muted>{app.who}</Txt>
                  <Stack gap={2}>
                    {app.personas.map((p) => (
                      <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`Open ${app.name} as ${p.label}`} onPress={() => go(app.surface, p.id, p.academy)}
                        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingHorizontal: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: raw.char[400], opacity: pressed ? 0.7 : 1 })}>
                        <Text style={{ flex: 1, color: raw.grey[50], fontFamily: fonts.body, fontSize: 14 }}>{p.label}</Text>
                        <ChevronRight size={16} color={raw.grey[600]} />
                      </Pressable>
                    ))}
                  </Stack>
                </View>
              </View>
            );
          })}
        </Stack>

        <Txt variant="h2">Companion and score journeys</Txt>
        <Stack gap={2}>
          {FLOWS.map((f) => (
            <Pressable key={f.k} accessibilityRole="button" onPress={() => go(f.surface, f.person, 'ac-velocity', f.to)}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, borderColor: raw.char[400], backgroundColor: raw.char[600], opacity: pressed ? 0.7 : 1 })}>
              <Text style={{ width: 22, fontFamily: fonts.display, fontSize: 24, color: raw.grey[600] }}>{f.k}</Text>
              <Text style={{ flex: 1, color: raw.grey[50], fontFamily: fonts.bodySemi, fontSize: 14 }}>{f.label}</Text>
            </Pressable>
          ))}
        </Stack>
        <Txt variant="xs" faint>A prototype with fixture data for Velocity Cricket Academy. Both apps share one store. dit uses demo logic, and open questions may go to an AI model and are labelled. The Dit Score uses an illustrative method that still has to be validated. The parent app and academy web dashboard live in the web build.</Txt>
      </Screen>
    </ThemeProvider>
  );
}
