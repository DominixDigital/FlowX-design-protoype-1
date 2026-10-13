import { useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronRight, Dumbbell, Flag, Mic, NotebookPen, Pencil, Plus, RotateCcw, Target, Trophy, Video as VideoIcon } from 'lucide-react-native';
import { uid, useStore } from 'ditcore/store/store';
import { TODAY } from 'ditcore/data/fixtures';
import { ageOn, areaById, athleteById, attendanceFor, batchById, currentFocus, daysUntil, fmtDate, lastSessionFor, observationsFor } from 'ditcore/store/selectors';
import type { DevArea } from 'ditcore/data/types';
import { useCoach } from 'ditcore/surfaces/coach/useCoach';
import { useTheme } from '../../theme/ThemeProvider';
import { Avatar, Banner, Button, Card, ChoiceGroup, ConfirmDialog, Display, Field, Input, ListRow, Row, SectionTitle, Stack, StateBlock, StatusBadge, Txt } from '../../ui';
import { Clip } from '../../ui/art';
import { DitChip } from '../../ui/score';
import { useCompanion, useCompanionContext } from '../../companion/Companion';
import { CoachGate, CoachPage, NotFound } from './parts';
import { radius } from '../../theme/tokens';

export function AthletesList() {
  const { db } = useStore();
  const c = useCoach();
  const nav = useNavigation<any>();
  const [q, setQ] = useState('');
  useCompanionContext({ surface: 'coach', title: 'Athletes', prompts: ['What can you help with?'] });
  const list = db.athletes.filter((a) => a.status === 'active' && a.academyId === c.academy.id && c.inScope(a.id)).filter((a) => a.name.toLowerCase().includes(q.toLowerCase()));
  const byBatch = new Map<string, typeof list>();
  for (const a of list) byBatch.set(a.batchId ?? 'none', [...(byBatch.get(a.batchId ?? 'none') ?? []), a]);
  return (
    <CoachPage title="Athletes">
      <CoachGate>
        <Display size={44}>Athletes</Display>
        {c.scopeAthleteIds !== 'all' ? <Txt variant="xs" muted>Temporary access: you see only athletes you hold work for.</Txt> : null}
        <Input accessibilityLabel="Search athletes" placeholder="Search by name" value={q} onChangeText={setQ} />
        {list.length === 0 ? <StateBlock kind="empty" title={q ? `No athlete matches “${q}”` : 'No athletes assigned to you'} /> : null}
        {[...byBatch.entries()].map(([bid, as]) => (
          <Stack key={bid} gap={2}>
            <SectionTitle>{batchById(db, bid)?.name ?? 'No batch'}</SectionTitle>
            <Card flush>
              {as.map((a, i) => {
                const { area } = currentFocus(db, a.id);
                return (
                  <ListRow key={a.id} last={i === as.length - 1} onPress={() => nav.navigate('AthleteContext', { id: a.id })} label={`Open ${a.name}`}>
                    <Avatar name={a.name} size={36} />
                    <View style={{ flex: 1 }}><Txt variant="small" strong>{a.name}</Txt><Txt variant="xs" muted numberOfLines={1}>{area ? area.title : 'No active focus'}</Txt></View>
                    <ChevronRight size={16} color="#888" />
                  </ListRow>
                );
              })}
            </Card>
          </Stack>
        ))}
      </CoachGate>
    </CoachPage>
  );
}

