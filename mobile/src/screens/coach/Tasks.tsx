import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowRightLeft, Ban, Check, ClipboardList, MessageSquarePlus, NotebookPen, Play, Send, Video as VideoIcon } from 'lucide-react-native';
import { nowISO, uid, useStore } from 'ditcore/store/store';
import { TODAY } from 'ditcore/data/fixtures';
import { areaById, athleteById, coachById, daysUntil, fmtDate, observationsFor } from 'ditcore/store/selectors';
import { useCoach } from 'ditcore/surfaces/coach/useCoach';
import { useTheme } from '../../theme/ThemeProvider';
import { Banner, Button, Card, ChoiceGroup, ConfirmDialog, Display, Field, Input, ListRow, Row, SectionTitle, Stack, StateBlock, StatusBadge, Txt } from '../../ui';
import { Clip } from '../../ui/art';
import { useCompanionContext } from '../../companion/Companion';
import { CoachGate, CoachPage, NotFound } from './parts';

export function TaskList() {
  const { db } = useStore();
  const c = useCoach();
  const nav = useNavigation<any>();
  const t = useTheme();
  useCompanionContext({ surface: 'coach', title: 'Tasks', prompts: ['What can you help with?'] });
  const mine = db.tasks.filter((x) => x.assigneeId === c.coach?.id);
  const active = mine.filter((x) => ['open', 'in_progress', 'blocked'].includes(x.status));
  const done = mine.filter((x) => ['completed', 'cancelled'].includes(x.status));
  const handovers = db.handovers.filter((h) => h.toId === c.coach?.id || h.fromId === c.coach?.id);
  return (
    <CoachPage title="Tasks">
      <CoachGate>
        <Display size={44}>Tasks</Display>
        <Stack gap={2}>
          <Txt variant="h3">Assigned to you</Txt>
          {active.length === 0 ? <StateBlock kind="empty" title="No open tasks" body="When a head coach delegates work to you, it lands here and you get a notification." /> : (
            <Card flush>
              {active.map((x, i) => (
                <ListRow key={x.id} last={i === active.length - 1} onPress={() => nav.navigate('TaskDetail', { id: x.id })} label={`Open ${x.title}`}>
                  <ClipboardList size={18} color={t.text} />
                  <View style={{ flex: 1 }}><Txt variant="small" strong>{x.title}</Txt><Txt variant="xs" muted>{athleteById(db, x.athleteId)?.name} · from {coachById(db, x.createdById)?.name} · due {daysUntil(x.due) === 0 ? 'today' : fmtDate(x.due)}</Txt></View>
                  <StatusBadge status={x.status} />
                </ListRow>
              ))}
            </Card>
          )}
        </Stack>
        <Stack gap={2}>
          <Row between><Txt variant="h3">Handovers</Txt><Button size="sm" variant="ghost" onPress={() => nav.navigate('HandoverNew', {})}>+ Start handover</Button></Row>
          {handovers.length === 0 ? <StateBlock kind="empty" title="No handovers" /> : (
            <Card flush>
              {handovers.map((h, i) => (
                <ListRow key={h.id} last={i === handovers.length - 1} onPress={() => nav.navigate('HandoverDetail', { id: h.id })} label="Open handover">
                  <ArrowRightLeft size={18} color={t.text} />
                  <View style={{ flex: 1 }}><Txt variant="small" strong>{athleteById(db, h.athleteId)?.name}</Txt><Txt variant="xs" muted>{h.fromId === c.coach?.id ? `To ${coachById(db, h.toId)?.name}` : `From ${coachById(db, h.fromId)?.name}`}</Txt></View>
                  <StatusBadge tone="outline" label={h.status} />
                </ListRow>
              ))}
            </Card>
          )}
        </Stack>
        {done.length > 0 ? (
          <Stack gap={2}>
            <Txt variant="h3">Done</Txt>
            <Card flush>{done.map((x, i) => <ListRow key={x.id} last={i === done.length - 1} onPress={() => nav.navigate('TaskDetail', { id: x.id })} label={`Open ${x.title}`}><Txt variant="small" style={{ flex: 1 }}>{x.title}</Txt><StatusBadge status={x.status} /></ListRow>)}</Card>
          </Stack>
        ) : null}
      </CoachGate>
    </CoachPage>
  );
}

