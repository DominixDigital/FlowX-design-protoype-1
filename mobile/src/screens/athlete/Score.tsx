import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight, Home as HomeIcon, Lock, ShieldCheck, Trophy, User, Users } from 'lucide-react-native';
import { useStore } from 'ditcore/store/store';
import { coachById, currentFocus, fmtDate } from 'ditcore/store/selectors';
import type { ScoreVisibility } from 'ditcore/data/types';
import { computeDitScore, personalBest, scoreChange, squadComparison } from 'ditcore/score/ditScore';
import { ThemeScope, useTheme } from '../../theme/ThemeProvider';
import { Banner, Button, Card, Chip, Display, ListRow, Row, Screen, SectionTitle, Stack, StateBlock, Txt } from '../../ui';
import { DitAvatar } from '../../ui/Dit';
import { ScoreBreakdown, ScoreDiscs, ScoreTrend } from '../../ui/score';
import { useCompanion, useCompanionContext } from '../../companion/Companion';
import { radius, raw, space } from '../../theme/tokens';
import { AthleteTop } from './parts';
import { useAthlete } from './hooks';

/** Flow C: understanding my Dit Score. */
export function ScoreScreen() {
  const { db, update, toast } = useStore();
  const { a, first, age } = useAthlete();
  const { openCompanion } = useCompanion();
  const nav = useNavigation<any>();
  const t = useTheme();
  const st = computeDitScore(db, a.id);
  const ch = scoreChange(db, a.id);
  const pb = personalBest(db, a.id);
  const review = db.scoreReviews.find((r) => r.athleteId === a.id);
  const prefs = db.scorePrefs[a.id] ?? { visibility: 'family' as ScoreVisibility, comparisonOptIn: false, seenMilestoneIds: [], shareRequests: [] };
  const { area, goal } = currentFocus(db, a.id);
  const ms = db.milestones.filter((m) => m.athleteId === a.id && m.visibleToFamily).sort((x, y) => y.date.localeCompare(x.date));
  const approved = db.reassessments.filter((r) => r.athleteId === a.id && r.status === 'approved');
  useCompanionContext({ surface: 'athlete', title: `${first} · Dit Score`, athleteId: a.id, prompts: ['Why did my Dit Score change?', 'How can I improve my Dit Score?', 'What counts towards the Dit Score?'] });

  const setVis = (v: ScoreVisibility) => {
    update((d) => { const p = d.scorePrefs[a.id] ?? (d.scorePrefs[a.id] = { ...prefs }); p.visibility = v; });
    toast({ tone: 'ok', text: 'Sharing updated.' });
  };
  const visOptions: { v: ScoreVisibility; label: string; Icon: typeof User; note: string }[] = [
    { v: 'coaches', label: 'Me and my coaches', Icon: User, note: 'Coaches always see it: they check the data behind it.' },
    { v: 'family', label: '+ my family', Icon: HomeIcon, note: 'Your linked parents or guardians.' },
    { v: 'squad', label: '+ my squad', Icon: Users, note: 'Teammates in your batch, inside ditdit only.' },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AthleteTop />
      <Screen>
        <Display size={44}>Dit Score</Display>
        <ThemeScope mode="floodlit" style={{ borderRadius: radius.lg, padding: space[4], gap: space[3], borderWidth: 1, borderColor: raw.char[400] }}>
          {st.kind === 'paused' ? <StateBlock kind="permission" title="Paused by your coach" body="Your coach is checking the data behind your score. Nothing you did is wrong; it comes back once they’re done." />
            : st.kind === 'disabled' ? <StateBlock kind="empty" title="Dit Scores are off at your academy" />
              : (
                <>
                  <View style={{ alignItems: 'center' }}><ScoreDiscs state={st} size={290} /></View>
                  {st.kind === 'scored' ? (
                    <View style={{ gap: 2, alignItems: 'center' }}>
                      <Txt variant="small">{ch ? `${ch.delta >= 0 ? '▲' : '▼'} ${Math.abs(ch.delta)} since ${fmtDate(ch.since)}` : 'First week with enough data'}{pb !== null ? `  ·  Best ${pb}` : ''}</Txt>
                      <Txt variant="xs" muted style={{ textAlign: 'center' }}>{review && !review.paused ? `Inputs checked by ${coachById(db, review.reviewedById)?.name.split(' ')[0]} ${fmtDate(review.at)}` : 'Not yet checked by a coach'}</Txt>
                    </View>
                  ) : null}
                  {st.kind === 'building' ? <Row gap={3} center={false}><DitAvatar state="uncertain" form="compact" size={26} still /><Txt style={{ flex: 1 }}>I won’t guess a score. Still needed: {st.missing.join(' and ')}.</Txt></Row> : null}
                  <Row gap={2} wrap>
                    <Chip onPress={() => openCompanion({ ask: 'Why did my Dit Score change?' })}>Why did it change?</Chip>
                    <Chip onPress={() => openCompanion({ ask: 'How can I improve my Dit Score?' })}>How can I improve?</Chip>
                    <Chip onPress={() => openCompanion({ ask: 'What counts towards the Dit Score?' })}>What counts?</Chip>
                  </Row>
                  <Txt variant="xs" muted style={{ textAlign: 'center' }}>Illustrative prototype. The real method will be set with coaches and sports experts.</Txt>
                </>
              )}
        </ThemeScope>

        {st.kind === 'scored' ? <Card><SectionTitle>Week by week</SectionTitle><View style={{ height: 8 }} /><ScoreTrend db={db} athleteId={a.id} /></Card> : null}
        {st.kind === 'scored' || st.kind === 'building' ? <Card><SectionTitle>What it’s made of</SectionTitle><View style={{ height: 12 }} /><ScoreBreakdown state={st} audience="athlete" /></Card> : null}

        <Card>
          <Stack gap={2}>
            <Txt variant="small" strong>What to focus on next</Txt>
            <Txt variant="xs" muted>From your coach’s plan. dit doesn’t add training of its own.</Txt>
            {area ? <Txt variant="small"><Txt variant="small" strong>{area.title}</Txt>{goal ? ` — ${goal.title}` : ''}</Txt> : <Txt variant="small" muted>Your coach hasn’t set a focus yet.</Txt>}
            {goal?.drill ? <Button size="sm" onPress={() => nav.navigate('Tabs', { screen: 'Practice' })}>{`Practice: ${goal.drill.name}`}</Button> : null}
          </Stack>
        </Card>

        {approved.length > 0 ? (
          <Card>
            <Stack gap={2}>
              <Row gap={1}><ShieldCheck size={14} color={t.text} /><Txt variant="small" strong>Confirmed by your coaches</Txt></Row>
              {approved.map((r) => <Txt key={r.id} variant="small"><Txt variant="small" strong>{db.areas.find((x) => x.id === r.areaId)?.title}:</Txt> {r.outcome?.replace(/_/g, ' ')} · {fmtDate(r.submittedAt ?? r.due)}</Txt>)}
            </Stack>
          </Card>
        ) : null}

        {ms.length > 0 ? (
          <Stack gap={2}>
            <SectionTitle>Milestones</SectionTitle>
            {ms.map((m) => <Card key={m.id}><Row gap={3}><Trophy size={18} color={t.text} /><Txt variant="small" strong style={{ flex: 1 }}>{m.title}</Txt><Txt variant="xs" muted>{fmtDate(m.date)}</Txt></Row></Card>)}
          </Stack>
        ) : null}

        <Card onPress={() => nav.navigate('Compare')} label="Compare progress">
          <Row gap={3}><Users size={18} color={t.text} /><View style={{ flex: 1 }}><Txt variant="small" strong>Compare progress</Txt><Txt variant="xs" muted>Me vs me, and squad progress where your coach allows it</Txt></View><ChevronRight size={16} color={t.textMuted} /></Row>
        </Card>

        <Card>
          <Stack gap={3}>
            <Row gap={1}><Lock size={14} color={t.text} /><Txt variant="small" strong>Who can see my Dit Score</Txt></Row>
            {visOptions.map((o) => {
              const locked = o.v === 'coaches' && age < 16;
              const on = prefs.visibility === o.v;
              return (
                <Pressable key={o.v} accessibilityRole="radio" accessibilityState={{ checked: on, disabled: locked }} disabled={locked} onPress={() => setVis(o.v)}
                  style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: on ? t.lineStrong : t.line, opacity: locked ? 0.6 : 1 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: t.text, alignItems: 'center', justifyContent: 'center' }}>{on ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.text }} /> : null}</View>
                  <o.Icon size={16} color={t.text} />
                  <View style={{ flex: 1 }}><Txt variant="small" strong>{o.label}</Txt><Txt variant="xs" muted>{locked ? 'Under 16, your family can always see it.' : o.note}</Txt></View>
                </Pressable>
              );
            })}
            <Txt variant="xs" muted>A Dit Score shows how your development is going. It doesn’t measure talent and it’s never compared across sports. Assumption DS-07.</Txt>
          </Stack>
        </Card>
      </Screen>
    </View>
  );
}