export function AthleteContext() {
  const { id, session: sessionId } = useRoute<any>().params as { id: string; session?: string };
  const { db, update, audit, toast } = useStore();
  const c = useCoach();
  const h = useCompanion();
  const nav = useNavigation<any>();
  const t = useTheme();
  const a = athleteById(db, id);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useCompanionContext(a ? {
    surface: 'coach', title: `${a.name}${sessionId ? ` · ${db.sessions.find((s) => s.id === sessionId)?.title}` : ''}`, athleteId: a.id, sessionId,
    prompts: ['Summarise recent sessions', 'Compare the last two sessions', 'What’s the next action?'],
  } : null);

  if (!a) return <CoachPage back><NotFound what="athlete" /></CoachPage>;
  if (!c.inScope(a.id)) return <CoachPage back><StateBlock kind="permission" title="Outside your temporary access" body="You can only open athletes you hold a task or handover for. Ask the head coach for wider access." /></CoachPage>;

  const { area, goal } = currentFocus(db, a.id);
  const att = attendanceFor(db, a.id);
  const last = lastSessionFor(db, a.id);
  const reass = db.reassessments.find((r) => r.athleteId === a.id && r.status !== 'approved');
  const vids = db.videos.filter((v) => v.athleteId === a.id && (!area || v.areaId === area.id));
  const obs = observationsFor(db, a.id).slice(0, 4);
  const areas = db.areas.filter((x) => x.athleteId === a.id);
  const presentToday = sessionId ? db.sessions.find((s) => s.id === sessionId)?.attendance[a.id] : undefined;
  const soon = reass && daysUntil(reass.due) <= 3;

  return (
    <CoachPage back>
      <CoachGate>
        <Row gap={3}>
          <Avatar name={a.name} size={56} />
          <View style={{ flex: 1 }}>
            <Display size={34}>{a.name}</Display>
            <Txt variant="small" muted>{a.discipline} · {ageOn(a.born)} · {batchById(db, a.batchId)?.name}</Txt>
          </View>
          <DitChip db={db} athleteId={a.id} onPress={() => nav.navigate('CoachScore', { id: a.id })} />
        </Row>
        {presentToday && presentToday !== 'unmarked' ? <StatusBadge status={presentToday === 'present' ? 'active' : 'failed'} label={presentToday === 'present' ? 'Present' : 'Absent'} /> : null}

        <Card style={{ borderColor: t.lineStrong, borderWidth: 1.5 }}>
          <Stack gap={2}>
            <Row between><Txt variant="small" strong muted>Current focus</Txt>{area ? <StatusBadge status={area.status} /> : null}</Row>
            {area ? (
              <>
                <Display size={30}>{area.title}</Display>
                {goal ? (
                  <Stack gap={2}>
                    <Row gap={1} center={false}><Target size={14} color={t.text} style={{ marginTop: 3 }} /><Txt variant="small" style={{ flex: 1 }}>{goal.title}</Txt></Row>
                    <Txt variant="xs" muted>Target: {goal.target}</Txt>
                    {goal.nextAction ? <Banner tone="ok"><Row gap={1} center={false}><Flag size={14} color={t.ok} style={{ marginTop: 3 }} /><Txt variant="small" style={{ flex: 1 }}><Txt variant="small" strong>Next action:</Txt> {goal.nextAction}</Txt></Row></Banner> : null}
                    {goal.drill ? <Row gap={1}><Dumbbell size={12} color={t.text} /><Txt variant="xs">{goal.drill.name} · {goal.drill.frequency}</Txt></Row> : null}
                    <Button size="sm" onPress={() => nav.navigate('GoalEditor', { id: goal.id })}>Edit goal, drill or next action</Button>
                  </Stack>
                ) : <Button size="sm" icon={<Plus size={14} color={t.text} />} onPress={() => nav.navigate('GoalEditor', { id: 'new', area: area.id })}>Add a goal</Button>}
              </>
            ) : <StateBlock kind="empty" title="No active focus" body="Spot something worth working on? Create a development area." action={<Button size="sm" onPress={() => nav.navigate('NewArea', { id: a.id })}>New development area</Button>} />}
          </Stack>
        </Card>

        <Stack gap={2}>
          <Row gap={2}>
            <View style={{ flex: 1 }}><Button variant="primary" block icon={<Mic size={16} color={t.accentInk} />} onPress={() => h.openCompanion()}>Talk a note</Button></View>
            <View style={{ flex: 1 }}><Button block icon={<NotebookPen size={16} color={t.text} />} onPress={() => nav.navigate('Capture', { mode: 'note', athlete: a.id, session: sessionId })}>Type</Button></View>
            <Button icon={<VideoIcon size={18} color={t.text} />} label="Record video" onPress={() => nav.navigate('Capture', { mode: 'video', athlete: a.id, session: sessionId })} />
          </Row>
          <Txt variant="xs" muted>Voice notes become a draft you confirm. In this build, use dit’s sample voice note or type; live speech arrives with the native speech module.</Txt>
        </Stack>

        <Row gap={2} center={false}>
          <Card style={{ flex: 1 }}><Txt variant="small" strong>Attendance</Txt><Txt variant="num" style={{ fontSize: 34 }}>{att.total ? `${att.present}/${att.total}` : '—'}</Txt><Txt variant="xs" muted>recorded sessions</Txt></Card>
          <Card style={{ flex: 1, ...(soon ? { backgroundColor: t.hl, borderColor: t.hl } : null) }} onPress={reass ? () => nav.navigate('Reassess', { id: reass.id }) : undefined} label="Open reassessment">
            <Txt variant="small" strong color={soon ? t.hlInk : undefined}>Reassessment</Txt>
            <Txt variant="num" style={{ fontSize: 34 }} color={soon ? t.hlInk : undefined}>{reass ? (daysUntil(reass.due) < 0 ? 'Late' : `${daysUntil(reass.due)}d`) : '—'}</Txt>
            <Txt variant="xs" color={soon ? t.hlInk : t.textMuted}>{reass ? `${reass.status === 'submitted' ? 'Submitted' : 'Due'} ${fmtDate(reass.due)}` : 'None scheduled'}</Txt>
          </Card>
        </Row>

        {last ? (
          <Stack gap={2}>
            <SectionTitle>Last session</SectionTitle>
            <Card onPress={() => nav.navigate('SessionDetail', { id: last.id })} label="Open last session"><Row gap={3}><Txt variant="num" style={{ fontSize: 26 }}>{fmtDate(last.date)}</Txt><Txt variant="small" style={{ flex: 1 }}>{last.title}</Txt><ChevronRight size={16} color={t.textMuted} /></Row></Card>
          </Stack>
        ) : null}

        {vids.length > 0 ? (
          <Stack gap={2}>
            <SectionTitle>Relevant video</SectionTitle>
            <Card flush><Clip video={vids[0]} /></Card>
            <Txt variant="xs" muted>Review with comments arrives with the video review build.</Txt>
          </Stack>
        ) : null}

        <Stack gap={2}>
          <SectionTitle>Recent notes</SectionTitle>
          {obs.length === 0 ? <StateBlock kind="empty" title="No notes yet" body="Talk or type the first one above." /> : (
            <Card flush>
              {obs.map((o, i) => (
                <View key={o.id} style={{ padding: 16, gap: 6, borderBottomWidth: i === obs.length - 1 ? 0 : 1, borderBottomColor: t.line }}>
                  {editing === o.id ? (
                    <Stack gap={2}>
                      <Input accessibilityLabel="Correct note" multiline value={editText} onChangeText={setEditText} />
                      <Row gap={2}>
                        <Button size="sm" variant="primary" disabled={!editText.trim()} onPress={() => {
                          update((d) => { const x = d.observations.find((y) => y.id === o.id)!; x.correctedFrom = x.text; x.text = editText.trim(); });
                          audit(c.person.name, `Corrected an observation on ${a.name}`, o.id);
                          setEditing(null);
                          toast({ tone: 'ok', text: 'Note corrected. The original stays in the audit history.' });
                        }}>Save correction</Button>
                        <Button size="sm" variant="ghost" onPress={() => setEditing(null)}>Cancel</Button>
                      </Row>
                    </Stack>
                  ) : (
                    <>
                      <Row between>
                        <Txt variant="xs" muted style={{ flexShrink: 1 }}>{fmtDate(o.createdAt)} · {areaById(db, o.areaId)?.title ?? 'Unstructured'}</Txt>
                        <Row gap={1}>{o.aiDrafted ? <StatusBadge tone="outline" label="AI-drafted" /> : null}{o.sync !== 'synced' ? <StatusBadge status={o.sync} /> : null}</Row>
                      </Row>
                      <Txt variant="small">{o.text}</Txt>
                      {o.correctedFrom ? <Txt variant="xs" muted>Corrected · was: “{o.correctedFrom}”</Txt> : null}
                      {o.authorId === c.coach?.id ? <Button size="sm" variant="ghost" icon={<Pencil size={12} color={t.text} />} onPress={() => { setEditing(o.id); setEditText(o.text); }}>Correct</Button> : null}
                    </>
                  )}
                </View>
              ))}
            </Card>
          )}
        </Stack>

        <Stack gap={2}>
          <Row between><SectionTitle>Development areas</SectionTitle><Button size="sm" variant="ghost" onPress={() => nav.navigate('NewArea', { id: a.id })}>+ New</Button></Row>
          <Card flush>
            {areas.map((x, i) => (
              <ListRow key={x.id} last={i === areas.length - 1}>
                <View style={{ flex: 1 }}><Txt variant="small" strong>{x.title}</Txt><Txt variant="xs" muted>Since {fmtDate(x.openedAt)} · {x.priority} priority</Txt></View>
                <StatusBadge status={x.status} />
              </ListRow>
            ))}
          </Card>
        </Stack>
      </CoachGate>
    </CoachPage>
  );
}

