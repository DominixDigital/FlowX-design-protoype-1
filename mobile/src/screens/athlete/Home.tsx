import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CalendarCheck, ChevronRight, Medal } from 'lucide-react-native';
import { nowISO, uid, useStore } from 'ditcore/store/store';
import { TODAY } from 'ditcore/data/fixtures';
import { athleteById, coachById, currentFocus, fmtDate, relDay } from 'ditcore/store/selectors';
import { computeDitScore, scoreChange } from 'ditcore/score/ditScore';
import { ThemeProvider, ThemeScope, useTheme } from '../../theme/ThemeProvider';
import { Button, Card, Chip, Display, Row, Screen, Stack, StatusBadge, Txt } from '../../ui';
import { DitAvatar } from '../../ui/Dit';
import { ScoreDiscs } from '../../ui/score';
import { CompanionNudge, useCompanion, useCompanionContext } from '../../companion/Companion';
import { fonts, radius, raw, sheetFrame, space } from '../../theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AthleteTop, WeekDots } from './parts';
import { useAthlete } from './hooks';

/** AT02: focus home, Dit Score hero, session nudge, milestone celebration (Flow D). */
export function Home() {
  const { db, update } = useStore();
  const { a, first } = useAthlete();
  const { openCompanion } = useCompanion();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const t = useTheme();
  const { area, goal } = currentFocus(db, a.id);
  const tip = db.feedback.filter((f) => f.athleteId === a.id && f.status === 'published').sort((x, y) => y.publishedAt.localeCompare(x.publishedAt))[0];
  const comp = db.competitions.filter((c) => c.athleteIds.includes(a.id) && c.status !== 'completed').sort((x, y) => x.date.localeCompare(y.date))[0];
  const st = computeDitScore(db, a.id);
  const ch = scoreChange(db, a.id);
  const lastSession = db.sessions.filter((s) => s.status === 'completed' && s.attendance[a.id] === 'present').sort((x, y) => y.date.localeCompare(x.date))[0];
  const sessionFb = lastSession && db.feedback.some((f) => f.athleteId === a.id && f.sessionId === lastSession.id && f.status === 'published');
  const prefs = db.scorePrefs[a.id];
  const unseen = db.milestones.filter((m) => m.athleteId === a.id && m.visibleToFamily && !prefs?.seenMilestoneIds.includes(m.id)).sort((x, y) => y.date.localeCompare(x.date))[0];
  useCompanionContext({ surface: 'athlete', title: `${first} · Home`, athleteId: a.id, prompts: ['What’s my Dit Score?', 'Why did my Dit Score change?'] });

  // Demo shortcuts from the launcher: replay the first-run intro or the milestone.
  useEffect(() => {
    const p = route.params ?? {};
    if (p.intro) update((d) => { delete d.companionPrefs[`athlete:${db.people.find((x) => x.athleteId === a.id)?.id}`]; });
    if (p.milestone && a.id === 'a-tara') update((d) => { const s = d.scorePrefs['a-tara']; if (s) s.seenMilestoneIds = s.seenMilestoneIds.filter((x) => x !== 'm-3'); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AthleteTop />
      <Screen>
        <ThemeScope mode="floodlit" style={{ borderRadius: radius.lg, padding: space[4], gap: space[3], borderWidth: 1, borderColor: raw.char[400] }}>
          <Row between center={false}>
            <View style={{ flex: 1 }}>
              <Txt variant="xs" strong muted>Your Dit Score</Txt>
              {st.kind === 'scored' && ch ? <Txt variant="small" style={{ marginTop: 4 }}>{ch.delta > 0 ? `▲ ${ch.delta}` : ch.delta < 0 ? `▼ ${-ch.delta}` : 'Steady'} since {fmtDate(ch.since)}</Txt> : null}
              {st.kind === 'building' ? <Txt variant="small" style={{ marginTop: 4 }}>Building. Needs {st.missing[0]}</Txt> : null}
            </View>
            <StatusBadge tone="outline" label="Illustrative" />
          </Row>
          <View style={{ alignItems: 'center' }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Open my Dit Score" onPress={() => nav.navigate('Tabs', { screen: 'Score' })}><ScoreDiscs state={st} size={250} /></Pressable>
          </View>
          <Row gap={2} wrap>
            <Chip onPress={() => openCompanion({ ask: st.kind === 'scored' && ch ? 'Why did my Dit Score change?' : 'What’s my Dit Score?' })}>{st.kind === 'scored' && ch ? 'Why did it change?' : 'What is this?'}</Chip>
            <Chip onPress={() => nav.navigate('Tabs', { screen: 'Score' })}>Details</Chip>
          </Row>
        </ThemeScope>

        {lastSession ? (
          <Card onPress={() => nav.navigate('Session', { id: lastSession.id })} label="Open last session">
            <Row gap={3}>
              <CalendarCheck size={20} color={t.text} />
              <View style={{ flex: 1 }}>
                <Txt variant="xs" muted>Last session · {relDay(lastSession.date)}</Txt>
                <Txt variant="small" strong>{lastSession.title}</Txt>
                <Txt variant="xs" muted>{sessionFb ? 'Your coach shared feedback' : 'No feedback shared yet'}</Txt>
              </View>
              <ChevronRight size={16} color={t.textMuted} />
            </Row>
          </Card>
        ) : null}

        <Stack gap={1}>
          <Txt variant="xs" strong muted>Your focus</Txt>
          {area ? <Display size={44}>{area.title}</Display> : <Display size={40}>No focus set yet</Display>}
          {goal ? <Txt variant="small" muted style={{ marginTop: 4 }}>Goal: {goal.title}</Txt> : null}
        </Stack>

        {goal?.drill ? (
          <Card onPress={() => nav.navigate('Tabs', { screen: 'Practice' })} label="Open practice">
            <Stack gap={3}>
              <Txt variant="xs" strong muted>Next practice</Txt>
              <Txt variant="h2">{goal.drill.name}</Txt>
              <WeekDots goalId={goal.id} frequency={goal.drill.frequency} />
            </Stack>
          </Card>
        ) : null}

        {tip ? (
          <Card onPress={() => nav.navigate('FeedbackDetail', { id: tip.id })} label="Open latest feedback">
            <Txt variant="xs" strong muted>Latest from {coachById(db, tip.coachId)?.name.split(' ')[0]}</Txt>
            <Txt style={{ marginTop: 6 }}>“{tip.text}”</Txt>
          </Card>
        ) : null}

        {comp ? (
          <Card>
            <Row gap={3}>
              <Medal size={20} color={t.text} />
              <View style={{ flex: 1 }}>
                <Txt variant="small" strong>{comp.name}</Txt>
                <Txt variant="xs" muted>{fmtDate(comp.date, { weekday: 'short', day: 'numeric', month: 'short' })}{comp.status === 'changed' ? ' · changed' : ''}</Txt>
              </View>
            </Row>
          </Card>
        ) : null}

        {sessionFb && !unseen ? (
          <CompanionNudge id={`session-${lastSession.id}`} surface="athlete" text={`Good session${lastSession.date === TODAY ? ' today' : ''}! Want to see what improved?`} ask="How was my session?" />
        ) : null}
      </Screen>
      {unseen ? <MilestoneCelebration milestoneId={unseen.id} /> : null}
    </View>
  );
}

/** Flow D: a coach-verified milestone. Celebrate, explain, optionally share (a parent approves under 16). */
function MilestoneCelebration({ milestoneId }: { milestoneId: string }) {
  const { db, update, toast } = useStore();
  const { a, first, age } = useAthlete();
  const insets = useSafeAreaInsets();
  const m = db.milestones.find((x) => x.id === milestoneId)!;
  const area = db.areas.find((x) => x.id === m.areaId);
  const [step, setStep] = useState<'celebrate' | 'share'>('celebrate');
  const needsGuardian = age < 16;
  const done = (shared?: 'requested' | 'squad') => {
    update((d) => {
      const p = d.scorePrefs[a.id] ?? (d.scorePrefs[a.id] = { visibility: 'family', comparisonOptIn: false, seenMilestoneIds: [], shareRequests: [] });
      p.seenMilestoneIds.push(milestoneId);
      if (shared === 'requested') {
        const rid = uid('sr');
        p.shareRequests.push({ id: rid, milestoneId, status: 'pending', at: nowISO() });
        for (const g of athleteById(d, a.id)!.guardianIds) d.notifications.push({ id: uid('n'), personId: g, kind: 'share', title: `${first} wants to share a milestone`, body: m.title, route: '/parent', target: { type: 'share', id: rid }, createdAt: nowISO(), read: false });
      }
    });
    if (shared === 'requested') toast({ tone: 'ok', text: 'Asked a parent to approve. Nothing is shared until they say yes.' });
    if (shared === 'squad') toast({ tone: 'ok', text: 'Shared with your squad inside ditdit.' });
  };
  return (
    <Modal transparent animationType="slide" statusBarTranslucent visible onRequestClose={() => done()}>
      <ThemeProvider role="athlete" mode="floodlit">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ ...sheetFrame, backgroundColor: raw.char[700], borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space[5], paddingBottom: insets.bottom + space[5], gap: space[4], alignItems: 'center', borderWidth: 1, borderColor: raw.char[400] }}>
            <DitAvatar state="celebrating" form="face" size={72} />
            <Txt variant="xs" strong muted style={{ textAlign: 'center' }}>Milestone · confirmed by {coachById(db, area?.ownerId ?? 'c-rohan')?.name ?? 'your coach'} · {fmtDate(m.date)}</Txt>
            <Display size={36} style={{ textAlign: 'center' }}>{m.title}</Display>
            {step === 'celebrate' ? (
              <>
                <Row gap={3} center={false}><DitAvatar state="explaining" form="compact" size={26} still /><Txt style={{ flex: 1 }}>{area ? `This is real progress on ${area.title.toLowerCase()}. ` : ''}It counts towards your Dit Score as a coach-confirmed milestone.</Txt></Row>
                <Row gap={2} wrap><Button variant="highlight" onPress={() => setStep('share')}>Share it</Button><Button onPress={() => done()}>Keep it to myself</Button></Row>
              </>
            ) : (
              <>
                <View accessibilityLabel="Preview of the milestone card" style={{ alignSelf: 'stretch', padding: space[4], borderRadius: radius.md, backgroundColor: raw.char[500], borderWidth: 1, borderColor: raw.grey[500], gap: 4 }}>
                  <Text style={{ color: raw.grey[50], fontFamily: fonts.bodyBold, fontSize: 15 }}>{first} · {m.title}</Text>
                  <Txt variant="xs" muted>Confirmed by the coach · {fmtDate(m.date)} · ditdit</Txt>
                </View>
                <Txt variant="small" muted style={{ textAlign: 'center' }}>Only your squad and family can see shared milestones. There are no likes or public counts.</Txt>
                {needsGuardian ? <Button variant="highlight" onPress={() => done('requested')}>Ask a parent to approve</Button> : <Button variant="highlight" onPress={() => done('squad')}>Share with my squad</Button>}
                <Button variant="ghost" onPress={() => done()}>Not now</Button>
                {needsGuardian ? <Txt variant="xs" muted>Under 16, a parent approves before anything is shared. Assumption DS-06.</Txt> : null}
              </>
            )}
          </View>
        </View>
      </ThemeProvider>
    </Modal>
  );
}