/** Flow G: score comparison with age-appropriate presentation. */
export function Compare() {
  const { db, update, toast } = useStore();
  const { a, first } = useAthlete();
  const t = useTheme();
  const [tab, setTab] = useState<'me' | 'squad' | 'academy'>('me');
  const cmp = squadComparison(db, a.id);
  const pb = personalBest(db, a.id);
  const st = computeDitScore(db, a.id);
  useCompanionContext({ surface: 'athlete', title: `${first} · Compare`, athleteId: a.id, prompts: ['Why did my Dit Score change?'] });
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AthleteTop back />
      <Screen>
        <Display size={44}>Compare</Display>
        <Row gap={2}>
          {(['me', 'squad', 'academy'] as const).map((k) => <View key={k} style={{ flex: 1 }}><Chip selected={tab === k} onPress={() => setTab(k)}>{k === 'me' ? 'Me vs me' : k === 'squad' ? 'Squad' : 'Academy'}</Chip></View>)}
        </Row>

        {tab === 'me' ? (
          <Stack gap={3}>
            <Card><Stack gap={2}><Txt variant="small"><Txt variant="small" strong>Now:</Txt> {st.kind === 'scored' ? st.value : '—'}  ·  <Txt variant="small" strong>Personal best:</Txt> {pb ?? '—'}</Txt><ScoreTrend db={db} athleteId={a.id} /></Stack></Card>
            <Txt variant="small" muted>The comparison that matters most is with yourself a few weeks ago.</Txt>
          </Stack>
        ) : null}

        {tab === 'squad' ? (
          <Stack gap={3}>
            {cmp.kind === 'not_offered' ? <StateBlock kind="permission" title="Not available for you" body={cmp.reason} /> : null}
            {cmp.kind === 'opt_in_needed' ? (
              <Card>
                <Stack gap={3}>
                  <Txt variant="small"><Txt variant="small" strong>Squad progress</Txt> compares how much each person improved over the last four weeks. It doesn’t compare scores.</Txt>
                  <Stack gap={1}><Txt variant="small">• Teammates are never named. You only see where you sit.</Txt><Txt variant="small">• Under 16 you see a band (top, middle or building), not a position.</Txt><Txt variant="small">• You can switch it off any time.</Txt></Stack>
                  <Button variant="primary" onPress={() => { update((d) => { const p = d.scorePrefs[a.id] ?? (d.scorePrefs[a.id] = { visibility: 'family', comparisonOptIn: false, seenMilestoneIds: [], shareRequests: [] }); p.comparisonOptIn = true; }); toast({ tone: 'ok', text: 'Squad progress turned on.' }); }}>Turn on squad progress</Button>
                </Stack>
              </Card>
            ) : null}
            {cmp.kind === 'ok' ? (
              <>
                <ThemeScope mode="floodlit" style={{ borderRadius: radius.md, padding: space[4], gap: 6, borderWidth: 1, borderColor: raw.char[400] }}>
                  <Txt variant="xs" strong muted>Progress over 4 weeks · {cmp.cohortSize} in your squad</Txt>
                  <Display size={36}>{cmp.mode === 'positions' ? `#${cmp.position} for progress` : cmp.band}</Display>
                  <Txt variant="small">You moved {cmp.selfImprovement >= 0 ? '+' : ''}{cmp.selfImprovement} points.</Txt>
                </ThemeScope>
                <Card flush>
                  {cmp.rows.map((r, i) => (
                    <ListRow key={i} last={i === cmp.rows.length - 1} style={r.you ? { backgroundColor: t.surfaceSunk } : undefined}>
                      {cmp.mode === 'positions' ? <Txt variant="num" style={{ width: 28 }}>{i + 1}</Txt> : null}
                      <Txt variant="small" strong style={{ flex: 1 }}>{r.you ? 'You' : 'Teammate'}</Txt>
                      <View style={{ width: 110, height: 8, borderRadius: 4, backgroundColor: t.surfaceSunk, overflow: 'hidden' }}><View style={{ width: `${Math.max(4, Math.min(100, 50 + r.improvement * 2))}%`, height: 8, backgroundColor: t.hl }} /></View>
                    </ListRow>
                  ))}
                </Card>
                <Txt variant="xs" muted>Ranked by improvement, not by score. Squad comparison is allowed by your coach for this batch only.</Txt>
                <Button variant="ghost" size="sm" onPress={() => update((d) => { const p = d.scorePrefs[a.id]; if (p) p.comparisonOptIn = false; })}>Turn off squad progress</Button>
              </>
            ) : null}
          </Stack>
        ) : null}

        {tab === 'academy' ? (
          <Stack gap={3}>
            <StateBlock kind="empty" title="Not available yet" body="Comparing across age groups needs a validated way to make scores fair between them. ditdit won’t rank across groups or sports until that exists." />
            <Banner tone="info">Academy achievements, such as squad milestones, will show here instead of rankings.</Banner>
          </Stack>
        ) : null}
      </Screen>
    </View>
  );
}
