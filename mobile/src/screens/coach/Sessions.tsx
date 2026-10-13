import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AlertTriangle, Check, Clock, CloudOff, History, MapPin, Play, Search, Square, UserPlus, Users, X } from 'lucide-react-native';
import { useStore } from 'ditcore/store/store';
import { TODAY } from 'ditcore/data/fixtures';
import { athleteById, batchById, fmtDate, locationName } from 'ditcore/store/selectors';
import type { AttendanceMark, Session } from 'ditcore/data/types';
import { useCoach } from 'ditcore/surfaces/coach/useCoach';
import { useTheme } from '../../theme/ThemeProvider';
import { Avatar, Banner, Button, Card, ConfirmDialog, Display, Field, Input, ListRow, Row, Segmented, Sheet, Stack, StateBlock, StatusBadge, Txt } from '../../ui';
import { DitInline, useCompanionContext, useHideFab } from '../../companion/Companion';
import { CoachGate, CoachPage, NotFound } from './parts';

export function Sessions() {
  const { db } = useStore();
  const c = useCoach();
  const nav = useNavigation<any>();
  const t = useTheme();
  useCompanionContext({ surface: 'coach', title: 'Sessions', prompts: ['What can you help with?'] });
  const mine = db.sessions.filter((s) => c.role === 'head_coach' || s.coachId === c.coach?.id || batchById(db, s.batchId)?.assistantIds.includes(c.coach?.id ?? ''));
  const upcoming = mine.filter((s) => s.date >= TODAY && s.status !== 'completed' && s.status !== 'cancelled').sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const history = mine.filter((s) => s.status === 'completed' || s.status === 'cancelled').sort((a, b) => b.date.localeCompare(a.date));
  const list = (items: Session[]) => (
    <Card flush>
      {items.map((s, i) => (
        <ListRow key={s.id} last={i === items.length - 1} onPress={() => nav.navigate('SessionDetail', { id: s.id })} label={`Open ${s.title}`}>
          <View style={{ width: 44 }}><Txt variant="num" style={{ fontSize: 22 }}>{fmtDate(s.date, { day: 'numeric' })}</Txt><Txt variant="xs" muted>{fmtDate(s.date, { month: 'short' })}</Txt></View>
          <View style={{ flex: 1 }}><Txt variant="small" strong>{s.title}</Txt><Txt variant="xs" muted>{batchById(db, s.batchId)?.name} · {s.start}</Txt></View>
          <StatusBadge status={s.status} />
        </ListRow>
      ))}
    </Card>
  );
  return (
    <CoachPage title="Sessions">
      <CoachGate>
        <Display size={44}>Sessions</Display>
        <Stack gap={2}><Txt variant="h3">Coming up</Txt>{upcoming.length ? list(upcoming) : <StateBlock kind="empty" title="No upcoming sessions" />}</Stack>
        <Stack gap={2}><Row gap={2}><History size={16} color={t.text} /><Txt variant="h3">History</Txt></Row>{history.length ? list(history) : <StateBlock kind="empty" title="No past sessions yet" />}</Stack>
      </CoachGate>
    </CoachPage>
  );
}