/** CM06: identify, check existing, create or reopen, prioritise; cancel safely. */
export function NewArea() {
  const { id } = useRoute<any>().params;
  const { db, update, audit, toast } = useStore();
  const c = useCoach();
  const nav = useNavigation<any>();
  const t = useTheme();
  const a = athleteById(db, id);
  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState<DevArea['priority']>('normal');
  const [touched, setTouched] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState<DevArea | null>(null);
  useCompanionContext(a ? { surface: 'coach', title: `New development area · ${a.name}`, athleteId: a.id, prompts: ['Summarise recent sessions'] } : null);
  if (!a) return <CoachPage back><NotFound what="athlete" /></CoachPage>;

  const existing = db.areas.filter((x) => x.athleteId === a.id);
  const words = issue.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  const similar = existing.filter((x) => words.some((w) => x.title.toLowerCase().includes(w)));
  const highTaken = existing.find((x) => x.priority === 'high' && (x.status === 'active' || x.status === 'reopened'));
  const error = touched && issue.trim().length < 5 ? 'Describe the issue in a few words (at least 5 characters).' : '';
  const create = () => {
    setTouched(true);
    if (issue.trim().length < 5) return;
    const nid = uid('da');
    update((d) => {
      if (priority === 'high' && highTaken) { const x = d.areas.find((y) => y.id === highTaken.id)!; x.priority = 'normal'; }
      d.areas.push({ id: nid, athleteId: a.id, title: issue.trim(), status: 'active', priority, openedAt: TODAY, ownerId: c.coach!.id });
    });
    audit(c.person.name, `Created development area “${issue.trim()}” for ${a.name}`, nid);
    toast({ tone: 'ok', text: 'Development area created. Add a goal next.' });
    nav.replace('GoalEditor', { id: 'new', area: nid });
  };
  return (
    <CoachPage back>
      <CoachGate>
        <Display size={40}>New development area</Display>
        <Field label="What did you notice?" hint="Name the skill or issue, not the drill." error={error}><Input value={issue} onChangeText={setIssue} onBlur={() => setTouched(true)} placeholder="e.g. Back-foot defence against pace" /></Field>
        {issue.trim().length >= 4 ? (
          <Stack gap={2}>
            <Txt variant="small" strong>Check existing areas first</Txt>
            {existing.length === 0 ? <Txt variant="xs" muted>No areas yet for {a.name}.</Txt> : (
              <Card flush>
                {(similar.length ? similar : existing).map((x, i, arr) => (
                  <ListRow key={x.id} last={i === arr.length - 1}>
                    <View style={{ flex: 1 }}><Txt variant="small" strong>{x.title}</Txt><Txt variant="xs" muted>{similar.includes(x) ? 'Looks similar' : 'Existing'}</Txt></View>
                    <StatusBadge status={x.status} />
                    {x.status === 'achieved' || x.status === 'closed' ? <Button size="sm" icon={<RotateCcw size={12} color={t.text} />} onPress={() => setConfirmReopen(x)}>Reopen</Button> : null}
                  </ListRow>
                ))}
              </Card>
            )}
          </Stack>
        ) : null}
        <Field label="Priority" hint={priority === 'high' && highTaken ? `“${highTaken.title}” is currently high. It will move to normal.` : undefined}>
          <ChoiceGroup label="Priority" value={priority} onChange={(v) => v && setPriority(v)} options={(['high', 'normal', 'low'] as const).map((p) => ({ v: p, label: p[0].toUpperCase() + p.slice(1) }))} />
        </Field>
        <Button variant="primary" size="lg" block onPress={create}>Create area</Button>
        <Button variant="ghost" block onPress={() => (issue.trim() ? setConfirmCancel(true) : nav.goBack())}>Cancel</Button>
        <ConfirmDialog open={confirmCancel} title="Discard this area?" body="Nothing has been saved yet." confirmLabel="Discard" tone="danger" onCancel={() => setConfirmCancel(false)} onConfirm={() => { setConfirmCancel(false); nav.goBack(); }} />
        <ConfirmDialog open={!!confirmReopen} title={`Reopen “${confirmReopen?.title}”?`} body="Its history, goals and milestones stay attached. The athlete and parents will see it as a current focus again." confirmLabel="Reopen area" onCancel={() => setConfirmReopen(null)} onConfirm={() => {
          const x = confirmReopen!;
          update((d) => { const r = d.areas.find((y) => y.id === x.id)!; r.status = 'reopened'; });
          audit(c.person.name, `Reopened “${x.title}” for ${a.name}`, x.id);
          setConfirmReopen(null);
          toast({ tone: 'ok', text: 'Area reopened.' });
          nav.goBack();
        }} />
      </CoachGate>
    </CoachPage>
  );
}

