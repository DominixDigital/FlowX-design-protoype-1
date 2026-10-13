import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Check, Target, Trophy } from 'lucide-react-native';
import { nowISO, uid, useStore } from 'ditcore/store/store';
import { TODAY } from 'ditcore/data/fixtures';
import { areaById, athleteById, daysUntil, fmtDate, observationsFor } from 'ditcore/store/selectors';
import type { ReassessmentOutcome } from 'ditcore/data/types';
import { useCoach } from 'ditcore/surfaces/coach/useCoach';
import { ThemeScope, useTheme } from '../../theme/ThemeProvider';
import { AssumptionNote, Banner, Button, Card, Display, Field, Input, Row, Stack, StatusBadge, Txt } from '../../ui';
import { Clip } from '../../ui/art';
import { DitAvatar } from '../../ui/Dit';
import { useCompanion, useCompanionContext } from '../../companion/Companion';
import { radius, raw } from '../../theme/tokens';
import { CoachGate, CoachPage, NotFound } from './parts';

const OUTCOMES: { v: ReassessmentOutcome; label: string; desc: string }[] = [
  { v: 'needs_more_work', label: 'Needs more work', desc: 'Keep the area and goal as they are' },
  { v: 'improving', label: 'Improving', desc: 'Moving the right way; keep going' },
  { v: 'on_track', label: 'On track', desc: 'Close to the target' },
  { v: 'achieved', label: 'Achieved', desc: 'Target met: the area closes as achieved' },
];

function Step({ n, title, children, optional }: { n: number; title: string; children: ReactNode; optional?: boolean }) {
  const t = useTheme();
  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Txt variant="num" color={t.roleText} style={{ width: 24, fontSize: 28 }}>{n}</Txt>
        <View style={{ flex: 1, gap: 8 }}>
          <Txt variant="small" strong>{title}{optional ? <Txt variant="small" muted> (optional)</Txt> : null}</Txt>
          {children}
        </View>
      </View>
    </Card>
  );
}