export function SessionDetail() {
  const { id } = useRoute<any>().params;
  const { db, update, command, sim, toast, audit } = useStore();
  const c = useCoach();
  const nav = useNavigation<any>();
  const t = useTheme();
  const session = db.sessions.find((s) => s.id === id);
  const [draft, setDraft] = useState<Record<string, AttendanceMark> | null>(null);
  const [saving, setSaving] = useState(false);
  const [notListed, setNotListed] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [plan, setPlan] = useState(false);
  const [q, setQ] = useState('');

  useCompanionContext(session ? { surface: 'coach', title: `${session.title} · ${batchById(db, session.batchId)?.name}`, sessionId: session.id, prompts: ['What can you help with?'] } : null);
  useHideFab(); // the attendance buttons sit on the right edge

  const marks = draft ?? session?.attendance ?? {};
  const roster = useMemo(() => Object.keys(marks), [marks]);
  if (!session) return <CoachPage back><NotFound what="session" /></CoachPage>;

  const batch = batchById(db, session.batchId)!;
  const isPast = session.status === 'completed';
  const unmarked = roster.filter((a) => marks[a] === 'unmarked').length;
  const present = roster.filter((a) => marks[a] === 'present').length;
  const dirty = draft !== null;
  const hasSaved = Object.values(session.attendance).some((m) => m !== 'unmarked');
  const mark = (aid: string, m: AttendanceMark) => setDraft({ ...marks, [aid]: m });

  const start = () => {
    update((d) => { const s = d.sessions.find((x) => x.id === session.id)!; s.status = 'in_progress'; });
    audit(c.person.name, `Started session ${session.title}`, session.id);
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const changed = Object.keys(draft).filter((k) => draft[k] !== session.attendance[k]);
    const correcting = hasSaved;
    const res = await command({
      kind: 'attendance', label: `Attendance · ${session.title}`, refId: session.id,
      apply: (d) => { const s = d.sessions.find((x) => x.id === session.id)!; s.attendance = { ...draft }; },
      setSync: (d, st) => { const s = d.sessions.find((x) => x.id === session.id); if (s) s.attendanceSync = st; },
      conflict: { field: 'a-kabir', mine: draft['a-kabir'] ?? 'present', theirs: 'absent', theirsBy: 'Rohan Shah (web), 2 min ago' },
    });
    setSaving(false);
    setDraft(null);
    if (correcting) audit(c.person.name, `Corrected attendance for ${changed.length} athlete(s) in ${session.title}`, session.id);
    toast(
      res === 'queued' ? { tone: 'warn', text: 'Attendance saved on this device. It will sync when you reconnect.' }
        : res === 'failed' ? { tone: 'err', text: 'Attendance didn’t reach the server. It’s kept here. Open the sync queue to retry or resolve.', action: { label: 'Open queue', run: () => nav.navigate('Sync') } }
          : res === 'conflict' ? { tone: 'err', text: 'Someone changed this attendance on the web. Choose which version to keep.', action: { label: 'Resolve', run: () => nav.navigate('Sync') } }
            : res === 'uncertain' ? { tone: 'warn', text: 'No confirmation from the server. Retry is safe: it won’t double-count.', action: { label: 'Open queue', run: () => nav.navigate('Sync') } }
              : { tone: 'ok', text: correcting ? 'Attendance corrected.' : `Attendance saved: ${present} present.` },
    );
  };

  const others = db.athletes.filter((a) => !roster.includes(a.id) && a.status === 'active' && a.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <CoachPage back right={<DitInline />}>
      <CoachGate>
        <Stack gap={2}>
          <Row gap={2} wrap>
            <Txt variant="xs" strong color={t.roleText}>{batch.name}</Txt>
            <StatusBadge status={session.status} label={session.status === 'in_progress' ? 'Live' : undefined} />
            {session.attendanceSync !== 'synced' ? <StatusBadge status={session.attendanceSync} /> : null}
          </Row>
          <Display size={40}>{session.title}</Display>
          <Stack gap={1}>
            <Row gap={2}><Clock size={14} color={t.textMuted} /><Txt variant="small" muted>{fmtDate(session.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {session.start}–{session.end}</Txt></Row>
            <Row gap={2}><MapPin size={14} color={t.textMuted} /><Txt variant="small" muted>{locationName(db, session.locationId)}</Txt></Row>
            <Row gap={2}><Users size={14} color={t.textMuted} /><Txt variant="small" muted>{roster.length} athletes</Txt></Row>
          </Stack>
          <Card style={{ backgroundColor: t.surfaceSunk }} onPress={() => setPlan(!plan)} label="Session plan">
            <Txt variant="small" strong>Session plan {plan ? '▴' : '▾'}</Txt>
            {plan ? <Txt variant="small" style={{ marginTop: 8 }}>{session.plan}</Txt> : null}
          </Card>
        </Stack>

        {session.status === 'scheduled' ? (
          <Stack gap={2}><Button variant="primary" size="lg" block onPress={start} icon={<Play size={18} color={t.accentInk} />}>Start session</Button><Txt variant="xs" muted>You can take attendance before or after starting.</Txt></Stack>
        ) : null}
        {session.status === 'cancelled' ? <Banner tone="warn">This session was cancelled. Its record is kept for history.</Banner> : null}
        {!sim.online ? <Banner tone="info"><Row gap={1} center={false}><CloudOff size={14} color={t.info} style={{ marginTop: 3 }} /><Txt variant="small" style={{ flex: 1 }}>You’re offline. This session is cached, so attendance and notes save here and sync later.</Txt></Row></Banner> : null}

        <Stack gap={2}>
          <Row between><Txt variant="h3">Attendance</Txt><Txt variant="small" muted>{present} present · {unmarked} unmarked</Txt></Row>
          {isPast && hasSaved && !dirty ? <Txt variant="xs" muted>Correcting past attendance is logged in the audit history.</Txt> : null}
          <Row gap={2}>
            <Button size="sm" disabled={!unmarked} onPress={() => setDraft(Object.fromEntries(roster.map((a) => [a, marks[a] === 'unmarked' ? 'present' : marks[a]])))}>Mark the rest present</Button>
            <Button size="sm" variant="ghost" icon={<UserPlus size={14} color={t.text} />} onPress={() => setNotListed(true)}>Not listed?</Button>
          </Row>
          <Card flush>
            {roster.map((aid, i) => {
              const a = athleteById(db, aid)!;
              const walkIn = session.walkIns.includes(aid);
              return (
                <ListRow key={aid} last={i === roster.length - 1} onPress={() => nav.navigate('AthleteContext', { id: aid, session: session.id })} label={`Open ${a.name}`}>
                  <Avatar name={a.name} size={34} />
                  <View style={{ flex: 1 }}><Txt variant="small" strong>{a.name}</Txt><Txt variant="xs" muted>{walkIn ? 'Walk-in · pending admin review' : a.discipline}</Txt></View>
                  <Segmented label={`Attendance for ${a.name}`} value={marks[aid] === 'unmarked' ? null : (marks[aid] as 'present' | 'absent')} onChange={(v) => mark(aid, v)} options={[
                    { v: 'present', label: `${a.name} present`, node: <Check size={16} color={marks[aid] === 'present' ? t.ok : t.textMuted} /> },
                    { v: 'absent', label: `${a.name} absent`, tone: 'err', node: <X size={16} color={marks[aid] === 'absent' ? t.err : t.textMuted} /> },
                  ]} />
                </ListRow>
              );
            })}
          </Card>
          {dirty || session.attendanceSync === 'failed' ? <Button variant="primary" size="lg" block pending={saving} disabled={!dirty} onPress={save}>{`${hasSaved ? 'Save corrections' : 'Save attendance'}${unmarked ? ` (${unmarked} unmarked)` : ''}`}</Button> : null}
          {session.attendanceSync === 'conflict' ? <Banner tone="err" action={<Button size="sm" onPress={() => nav.navigate('Sync')}>Resolve</Button>}><Row gap={1} center={false}><AlertTriangle size={14} color={t.err} style={{ marginTop: 3 }} /><Txt variant="small" style={{ flex: 1 }}>Someone changed this attendance on the web while you were editing.</Txt></Row></Banner> : null}
        </Stack>

        {session.status === 'in_progress' ? <Button block size="lg" icon={<Square size={16} color={t.text} />} onPress={() => setConfirmEnd(true)}>End session</Button> : null}
        {session.status === 'completed' ? <Button block onPress={() => nav.navigate('WrapUp', { id: session.id })}>Session summary</Button> : null}

        <ConfirmDialog open={confirmEnd} title="End this session?" body="Next you’ll check draft notes and uploads before the session is marked complete." confirmLabel="End and review" onCancel={() => setConfirmEnd(false)} onConfirm={() => { setConfirmEnd(false); nav.navigate('WrapUp', { id: session.id }); }} />

        <Sheet visible={notListed} onClose={() => setNotListed(false)}>
          <View style={{ padding: 16, gap: 12 }}>
            <Txt variant="h2">Athlete not on the roster</Txt>
            <Txt variant="xs" color={t.warn}>Assumption CM03.04: walk-ins are marked present and flagged for admin review.</Txt>
            <Field label="Search the academy"><Row gap={2}><Search size={16} color={t.textMuted} /><View style={{ flex: 1 }}><Input value={q} onChangeText={setQ} placeholder="Name" /></View></Row></Field>
            <Card flush style={{ maxHeight: 240 }}>
              {others.length === 0 ? <ListRow last><Txt variant="small" muted>No matching athlete. Ask an admin to add them first.</Txt></ListRow> : null}
              {others.map((a, i) => (
                <ListRow key={a.id} last={i === others.length - 1} label={`Add ${a.name}`} onPress={() => {
                  update((d) => { const s = d.sessions.find((x) => x.id === session.id)!; s.attendance[a.id] = 'present'; s.walkIns.push(a.id); });
                  audit(c.person.name, `Added walk-in ${a.name} to ${session.title} (pending review)`, session.id);
                  toast({ tone: 'info', text: `${a.name} added as a walk-in and marked present. An admin will review.` });
                  setNotListed(false);
                }}>
                  <Avatar name={a.name} size={34} />
                  <View style={{ flex: 1 }}><Txt variant="small" strong>{a.name}</Txt><Txt variant="xs" muted>{batchById(db, a.batchId)?.name ?? 'No batch'}</Txt></View>
                  <UserPlus size={16} color={t.text} />
                </ListRow>
              ))}
            </Card>
            <Button onPress={() => setNotListed(false)}>Close</Button>
          </View>
        </Sheet>
      </CoachGate>
    </CoachPage>
  );
}

function Item({ ok, label, detail, action }: { ok: boolean; label: string; detail: string; action?: React.ReactNode }) {
  const t = useTheme();
  return (
    <ListRow style={{ alignItems: 'flex-start' }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: ok ? t.okBg : t.warnBg, alignItems: 'center', justifyContent: 'center' }}>{ok ? <Check size={14} color={t.ok} /> : <AlertTriangle size={14} color={t.warn} />}</View>
      <View style={{ flex: 1, gap: 4 }}><Txt variant="small" strong>{label}</Txt><Txt variant="xs" muted>{detail}</Txt>{action}</View>
    </ListRow>
  );
}

export function WrapUp() {
  const { id } = useRoute<any>().params;
  const { db, update, audit, toast } = useStore();
  const c = useCoach();
  const nav = useNavigation<any>();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const session = db.sessions.find((s) => s.id === id);
  useCompanionContext(session ? { surface: 'coach', title: `Wrap-up · ${session.title}`, sessionId: session.id, prompts: ['What can you help with?'] } : null);
  if (!session) return <CoachPage back><NotFound what="session" /></CoachPage>;

  const drafts = db.observations.filter((o) => o.sessionId === session.id && o.status === 'draft');
  const uploads = db.videos.filter((v) => v.sessionId === session.id && v.upload !== 'uploaded');
  const unsyncedAttendance = session.attendanceSync !== 'synced';
  const unmarked = Object.values(session.attendance).filter((m) => m === 'unmarked').length;
  const notes = db.observations.filter((o) => o.sessionId === session.id && o.status === 'saved');
  const done = session.status === 'completed';
  const blockers = drafts.length + (unmarked ? 1 : 0);
  const complete = () => {
    update((d) => { const s = d.sessions.find((x) => x.id === session.id)!; s.status = 'completed'; });
    audit(c.person.name, `Completed session ${session.title}`, session.id);
    toast({ tone: 'ok', text: uploads.length ? 'Session complete. Uploads will continue in the background.' : 'Session complete.' });
  };
  return (
    <CoachPage back>
      <CoachGate>
        <Stack gap={1}><Txt variant="small" muted>{session.title}</Txt><Display size={40}>{done ? 'Session complete' : 'Wrap up'}</Display></Stack>
        <Card flush>
          <Item ok={!unmarked && !unsyncedAttendance} label="Attendance" detail={unmarked ? `${unmarked} athletes still unmarked` : unsyncedAttendance ? `Saved on device · ${session.attendanceSync}` : 'Saved and synced'} action={unmarked ? <Button size="sm" onPress={() => nav.navigate('SessionDetail', { id: session.id })}>Finish attendance</Button> : undefined} />
          <Item ok={drafts.length === 0} label="Draft notes" detail={drafts.length ? `${drafts.length} unsaved draft(s)` : `${notes.length} notes saved this session`} action={drafts.length ? (
            <Row gap={2}>
              <Button size="sm" onPress={() => update((d) => d.observations.forEach((o) => { if (o.sessionId === session.id && o.status === 'draft') o.status = 'saved'; }))}>Save all</Button>
              <Button size="sm" variant="ghost" onPress={() => update((d) => { d.observations = d.observations.filter((o) => !(o.sessionId === session.id && o.status === 'draft')); })}>Discard</Button>
            </Row>
          ) : undefined} />
          <Item ok={uploads.length === 0} label="Uploads" detail={uploads.length ? `${uploads.length} clip(s) ${uploads.map((u) => u.upload).join(', ')}. They can finish in the background` : 'Nothing waiting'} action={uploads.length ? <Button size="sm" onPress={() => nav.navigate('Sync')}>View queue</Button> : undefined} />
        </Card>
        {!done ? (
          <Stack gap={2}>
            <Button variant="primary" size="lg" block disabled={blockers > 0} onPress={complete}>Complete session</Button>
            {blockers > 0 ? <Txt variant="xs" muted>Resolve attendance and draft notes first. Uploads can finish later.</Txt> : null}
            <Button variant="danger" block onPress={() => setCancelOpen(true)}>Cancel session</Button>
          </Stack>
        ) : (
          <Stack gap={2}>
            <Banner tone="ok">Saved to every athlete’s history. Head coaches see it on the web now.</Banner>
            <Button block onPress={() => nav.navigate('Tabs', { screen: 'Sessions' })}>View session history</Button>
            <Txt variant="xs" muted>Need to fix something later? Open the session from history. Edits to past sessions are logged.</Txt>
          </Stack>
        )}
        <ConfirmDialog open={cancelOpen} title="Cancel this session?" body="Athletes and parents will see it as cancelled. Attendance and notes already taken are kept in history." confirmLabel="Cancel session" tone="danger" onCancel={() => setCancelOpen(false)} onConfirm={() => {
          if (!reason.trim()) return;
          update((d) => { const s = d.sessions.find((x) => x.id === session.id)!; s.status = 'cancelled'; });
          audit(c.person.name, `Cancelled ${session.title}: ${reason}`, session.id);
          setCancelOpen(false);
          nav.navigate('Tabs', { screen: 'Today' });
          toast({ tone: 'info', text: 'Session cancelled.' });
        }}>
          <Field label="Reason" error={!reason.trim() ? 'A reason is required.' : undefined}><Input value={reason} onChangeText={setReason} placeholder="e.g. Rain, ground waterlogged" /></Field>
        </ConfirmDialog>
      </CoachGate>
    </CoachPage>
  );
}
