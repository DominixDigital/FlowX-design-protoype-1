import { View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore } from 'ditcore/store/store';
import { coachById, fmtDate } from 'ditcore/store/selectors';
import { ThemeScope, useTheme } from '../../theme/ThemeProvider';
import { Card, Chip, Display, Row, Screen, StateBlock, Txt } from '../../ui';
import { DitAvatar } from '../../ui/Dit';
import { useCompanion, useCompanionContext } from '../../companion/Companion';
import { radius, raw, space } from '../../theme/tokens';
import { AthleteTop } from './parts';
import { useAthlete } from './hooks';

/** Flow B: session summary as a guided conversation over coach-approved items only. */
export function Session() {
  const { id } = useRoute<any>().params;
  const nav = useNavigation<any>();
  const { db } = useStore();
  const { a, first } = useAthlete();
  const { openCompanion } = useCompanion();
  const t = useTheme();
  const s = db.sessions.find((x) => x.id === id);
  const fb = db.feedback.filter((f) => f.athleteId === a.id && f.sessionId === id && f.status === 'published');
  useCompanionContext(s ? { surface: 'athlete', title: `${first} · ${s.title}`, athleteId: a.id, sessionId: s.id, prompts: ['How was my session?', 'What should I improve?'] } : null);
  if (!s || s.attendance[a.id] === undefined) return <View style={{ flex: 1, backgroundColor: t.bg }}><AthleteTop back /><Screen><StateBlock kind="archived" title="This session isn’t available" /></Screen></View>;
  const mark = s.attendance[a.id];
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AthleteTop back />
      <Screen>
        <View style={{ gap: 4 }}>
          <Txt variant="small" muted>{fmtDate(s.date, { weekday: 'long', day: 'numeric', month: 'long' })}</Txt>
          <Display size={40}>{s.title}</Display>
          <Txt variant="small">{mark === 'present' ? 'You were there' : mark === 'absent' ? 'Marked absent' : 'Not marked yet'}</Txt>
        </View>
        <ThemeScope mode="floodlit" style={{ borderRadius: radius.lg, padding: space[4], gap: space[3], borderWidth: 1, borderColor: raw.char[400] }}>
          <Row gap={3} center={false}>
            <DitAvatar state={fb.length ? 'insight' : 'uncertain'} form="face" size={44} />
            <Txt style={{ flex: 1 }}>{fb.length ? 'Good session! Your coach shared feedback. Want to see what improved?' : 'Your coach hasn’t shared feedback for this session yet. I only talk about what your coach approves.'}</Txt>
          </Row>
          {fb.length > 0 ? <Row gap={2} wrap><Chip onPress={() => openCompanion({ ask: 'What improved?' })}>Show me</Chip><Chip onPress={() => openCompanion({ ask: 'What should I improve?' })}>What should I improve?</Chip></Row> : null}
        </ThemeScope>
        {fb.map((f) => (
          <Card key={f.id} onPress={() => nav.navigate('FeedbackDetail', { id: f.id })} label="Open feedback">
            <Txt variant="xs" strong muted>From {coachById(db, f.coachId)?.name}{f.aiDrafted ? ' · drafted with dit, approved by your coach' : ''}</Txt>
            <Txt style={{ marginTop: 6 }}>“{f.text}”</Txt>
            {f.videoId ? <Txt variant="xs" muted style={{ marginTop: 6 }}>Includes a clip with coach notes</Txt> : null}
          </Card>
        ))}
        <Txt variant="xs" muted>Only coach-approved feedback appears here. Raw coach notes stay with your coaches.</Txt>
      </Screen>
    </View>
  );
}