/** CM08: a task with commit-time revalidation, so a stale view never overwrites the server. */
export function TaskDetail() {
  const { id } = useRoute<any>().params;
  const { db, update, audit, toast } = useStore();
  const c = useCoach();
  const nav = useNavigation<any>();
  const t = useTheme();
  const task = db.tasks.find((x) => x.id === id);
  const openedVersion = useRef(task?.version);
  const [blockOpen, setBlockOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [followOpen, setFollowOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [follow, setFollow] = useState('');
  const [stale, setStale] = useState(false);
  useCompanionContext(task ? { surface: 'coach', title: `Task · ${task.title}`, athleteId: task.athleteId, prompts: ['Summarise recent sessions', 'What’s the next action?'] } : null);
  if (!task) return <CoachPage back><NotFound what="task" /></CoachPage>;

  const athlete = athleteById(db, task.athleteId)!;
  const mineToAct = task.assigneeId === c.coach?.id;
  const evidence = observationsFor(db, task.athleteId).filter((o) => task.evidenceObservationIds.includes(o.id));
  const vids = db.videos.filter((v) => task.evidenceVideoIds.includes(v.id));
  const terminal = task.status === 'cancelled' || task.status === 'completed';
  const commit = (fn: () => void) => {
    const current = db.tasks.find((x) => x.id === task.id)!;
    if (current.version !== openedVersion.current) { setStale(true); return; }
    fn();
    openedVersion.current = (openedVersion.current ?? 0) + 1;
  };
  const setStatus = (status: typeof task.status, extra: Partial<typeof task> = {}, msg = '') =>
    commit(() => {
      update((d) => { const x = d.tasks.find((y) => y.id === task.id)!; Object.assign(x, { status, ...extra }); x.version += 1; });
      audit(c.person.name, `${msg || status} · ${task.title}`, task.id);
      if (msg) toast({ tone: 'ok', text: msg });
    });

  return (
    <CoachPage back>
      <CoachGate>
        <Stack gap={2}>
          <Row gap={2}><StatusBadge status={task.status} /><Txt variant="xs" muted>Due {fmtDate(task.due)}</Txt></Row>
          <Display size={38}>{task.title}</Display>
          <Row gap={1} wrap><Button size="sm" variant="ghost" onPress={() => nav.navigate('AthleteContext', { id: athlete.id })}>{athlete.name}</Button>{task.areaId ? <Txt variant="small" muted>· {areaById(db, task.areaId)?.title}</Txt> : null}</Row>
        </Stack>
        {task.status === 'cancelled' ? <StateBlock kind="archived" title="This task was cancelled" body={`${coachById(db, task.createdById)?.name} cancelled it. Your notes and clips stay on ${athlete.name}’s record.`} /> : null}
        {stale ? <Banner tone="warn" action={<Button size="sm" onPress={() => { openedVersion.current = db.tasks.find((x) => x.id === task.id)!.version; setStale(false); }}>Reload task</Button>}>This task changed on the server since you opened it. Nothing was saved. Review the latest version, then try again.</Banner> : null}
        {!mineToAct && !terminal ? <Banner tone="warn">This task is assigned to {coachById(db, task.assigneeId)?.name}. You can view it but not act on it.</Banner> : null}
        <Card style={{ borderLeftWidth: 4, borderLeftColor: t.ramp[700] }}>
          <Txt variant="xs" strong muted>Instruction from {coachById(db, task.createdById)?.name}</Txt>
          <Txt style={{ marginTop: 6 }}>{task.instruction}</Txt>
        </Card>
        {task.status === 'blocked' && task.blockedReason ? <Banner tone="err"><Txt variant="small"><Txt variant="small" strong>Blocked:</Txt> {task.blockedReason}</Txt></Banner> : null}
        {task.followUp ? <Banner tone="info"><Txt variant="small"><Txt variant="small" strong>Follow-up requested:</Txt> {task.followUp}</Txt></Banner> : null}
        <Stack gap={2}>
          <Txt variant="h3">Evidence</Txt>
          {evidence.length + vids.length === 0 ? <Txt variant="small" muted>No notes or clips attached yet.</Txt> : null}
          {evidence.map((o) => <Txt key={o.id} variant="small">“{o.text}” <Txt variant="xs" muted>· {fmtDate(o.createdAt)}</Txt></Txt>)}
          {vids.map((v) => <Stack key={v.id} gap={1}><Clip video={v} /><StatusBadge status={v.upload === 'uploaded' ? v.processing : v.upload} /></Stack>)}
          {mineToAct && !terminal ? (
            <Row gap={2}>
              <View style={{ flex: 1 }}><Button size="sm" block icon={<NotebookPen size={14} color={t.text} />} onPress={() => nav.navigate('Capture', { mode: 'note', athlete: athlete.id, task: task.id })}>Add note</Button></View>
              <View style={{ flex: 1 }}><Button size="sm" block icon={<VideoIcon size={14} color={t.text} />} onPress={() => nav.navigate('Capture', { mode: 'video', athlete: athlete.id, task: task.id })}>Attach video</Button></View>
            </Row>
          ) : null}
        </Stack>
        {mineToAct ? (
          <Stack gap={2}>
            {task.status === 'open' ? <Button variant="primary" size="lg" block icon={<Play size={16} color={t.accentInk} />} onPress={() => setStatus('in_progress', {}, 'Task started')}>Start work</Button> : null}
            {task.status === 'in_progress' || task.status === 'blocked' ? <Button variant="primary" size="lg" block icon={<Check size={16} color={t.accentInk} />} onPress={() => setCompleteOpen(true)}>Mark completed</Button> : null}
            {task.status === 'open' || task.status === 'in_progress' ? <Button block icon={<Ban size={16} color={t.text} />} onPress={() => setBlockOpen(true)}>Mark blocked</Button> : null}
            {task.status === 'completed' ? <Button block icon={<MessageSquarePlus size={16} color={t.text} />} onPress={() => setFollowOpen(true)}>Request follow-up</Button> : null}
          </Stack>
        ) : null}
        <ConfirmDialog open={completeOpen} title="Mark this task completed?" body={evidence.length + vids.length === 0 ? 'No evidence is attached. The head coach may ask for more.' : `${evidence.length + vids.length} item(s) of evidence attached. ${coachById(db, task.createdById)?.name} will be notified.`} confirmLabel="Mark completed" onCancel={() => setCompleteOpen(false)} onConfirm={() => { setCompleteOpen(false); setStatus('completed', { blockedReason: undefined }, 'Task completed. The head coach has been notified.'); }} />
        <ConfirmDialog open={blockOpen} title="What’s blocking this?" confirmLabel="Mark blocked" tone="danger" onCancel={() => setBlockOpen(false)} onConfirm={() => { if (!reason.trim()) return; setBlockOpen(false); setStatus('blocked', { blockedReason: reason.trim() }, 'Marked blocked. The head coach can reassign or reschedule.'); }}>
          <Field label="Reason" error={!reason.trim() ? 'A reason is required.' : undefined}><Input value={reason} onChangeText={setReason} /></Field>
        </ConfirmDialog>
        <ConfirmDialog open={followOpen} title="Request a follow-up" confirmLabel="Send request" onCancel={() => setFollowOpen(false)} onConfirm={() => { if (!follow.trim()) return; setFollowOpen(false); setStatus('completed', { followUp: follow.trim() }, 'Follow-up requested.'); }}>
          <Field label="What should happen next?"><Input multiline value={follow} onChangeText={setFollow} /></Field>
        </ConfirmDialog>
      </CoachGate>
    </CoachPage>
  );
}

/** CM09: start a handover to another coach. dit can draft the summary. */
export function HandoverNew() {
  const { athleteId: presetAthlete } = (useRoute<any>().params ?? {}) as { athleteId?: string };
  const { db, update, audit, toast } = useStore();
  const c = useCoach();
  const nav = useNavigation<any>();
  const [athleteId, setAthleteId] = useState(presetAthlete ?? '');
  const [summary, setSummary] = useState('');
  const [next, setNext] = useState('');
  const [to, setTo] = useState('');
  const [touched, setTouched] = useState(false);
  useCompanionContext({
    surface: 'coach', title: athleteId ? `Handover · ${athleteById(db, athleteId)?.name}` : 'New handover', athleteId: athleteId || undefined,
    prompts: athleteId ? ['Summarise recent sessions'] : ['What can you help with?'],
  }, { useText: { label: 'Use as summary', run: (x) => setSummary(x) } });
  const recipients = db.coaches.filter((x) => x.academyId === c.academy.id && x.status === 'active' && x.id !== c.coach?.id);
  const athletes = db.athletes.filter((a) => a.status === 'active' && c.inScope(a.id));
  const valid = athleteId && summary.trim() && to;
  const send = () => {
    setTouched(true);
    if (!valid) return;
    const hid = uid('h');
    update((d) => {
      d.handovers.push({ id: hid, athleteId, fromId: c.coach!.id, toId: to, summary: summary.trim(), nextAction: next.trim(), status: 'sent', createdAt: nowISO() });
      const toPerson = d.coaches.find((x) => x.id === to)?.personId;
      if (toPerson) d.notifications.push({ id: uid('n'), personId: toPerson, kind: 'handover', title: `Handover from ${c.person.name}`, body: `${athleteById(d, athleteId)?.name} — ${summary.trim().slice(0, 60)}`, route: `/coach/handover/${hid}`, target: { type: 'handover', id: hid }, createdAt: nowISO(), read: false });
    });
    audit(c.person.name, `Handed over ${athleteById(db, athleteId)?.name} to ${coachById(db, to)?.name}`, hid);
    toast({ tone: 'ok', text: `Handover sent to ${coachById(db, to)?.name}.` });
    nav.goBack();
  };
  return (
    <CoachPage back>
      <CoachGate>
        <Display size={40}>Start a handover</Display>
        <Field label="Athlete" error={touched && !athleteId ? 'Choose an athlete.' : undefined}><ChoiceGroup label="Athlete" value={athleteId} onChange={setAthleteId} options={athletes.map((a) => ({ v: a.id, label: a.name }))} /></Field>
        <Field label="Summary" hint="What the next coach needs to know. Ask dit to draft this from recent notes." error={touched && !summary.trim() ? 'Add a summary.' : undefined}><Input multiline value={summary} onChangeText={setSummary} /></Field>
        <Field label="Required next action" optional><Input value={next} onChangeText={setNext} /></Field>
        <Field label="Recipient" error={touched && !to ? 'Choose who receives it.' : undefined}><ChoiceGroup label="Recipient" value={to} onChange={setTo} options={recipients.map((r) => ({ v: r.id, label: `${r.name} · ${r.role.replace('_', ' ')}` }))} /></Field>
        <Button variant="primary" size="lg" block icon={<Send size={16} />} onPress={send}>Send handover</Button>
      </CoachGate>
    </CoachPage>
  );
}

/** CM09.05–06: read a handover and convert it to a follow-up task. */
export function HandoverDetail() {
  const { id } = useRoute<any>().params;
  const { db, update, audit, toast } = useStore();
  const c = useCoach();
  const nav = useNavigation<any>();
  const h = db.handovers.find((x) => x.id === id);
  useCompanionContext(h ? { surface: 'coach', title: `Handover · ${athleteById(db, h.athleteId)?.name}`, athleteId: h.athleteId, prompts: ['Summarise recent sessions'] } : null);
  useEffect(() => {
    if (h && h.toId === c.coach?.id && h.status === 'sent') update((d) => { const x = d.handovers.find((y) => y.id === h.id); if (x) x.status = 'opened'; });
  }, [h, c.coach?.id, update]);
  if (!h) return <CoachPage back><NotFound what="handover" /></CoachPage>;
  const isRecipient = h.toId === c.coach?.id;
  const convert = () => {
    const tid = uid('t');
    update((d) => {
      d.tasks.push({ id: tid, athleteId: h.athleteId, areaId: null, title: h.nextAction || 'Follow up on handover', instruction: h.summary, assigneeId: c.coach!.id, createdById: h.fromId, status: 'open', due: TODAY, evidenceObservationIds: [], evidenceVideoIds: [], createdAt: nowISO(), version: 1 });
      const x = d.handovers.find((y) => y.id === h.id)!; x.status = 'converted';
    });
    audit(c.person.name, 'Converted handover to task', tid);
    toast({ tone: 'ok', text: 'Follow-up task created.' });
    nav.replace('TaskDetail', { id: tid });
  };
  return (
    <CoachPage back>
      <CoachGate>
        <Stack gap={2}>
          <StatusBadge tone="outline" label={h.status} />
          <Display size={36}>Handover: {athleteById(db, h.athleteId)?.name}</Display>
          <Txt variant="small" muted>From {coachById(db, h.fromId)?.name} to {coachById(db, h.toId)?.name} · {fmtDate(h.createdAt)}</Txt>
        </Stack>
        <Card><Txt variant="xs" strong muted>Summary</Txt><Txt style={{ marginTop: 4 }}>{h.summary}</Txt></Card>
        {h.nextAction ? <Banner tone="ok"><Txt variant="small"><Txt variant="small" strong>Required next action:</Txt> {h.nextAction}</Txt></Banner> : null}
        {isRecipient && h.status !== 'converted' ? <Button variant="primary" size="lg" block onPress={convert}>Convert to follow-up task</Button> : null}
      </CoachGate>
    </CoachPage>
  );
}
export { SectionTitle };