/** CM07: create or edit a goal, next action and drill; replace the drill; mark achieved. */
export function GoalEditor() {
  const { id, area: areaParam } = useRoute<any>().params as { id: string; area?: string };
  const { db, update, audit, toast } = useStore();
  const c = useCoach();
  const nav = useNavigation<any>();
  const t = useTheme();
  const isNew = id === 'new';
  const existing = isNew ? undefined : db.goals.find((g) => g.id === id);
  const areaId = existing?.areaId ?? areaParam ?? '';
  const area = areaById(db, areaId);
  const athlete = athleteById(db, area?.athleteId);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [target, setTarget] = useState(existing?.target ?? '');
  const [next, setNext] = useState(existing?.nextAction ?? '');
  const [drillName, setDrillName] = useState(existing?.drill?.name ?? '');
  const [drillHow, setDrillHow] = useState(existing?.drill?.instructions ?? '');
  const [freq, setFreq] = useState(existing?.drill?.frequency ?? '2× a week');
  const [touched, setTouched] = useState(false);
  const [confirmAchieved, setConfirmAchieved] = useState(false);
  const [replacing, setReplacing] = useState(false);
  useCompanionContext(athlete ? { surface: 'coach', title: `Goal · ${athlete.name}`, athleteId: athlete.id, prompts: ['Summarise recent sessions'] } : null);
  if (!area || !athlete || (!isNew && !existing)) return <CoachPage back><NotFound what="goal" /></CoachPage>;
  const errors = { title: touched && !title.trim() ? 'Give the goal a short title.' : '', target: touched && !target.trim() ? 'Say how you’ll know it’s achieved.' : '' };
  const save = () => {
    setTouched(true);
    if (!title.trim() || !target.trim()) return;
    const drill = drillName.trim() ? { name: drillName.trim(), instructions: drillHow.trim(), frequency: freq } : null;
    const gid = existing?.id ?? uid('g');
    update((d) => {
      const g = d.goals.find((x) => x.id === gid);
      if (g) Object.assign(g, { title: title.trim(), target: target.trim(), nextAction: next.trim(), drill });
      else d.goals.push({ id: gid, areaId: area.id, title: title.trim(), target: target.trim(), nextAction: next.trim(), drill, status: 'active' });
    });
    if (replacing && existing?.drill) audit(c.person.name, `Replaced drill “${existing.drill.name}” with “${drillName}” for ${athlete.name}`, gid);
    audit(c.person.name, `${isNew ? 'Created' : 'Updated'} goal “${title.trim()}” for ${athlete.name}`, gid);
    toast({ tone: 'ok', text: isNew ? 'Goal created. The athlete sees the drill in their Practice tab.' : 'Goal updated.' });
    nav.goBack();
  };
  return (
    <CoachPage back>
      <CoachGate>
        <Stack gap={1}><Txt variant="small" muted>{area.title}</Txt><Display size={40}>{isNew ? 'New goal' : 'Edit goal'}</Display></Stack>
        {existing?.status === 'achieved' ? <Banner tone="ok"><Row gap={1}><Trophy size={14} color={t.ok} /><Txt variant="small" style={{ flex: 1 }}>Achieved. Edits are kept in the audit history.</Txt></Row></Banner> : null}
        <Field label="Goal" error={errors.title}><Input value={title} onChangeText={setTitle} /></Field>
        <Field label="How you’ll know it’s achieved" error={errors.target}><Input value={target} onChangeText={setTarget} /></Field>
        <Field label="Next action" optional hint="Shown to coaches as the next thing to do."><Input value={next} onChangeText={setNext} /></Field>
        <View style={{ padding: 16, borderRadius: radius.md, backgroundColor: t.surfaceSunk, gap: 12 }}>
          <Row between>
            <Txt variant="small" strong style={{ flex: 1 }}>Practice drill <Txt variant="small" muted>(athlete sees this)</Txt></Txt>
            {existing?.drill && !replacing ? <Button size="sm" onPress={() => { setReplacing(true); setDrillName(''); setDrillHow(''); }}>Replace drill</Button> : null}
          </Row>
          {replacing ? <Txt variant="xs" muted>Replacing “{existing?.drill?.name}”. The old drill stays in history.</Txt> : null}
          <Field label="Drill name" optional><Input value={drillName} onChangeText={setDrillName} /></Field>
          <Field label="Instructions" optional><Input multiline value={drillHow} onChangeText={setDrillHow} /></Field>
          <Field label="Frequency"><ChoiceGroup label="Frequency" value={freq} onChange={(v) => v && setFreq(v)} options={['Every session', '3× a week', '2× a week', 'Once a week'].map((f) => ({ v: f, label: f }))} /></Field>
        </View>
        <Button variant="primary" size="lg" block onPress={save}>{isNew ? 'Create goal' : 'Save goal'}</Button>
        {existing && existing.status === 'active' ? <Button variant="ghost" block icon={<Trophy size={16} color={t.text} />} onPress={() => setConfirmAchieved(true)}>Mark goal achieved</Button> : null}
        <ConfirmDialog open={confirmAchieved} title="Mark this goal achieved?" body="The goal moves to history. To mark a milestone or close the whole area, complete a reassessment." confirmLabel="Mark achieved" onCancel={() => setConfirmAchieved(false)} onConfirm={() => {
          update((d) => { const g = d.goals.find((x) => x.id === existing!.id)!; g.status = 'achieved'; });
          audit(c.person.name, `Marked goal achieved: ${existing!.title}`, existing!.id);
          setConfirmAchieved(false);
          toast({ tone: 'ok', text: 'Goal achieved.' });
          nav.goBack();
        }} />
      </CoachGate>
    </CoachPage>
  );
}
