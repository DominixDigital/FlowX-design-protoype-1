import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Check } from 'lucide-react-native';
import { uid, useStore } from 'ditcore/store/store';
import { getKV } from 'ditcore/core/platform';
import { TODAY } from 'ditcore/data/fixtures';
import { currentFocus } from 'ditcore/store/selectors';
import { useTheme } from '../../theme/ThemeProvider';
import { Banner, Button, Card, Display, Screen, SectionTitle, Stack, StateBlock, Txt } from '../../ui';
import { Clip } from '../../ui/art';
import { useCompanionContext } from '../../companion/Companion';
import { AthleteTop, WeekDots } from './parts';
import { useAthlete } from './hooks';

/** AT03: the assigned drill, why it matters, and logging a practice. */
export function Practice() {
  const { db, update, toast } = useStore();
  const { a, first } = useAthlete();
  const nav = useNavigation<any>();
  const t = useTheme();
  const { goal } = currentFocus(db, a.id);
  const key = `ditdit-proto-v2:seen-drill:${a.id}`;
  const [seen, setSeen] = useState<string | null>(() => getKV().get(key));
  const video = goal ? db.videos.find((v) => v.goalId === goal.id && v.share === 'shared') : undefined;
  useCompanionContext({ surface: 'athlete', title: `${first} · Practice`, athleteId: a.id, videoId: video?.id, prompts: video ? ['Explain my coach’s comment'] : ['What can you help with?'] });
  const drillKey = goal?.drill ? `${goal.id}:${goal.drill.name}` : null;
  const changed = !!(drillKey && seen && seen !== drillKey);
  useEffect(() => { if (drillKey && !seen) { setSeen(drillKey); getKV().set(key, drillKey); } }, [drillKey, seen, key]);
  const doneToday = goal && db.practiceLogs.some((p) => p.goalId === goal.id && p.date === TODAY);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AthleteTop />
      <Screen>
        <Display size={44}>Practice</Display>
        {!goal?.drill ? <StateBlock kind="empty" title="No practice assigned" body="When your coach adds a drill to your goal, it shows up here." /> : (
          <>
            {changed ? <Banner tone="warn" action={<Button size="sm" onPress={() => { setSeen(drillKey); getKV().set(key, drillKey!); }}>Got it</Button>}>Your coach changed this drill since you last looked.</Banner> : null}
            <Card accent>
              <Stack gap={3}>
                <Txt variant="xs" strong color={t.roleText}>Drill · {goal.drill.frequency}</Txt>
                <Display size={34}>{goal.drill.name}</Display>
                <Txt>{goal.drill.instructions}</Txt>
                <WeekDots goalId={goal.id} frequency={goal.drill.frequency} />
              </Stack>
            </Card>
            <Card>
              <Txt variant="xs" strong muted>Why you’re doing it</Txt>
              <Txt style={{ marginTop: 4 }}>{goal.title}</Txt>
              <Txt variant="small" muted style={{ marginTop: 4 }}>Target: {goal.target}</Txt>
            </Card>
            {video ? (
              <Stack gap={2}>
                <SectionTitle>Watch first</SectionTitle>
                <Card flush onPress={() => nav.navigate('FeedbackDetail', { id: db.feedback.find((f) => f.videoId === video.id)?.id ?? '' })} label="Watch the clip"><Clip video={video} /></Card>
              </Stack>
            ) : null}
            <Button variant="highlight" size="lg" block disabled={!!doneToday} icon={<Check size={18} color={t.hlInk} />} onPress={() => {
              update((d) => d.practiceLogs.push({ id: uid('pl'), athleteId: a.id, goalId: goal.id, date: TODAY }));
              toast({ tone: 'ok', text: 'Logged. Your coach can see you practised today.' });
            }}>{doneToday ? 'Done for today' : 'I did this practice'}</Button>
            <Txt variant="xs" muted>Practice counts are self-reported, so they count for less in your Dit Score.</Txt>
          </>
        )}
      </Screen>
    </View>
  );
}