function Check2({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => onChange(!on)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}>
      <View style={{ width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: t.text, backgroundColor: on ? t.text : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{on ? <Check size={14} color={t.bg} /> : null}</View>
      <Txt variant="small">{label}</Txt>
    </Pressable>
  );
}

/** CM12: a reassessment as ordered steps; the coach decides the status. */
export function Reassess() {
  const { id } = useRoute<any>().params;
  const { db, update, audit, toast } = useStore();
  const c = useCoach();
  const h = useCompanion();
  const nav = useNavigation<any>();
  const t = useTheme();
  const r = db.reassessments.find((x) => x.id === id);
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState(r?.note ?? '');
  const [outcome, setOutcome] = useState<ReassessmentOutcome | null>(r?.outcome ?? null);
  const [next, setNext] = useState(r?.nextAction ?? '');
  const [milestone, setMilestone] = useState('');
  const [touched, setTouched] = useState(false);
  useCompanionContext(r ? {
    surface: 'coach', title: `Reassessment · ${athleteById(db, r.athleteId)?.name}`, athleteId: r.athleteId, reassessmentId: r.id,
    prompts: ['Brief me on the evidence', 'Compare the last two sessions'],
  } : null, { useText: { label: 'Use as reassessment note', run: (x) => setNote(x) } });
  if (!r) return <CoachPage back><NotFound what="reassessment" /></CoachPage>;

  const athlete = athleteById(db, r.athleteId)!;
  const area = areaById(db, r.areaId)!;
  const goal = db.goals.find((g) => g.areaId === area.id && g.status === 'active') ?? db.goals.find((g) => g.areaId === area.id);
  const notes = observationsFor(db, r.athleteId).filter((o) => o.areaId === area.id);
  const vids = db.videos.filter((v) => v.areaId === area.id && v.upload === 'uploaded');
  const done = r.status === 'submitted' || r.status === 'approved';
  const isHead = c.role === 'head_coach';
  const notMine = r.assigneeId !== c.coach?.id && !isHead;
  const errors = { note: touched && !note.trim() ? 'Record what you saw before choosing a status.' : undefined, outcome: touched && !outcome ? 'Choose a status.' : undefined };

  const complete = () => {
    setTouched(true);
    if (!note.trim() || !outcome) return;
    const mid = isHead && milestone.trim() ? uid('m') : null;
    update((d) => {
      const x = d.reassessments.find((y) => y.id === r.id)!;
      Object.assign(x, { note: note.trim(), outcome, nextAction: next.trim(), status: isHead ? 'approved' : 'submitted', submittedAt: nowISO(), milestoneId: mid, proposedMilestone: !isHead && milestone.trim() ? milestone.trim() : undefined });
      if (mid) d.milestones.push({ id: mid, athleteId: r.athleteId, areaId: area.id, title: milestone.trim(), date: TODAY, visibleToFamily: true });
      if (isHead && outcome === 'achieved') { const a = d.areas.find((y) => y.id === area.id)!; a.status = 'achieved'; }
      if (next.trim() && goal) { const g = d.goals.find((y) => y.id === goal.id)!; g.nextAction = next.trim(); }
      if (!isHead) d.notifications.push({ id: uid('n'), personId: 'p-rohan', kind: 'reassessment', title: `Reassessment submitted: ${athlete.name}`, body: `${c.person.name} · ${OUTCOMES.find((o) => o.v === outcome)?.label}`, route: `/web/reassessments/${r.id}`, target: { type: 'reassessment', id: r.id }, createdAt: nowISO(), read: false });
    });
    audit(c.person.name, `${isHead ? 'Completed' : 'Submitted'} reassessment for ${athlete.name}: ${outcome}`, r.id);
    toast({ tone: 'ok', text: isHead ? 'Reassessment complete and approved.' : 'Submitted. Rohan Shah will review it on the web.' });
  };

  let n = 0;
  return (
    <CoachPage back>
      <CoachGate>
        <Stack gap={2}>
          <Row gap={2}><StatusBadge status={r.status} /><Txt variant="xs" muted>Due {fmtDate(r.due)} · {daysUntil(r.due) >= 0 ? `${daysUntil(r.due)} days` : 'overdue'}</Txt></Row>
          <Display size={38}>Reassess {athlete.name.split(' ')[0]}</Display>
          <Txt variant="small" muted>{area.title}</Txt>
        </Stack>
        {notMine ? <Banner tone="warn">This reassessment is assigned to another coach. You can read it but not complete it.</Banner> : null}
        {done ? (
          <Stack gap={3}>
            <Banner tone="ok"><Txt variant="small">{r.status === 'approved' ? 'Completed and approved.' : 'Submitted. Waiting for head coach approval on the web.'} Outcome: <Txt variant="small" strong>{OUTCOMES.find((o) => o.v === r.outcome)?.label}</Txt>.</Txt></Banner>
            <Button block onPress={() => nav.goBack()}>{`Back to ${athlete.name.split(' ')[0]}`}</Button>
          </Stack>
        ) : null}

        {!done && !notMine ? (
          <>
            <ThemeScope mode="floodlit" style={{ borderRadius: radius.md, borderWidth: 1, borderColor: raw.char[400] }}>
              <Pressable accessibilityRole="button" onPress={() => h.openCompanion({ ask: 'Brief me on the evidence' })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
                <DitAvatar state="insight" size={34} form="face" />
                <View style={{ flex: 1 }}><Txt strong color={raw.grey[50]}>Evidence brief ready</Txt><Txt variant="xs" muted>{notes.length} notes, {vids.length} clip{vids.length === 1 ? '' : 's'} and attendance since {fmtDate(area.openedAt)}. You decide the status.</Txt></View>
              </Pressable>
            </ThemeScope>

            <Step n={++n} title="Review the goal">
              {goal ? <><Row gap={1} center={false}><Target size={14} color={t.text} style={{ marginTop: 3 }} /><Txt variant="small" style={{ flex: 1 }}>{goal.title}</Txt></Row><Txt variant="xs" muted>Target: {goal.target}</Txt></> : <Txt variant="small" muted>No goal set for this area.</Txt>}
              <Check2 label="Reviewed" on={!!reviewed.goal} onChange={(v) => setReviewed({ ...reviewed, goal: v })} />
            </Step>
            <Step n={++n} title={`Review notes (${notes.length})`}>
              {notes.slice(0, 3).map((o) => <Txt key={o.id} variant="small">“{o.text}” <Txt variant="xs" muted>{fmtDate(o.createdAt)}</Txt></Txt>)}
              {notes.length === 0 ? <Txt variant="small" muted>No notes linked to this area.</Txt> : null}
              <Check2 label="Reviewed" on={!!reviewed.notes} onChange={(v) => setReviewed({ ...reviewed, notes: v })} />
            </Step>
            {vids.length > 0 ? <Step n={++n} title="Review video" optional><Clip video={vids[0]} /><Txt variant="xs" muted>Timestamped review arrives with the video review build.</Txt></Step> : null}
            <Step n={++n} title="Record your reassessment note">
              <Field label="What you saw today" error={errors.note}><Input multiline value={note} onChangeText={setNote} /></Field>
            </Step>
            <Step n={++n} title="Choose status">
              <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
                {OUTCOMES.map((o) => {
                  const on = outcome === o.v;
                  const ach = on && o.v === 'achieved';
                  return (
                    <Pressable key={o.v} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setOutcome(o.v)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: on ? t.lineStrong : t.line, backgroundColor: ach ? t.hl : 'transparent' }}>
                      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: ach ? raw.char[700] : t.text, alignItems: 'center', justifyContent: 'center' }}>{on ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: ach ? raw.char[700] : t.text }} /> : null}</View>
                      <View style={{ flex: 1 }}><Txt variant="small" strong color={ach ? raw.char[700] : undefined}>{o.label}</Txt><Txt variant="xs" color={ach ? raw.char[500] : t.textMuted}>{o.desc}</Txt></View>
                    </Pressable>
                  );
                })}
              </View>
              {errors.outcome ? <Txt variant="xs" color={t.err}>{errors.outcome}</Txt> : null}
              <Txt variant="xs" muted>Status words are a prototype assumption. The vocabulary is an open decision.</Txt>
            </Step>
            <Step n={++n} title="Set next action" optional><Input accessibilityLabel="Next action" value={next} onChangeText={setNext} placeholder={goal?.nextAction || 'e.g. Move to live bowling at 70%'} /></Step>
            <Step n={++n} title="Add a milestone" optional>
              <Input accessibilityLabel="Milestone" value={milestone} onChangeText={setMilestone} placeholder="e.g. Still head on 8/10 drives" />
              {milestone ? <Row gap={1} center={false}><Trophy size={12} color={t.textMuted} style={{ marginTop: 3 }} /><Txt variant="xs" muted style={{ flex: 1 }}>{isHead ? 'Families see milestones once the report is published.' : 'Proposed: the head coach confirms it when approving.'}</Txt></Row> : null}
            </Step>
            <Stack gap={2}>
              <Button variant="primary" size="lg" block icon={<Check size={16} color={t.accentInk} />} onPress={complete}>{isHead ? 'Complete reassessment' : 'Submit for approval'}</Button>
              <AssumptionNote code="MW10.04" />
            </Stack>
          </>
        ) : null}
      </CoachGate>
    </CoachPage>
  );
}
