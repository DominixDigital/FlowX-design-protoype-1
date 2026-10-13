import { View } from 'react-native';
import { AlertTriangle, CloudOff, RefreshCw, Server, Smartphone, Wifi } from 'lucide-react-native';
import { useStore } from 'ditcore/store/store';
import { athleteById } from 'ditcore/store/selectors';
import { useTheme } from '../../theme/ThemeProvider';
import { Banner, Button, Card, Display, ListRow, Row, Stack, StateBlock, StatusBadge, Txt } from '../../ui';
import { useCompanionContext } from '../../companion/Companion';
import { CoachPage } from './parts';

/** CM14 · XS04: the offline queue, conflicts and retries. */
export function Sync() {
  const { db, sim, setSim, retry, resolveConflict } = useStore();
  const t = useTheme();
  useCompanionContext({ surface: 'coach', title: 'Sync queue', prompts: ['What can you help with?'] });
  const queue = db.queue;
  const uploads = db.videos.filter((v) => v.upload !== 'uploaded' || v.processing === 'processing');
  const conflicts = queue.filter((q) => q.status === 'conflict');
  const rest = queue.filter((q) => q.status !== 'conflict');
  const clear = queue.length === 0 && uploads.length === 0;
  return (
    <CoachPage back title="Sync">
      <Display size={40}>{!sim.online ? 'Working offline' : clear ? 'All synced' : 'Syncing'}</Display>
      {sim.online ? (
        <Banner tone={clear ? 'ok' : 'info'} action={<Button size="sm" onPress={() => setSim({ online: false })}>Go offline</Button>}>
          <Row gap={1}><Wifi size={14} color={t.text} /><Txt variant="small" style={{ flex: 1 }}>Connected. {clear ? 'Everything you captured is on the server.' : 'Changes are sending in order.'}</Txt></Row>
        </Banner>
      ) : (
        <Banner tone="warn" action={<Button size="sm" variant="primary" onPress={() => setSim({ online: true })}>Reconnect</Button>}>
          <Row gap={1} center={false}><CloudOff size={14} color={t.text} style={{ marginTop: 3 }} /><Txt variant="small" style={{ flex: 1 }}>No connection. Today’s sessions and rosters are cached. Attendance, notes and clips save here and sync when you reconnect.</Txt></Row>
        </Banner>
      )}
      <Txt variant="xs" muted>Connection is simulated. Use the switch here or the prototype controls.</Txt>

      {conflicts.map((q) => {
        const name = athleteById(db, q.conflict?.field)?.name ?? q.conflict?.field;
        return (
          <Card key={q.id} style={{ borderColor: t.err, borderWidth: 1.5 }}>
            <Stack gap={3}>
              <Row gap={2}><AlertTriangle size={18} color={t.err} /><Txt variant="h3">Choose which version to keep</Txt></Row>
              <Txt variant="small" muted>{q.label}: <Txt variant="small" strong>{name}</Txt> was changed on the server while you were offline. Nothing is overwritten until you choose.</Txt>
              <Row gap={2} center={false}>
                <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: t.surfaceSunk, gap: 4 }}>
                  <Row gap={1}><Smartphone size={12} color={t.text} /><Txt variant="xs" strong>Your change</Txt></Row>
                  <Txt variant="num" style={{ textTransform: 'capitalize' }}>{q.conflict?.mine}</Txt>
                  <Txt variant="xs" muted>This device, just now</Txt>
                </View>
                <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: t.surfaceSunk, gap: 4 }}>
                  <Row gap={1}><Server size={12} color={t.text} /><Txt variant="xs" strong>Server version</Txt></Row>
                  <Txt variant="num" style={{ textTransform: 'capitalize' }}>{q.conflict?.theirs}</Txt>
                  <Txt variant="xs" muted>{q.conflict?.theirsBy}</Txt>
                </View>
              </Row>
              <Row gap={2}><View style={{ flex: 1 }}><Button variant="primary" block onPress={() => resolveConflict(q.id, 'mine')}>Keep mine</Button></View><View style={{ flex: 1 }}><Button block onPress={() => resolveConflict(q.id, 'theirs')}>Keep server</Button></View></Row>
            </Stack>
          </Card>
        );
      })}

      <Stack gap={2}>
        <Txt variant="h3">Queue</Txt>
        {rest.length === 0 && uploads.length === 0 && conflicts.length === 0 ? <StateBlock kind="empty" title="Nothing waiting" body="Anything you capture while offline shows here until it reaches the server." /> : null}
        {rest.length > 0 || uploads.length > 0 ? (
          <Card flush>
            {rest.map((q, i) => (
              <ListRow key={q.id} last={i === rest.length - 1 && !uploads.length} style={{ alignItems: 'flex-start' }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt variant="small" strong>{q.label}</Txt>
                  {q.error ? <Txt variant="xs" color={t.err}>{q.error}</Txt> : null}
                  <Txt variant="xs" muted>Attempts: {q.attempts} · key {q.idempotencyKey.slice(-6)}</Txt>
                </View>
                <View style={{ gap: 6, alignItems: 'flex-end' }}>
                  <StatusBadge status={q.status} />
                  {q.status === 'failed' && sim.online ? <Button size="sm" icon={<RefreshCw size={12} color={t.text} />} onPress={() => retry(q.id)}>Retry</Button> : null}
                </View>
              </ListRow>
            ))}
            {uploads.map((v, i) => (
              <ListRow key={v.id} last={i === uploads.length - 1}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Txt variant="small" strong>Clip · {v.title}</Txt>
                  {v.upload === 'uploading' ? <View style={{ height: 6, borderRadius: 3, backgroundColor: t.surfaceSunk }}><View style={{ width: `${v.progress}%`, height: 6, borderRadius: 3, backgroundColor: t.hl }} /></View> : null}
                </View>
                <StatusBadge status={v.upload === 'uploaded' ? v.processing : v.upload} />
              </ListRow>
            ))}
          </Card>
        ) : null}
        {rest.some((q) => q.status === 'failed') ? <Txt variant="xs" muted>Retry is safe. Each item carries the same key, so the server never saves it twice.</Txt> : null}
      </Stack>
      {clear && sim.online ? <Banner tone="ok">Sync complete.</Banner> : null}
    </CoachPage>
  );
}
