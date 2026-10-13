import { useState } from 'react';

import { useRoute } from '@react-navigation/native';
import { AlertTriangle, PauseCircle, PlayCircle, ShieldCheck } from 'lucide-react-native';
import { nowISO, useStore } from 'ditcore/store/store';
import { athleteById, coachById, fmtDate } from 'ditcore/store/selectors';
import { useCoach } from 'ditcore/surfaces/coach/useCoach';
import { computeDitScore, scoreChange } from 'ditcore/score/ditScore';
import { useTheme } from '../../theme/ThemeProvider';
import { Banner, Button, Card, Display, Field, Input, Row, Stack, StateBlock, StatusBadge, Txt } from '../../ui';
import { ScoreBreakdown, ScoreSignal } from '../../ui/score';
import { useCompanionContext } from '../../companion/Companion';
import { CoachGate, CoachPage, NotFound } from './parts';

/** Coach validation of the data behind an athlete's Dit Score (the coach is the source of truth). */
export function CoachScore() {
  const { id } = useRoute<any>().params;
  const { db, update, audit, toast } = useStore();
  const c = useCoach();
  const t = useTheme();
  const a = athleteById(db, id);
  const [note, setNote] = useState('');
  useCompanionContext(a ? { surface: 'coach', title: `Dit Score inputs · ${a.name}`, athleteId: a.id, prompts: ['Why did the Dit Score change?', 'What counts towards the Dit Score?'] } : null);
  if (!a) return <CoachPage back><NotFound what="athlete" /></CoachPage>;
  const review = db.scoreReviews.find((r) => r.athleteId === a.id);
  const raw = computeDitScore({ ...db, scoreReviews: db.scoreReviews.filter((r) => r.athleteId !== a.id) }, a.id);
  const ch = scoreChange(db, a.id);
  const isPrimary = a.primaryCoachId === c.coach?.id || c.role === 'head_coach';
  const record = (paused: boolean) => {
    update((d) => {
      d.scoreReviews = d.scoreReviews.filter((r) => r.athleteId !== a.id);
      d.scoreReviews.push({ athleteId: a.id, reviewedById: c.coach!.id, at: nowISO(), paused, note: paused ? note.trim() : undefined });
    });
    audit(c.person.name, paused ? `Paused ${a.name}’s Dit Score: ${note}` : `Confirmed ${a.name}’s Dit Score inputs`, a.id);
    toast({ tone: 'ok', text: paused ? 'Score paused. The athlete sees “paused by your coach”, with no reason shown.' : 'Inputs confirmed. The athlete sees that a coach checked them.' });
    setNote('');
  };
  const selfReported = raw.kind === 'scored' && raw.dims.find((d) => d.def.trust === 'self_reported' && (d.value ?? 0) >= 100);
  return (
    <CoachPage back title={a.name}>
      <CoachGate>
        <Display size={40}>Dit Score inputs</Display>
        <Card>
          <Stack gap={2}>
            <Row between><ScoreSignal state={raw} /><StatusBadge tone="outline" label="Illustrative" /></Row>
            {raw.kind === 'scored' ? <Txt variant="small" muted>{ch ? `${ch.delta >= 0 ? '+' : ''}${ch.delta} since ${fmtDate(ch.since)}` : 'First scored week'} · {raw.coverage}% of planned inputs measurable</Txt> : null}
            {raw.kind === 'building' ? <Txt variant="small">No score yet. Missing: {raw.missing.join('; ')}.</Txt> : null}
            {review ? <Txt variant="xs" muted>Last review: {coachById(db, review.reviewedById)?.name}, {fmtDate(review.at)}{review.paused ? ' · paused' : ''}</Txt> : null}
          </Stack>
        </Card>
        {selfReported ? <Banner tone="warn"><Row gap={1}><AlertTriangle size={14} color={t.warn} /><Txt variant="small" style={{ flex: 1 }}>Practice is at 100% and self-reported. Worth a word before you confirm.</Txt></Row></Banner> : null}
        {raw.kind === 'scored' || raw.kind === 'building' ? <Card><ScoreBreakdown state={raw} audience="coach" /></Card> : <StateBlock kind="empty" title="Scores are off at this academy" />}
        <Stack gap={3}>
          {!isPrimary ? <Banner tone="info">Only {a.name.split(' ')[0]}’s primary coach or the head coach can confirm or pause the score.</Banner> : null}
          <Button variant="primary" size="lg" block icon={<ShieldCheck size={16} color={t.accentInk} />} disabled={!isPrimary} onPress={() => record(false)}>{review?.paused ? 'Resume and confirm inputs' : 'Inputs look right'}</Button>
          {!review?.paused ? (
            <Card>
              <Stack gap={2}>
                <Field label="Pause the score" hint="Use this if the data looks wrong, for example a mismarked session. The athlete isn’t told why."><Input value={note} onChangeText={setNote} placeholder="Reason, for coaches only" /></Field>
                <Button variant="danger" icon={<PauseCircle size={16} color="#fff" />} disabled={!isPrimary || !note.trim()} onPress={() => record(true)}>Pause score</Button>
              </Stack>
            </Card>
          ) : null}
          {review?.paused ? <Row gap={1}><PlayCircle size={14} color={t.textMuted} /><Txt variant="small" muted>Paused: “{review.note}”</Txt></Row> : null}
        </Stack>
      </CoachGate>
    </CoachPage>
  );
}
