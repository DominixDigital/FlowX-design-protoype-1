import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Bell, ChevronRight, ClipboardList, Flag, MapPin, PlayCircle, ArrowRightLeft } from 'lucide-react-native';
import { useStore } from 'ditcore/store/store';
import { TODAY } from 'ditcore/data/fixtures';
import { athleteById, areaById, batchById, fmtDate, locationName, relDay, daysUntil } from 'ditcore/store/selectors';
import { useCoach } from 'ditcore/surfaces/coach/useCoach';
import { useTheme } from '../../theme/ThemeProvider';
import { Avatar, Banner, Button, Card, Display, ListRow, Row, Screen, SectionTitle, Stack, StateBlock, StatusBadge, Txt } from '../../ui';
import { useCompanionContext } from '../../companion/Companion';
import { goToPath } from '../../navigation/ref';
import { CoachGate, CoachTop } from './parts';

export function Today() {
  const { db } = useStore();
  const c = useCoach();
  const nav = useNavigation<any>();
  const t = useTheme();
  useCompanionContext({ surface: 'coach', title: `Today’s work · ${c.academy.name}`, prompts: ['What can you help with?'] });

  const mySessions = db.sessions
    .filter((s) => s.date === TODAY && s.status !== 'cancelled')
    .filter((s) => {
      if (!c.coach) return false;
      if (c.role === 'head_coach') return true;
      const b = batchById(db, s.batchId);
      return s.coachId === c.coach.id || b?.assistantIds.includes(c.coach.id);
    })
    .filter((s) => batchById(db, s.batchId)?.academyId === c.academy.id)
    .sort((a, b) => a.start.localeCompare(b.start));
  const inProgress = db.sessions.find((s) => s.status === 'in_progress' && s.coachId === c.coach?.id);
  const reassess = db.reassessments.filter((r) => r.assigneeId === c.coach?.id && (r.status === 'pending' || r.status === 'in_progress'));
  const tasks = db.tasks.filter((x) => x.assigneeId === c.coach?.id && ['open', 'in_progress', 'blocked'].includes(x.status));
  const handovers = db.handovers.filter((h) => h.toId === c.coach?.id && h.status !== 'converted');
  const unread = db.notifications.filter((n) => n.personId === c.person.id && !n.read);
  const day = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${TODAY}T12:00`));

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <CoachTop title={undefined} right={
        <Pressable accessibilityRole="button" accessibilityLabel={`Academy and role: ${c.academy.name}, ${c.role ?? 'none'}. Change`} onPress={() => nav.navigate('Context')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 190 }}>
          <Avatar name={c.person.name} size={30} />
          <View style={{ flexShrink: 1 }}>
            <Txt variant="xs" strong numberOfLines={1}>{c.academy.name}</Txt>
            <Txt variant="xs" muted numberOfLines={1} style={{ textTransform: 'capitalize' }}>{c.role?.replace('_', ' ')}{c.membership?.expiresOn ? ` · until ${fmtDate(c.membership.expiresOn)}` : ''}</Txt>
          </View>
        </Pressable>
      } />
      <Screen>
        <CoachGate>
          <View style={{ gap: 4 }}>
            <Txt variant="small" muted>{day}</Txt>
            <Display size={52}>{mySessions.length ? `${mySessions.length} session${mySessions.length > 1 ? 's' : ''}\ntoday` : 'No sessions today'}</Display>
          </View>

          {inProgress ? <Banner tone="warn" action={<Button size="sm" onPress={() => nav.navigate('SessionDetail', { id: inProgress.id })}>Resume</Button>}><Txt variant="small"><Txt variant="small" strong>{inProgress.title}</Txt> is still in progress. Pick up where you left off.</Txt></Banner> : null}

          <Stack gap={3}>
            {mySessions.length === 0 ? <StateBlock kind="empty" title="Nothing scheduled" body="When the academy schedules a session for your batches, it appears here. You can still capture notes from the + button." /> : null}
            {mySessions.map((s) => {
              const batch = batchById(db, s.batchId)!;
              const n = Object.keys(s.attendance).length;
              const marked = Object.values(s.attendance).filter((m) => m !== 'unmarked').length;
              return (
                <Card key={s.id} flush onPress={() => nav.navigate('SessionDetail', { id: s.id })} label={`Open ${s.title}`}>
                  <View style={{ flexDirection: 'row' }}>
                    <View style={{ width: 88, paddingVertical: 14, paddingLeft: 16, borderRightWidth: 1, borderRightColor: t.line }}>
                      <Txt variant="num" style={{ fontSize: 32, lineHeight: 34 }}>{s.start}</Txt>
                      <Txt variant="xs" muted>to {s.end}</Txt>
                    </View>
                    <View style={{ flex: 1, padding: 14, gap: 4 }}>
                      <Row between>
                        <Txt variant="xs" strong color={t.roleText} style={{ flexShrink: 1 }}>{batch.name}</Txt>
                        <StatusBadge status={s.status === 'in_progress' ? 'in_progress' : s.status} label={s.status === 'in_progress' ? 'Live' : undefined} />
                      </Row>
                      <Txt strong>{s.title}</Txt>
                      <Row gap={1}><MapPin size={12} color={t.textMuted} /><Txt variant="xs" muted style={{ flexShrink: 1 }}>{locationName(db, s.locationId)} · {marked}/{n} marked</Txt></Row>
                    </View>
                  </View>
                </Card>
              );
            })}
          </Stack>

          {reassess.length > 0 || tasks.length > 0 || handovers.length > 0 ? (
            <Stack gap={2}>
              <Txt variant="h3">Needs you</Txt>
              <Card flush>
                {reassess.map((r, i) => (
                  <ListRow key={r.id} last={i === reassess.length - 1 && !tasks.length && !handovers.length} onPress={() => nav.navigate('Reassess', { id: r.id })} label="Open reassessment">
                    <Flag size={18} color={t.roleText} />
                    <View style={{ flex: 1 }}><Txt variant="small" strong>Reassess {athleteById(db, r.athleteId)?.name}</Txt><Txt variant="xs" muted>{areaById(db, r.areaId)?.title}</Txt></View>
                    <StatusBadge tone="lime" label={relDay(r.due)} />
                  </ListRow>
                ))}
                {tasks.map((x, i) => (
                  <ListRow key={x.id} last={i === tasks.length - 1 && !handovers.length} onPress={() => nav.navigate('TaskDetail', { id: x.id })} label="Open task">
                    <ClipboardList size={18} color={t.roleText} />
                    <View style={{ flex: 1 }}><Txt variant="small" strong>{x.title}</Txt><Txt variant="xs" muted>{athleteById(db, x.athleteId)?.name} · due {daysUntil(x.due) === 0 ? 'today' : fmtDate(x.due)}</Txt></View>
                    <StatusBadge status={x.status} />
                  </ListRow>
                ))}
                {handovers.map((h, i) => (
                  <ListRow key={h.id} last={i === handovers.length - 1} onPress={() => nav.navigate('HandoverDetail', { id: h.id })} label="Open handover">
                    <ArrowRightLeft size={18} color={t.roleText} />
                    <View style={{ flex: 1 }}><Txt variant="small" strong>Handover: {athleteById(db, h.athleteId)?.name}</Txt><Txt variant="xs" muted>From {db.coaches.find((x) => x.id === h.fromId)?.name}</Txt></View>
                    <ChevronRight size={16} color={t.textMuted} />
                  </ListRow>
                ))}
              </Card>
            </Stack>
          ) : null}

          {unread.length > 0 ? (
            <Stack gap={2}>
              <Txt variant="h3">Notifications</Txt>
              <Card flush>
                {unread.map((n, i) => (
                  <ListRow key={n.id} last={i === unread.length - 1} onPress={() => goToPath(n.route)} label={n.title}>
                    <Bell size={18} color={t.text} />
                    <View style={{ flex: 1 }}><Txt variant="small" strong>{n.title}</Txt><Txt variant="xs" muted>{n.body}</Txt></View>
                  </ListRow>
                ))}
              </Card>
            </Stack>
          ) : null}

          <Pressable accessibilityRole="button" onPress={() => nav.navigate('Tabs', { screen: 'Sessions' })} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }}>
            <PlayCircle size={16} color={t.text} /><Txt variant="small" strong>All sessions and history</Txt>
          </Pressable>
        </CoachGate>
      </Screen>
    </View>
  );
}

export { SectionTitle };
