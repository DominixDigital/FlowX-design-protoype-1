import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AlertTriangle, Check, CloudOff, RefreshCw } from 'lucide-react-native';
import { useStore } from 'ditcore/store/store';
import { useCoach, denyReason } from 'ditcore/surfaces/coach/useCoach';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, raw } from '../../theme/tokens';
import { Button, Row, Screen, StateBlock } from '../../ui';
import { TopBar } from '../../ui/TopBar';

/** Sync state in the header. Opens the queue. */
export function SyncPill() {
  const { db, sim } = useStore();
  const nav = useNavigation<any>();
  const t = useTheme();
  const conflicts = db.queue.filter((q) => q.status === 'conflict').length;
  const failed = db.queue.filter((q) => q.status === 'failed').length;
  const pending = db.queue.filter((q) => q.status === 'queued' || q.status === 'sending').length;
  let tone: 'ok' | 'warn' | 'err' | 'info' = 'ok';
  let label = 'Synced';
  let Icon = Check;
  if (!sim.online) { tone = 'warn'; label = `Offline${pending ? ` · ${pending}` : ''}`; Icon = CloudOff; }
  else if (conflicts) { tone = 'err'; label = `${conflicts} conflict${conflicts > 1 ? 's' : ''}`; Icon = AlertTriangle; }
  else if (failed) { tone = 'err'; label = `${failed} failed`; Icon = AlertTriangle; }
  else if (pending) { tone = 'info'; label = `Syncing ${pending}`; Icon = RefreshCw; }
  const [bg, fg] = { ok: [t.okBg, t.ok], warn: [t.warnBg, t.warn], err: [t.errBg, t.err], info: [t.infoBg, t.info] }[tone];
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Sync status: ${label}. Open sync queue`} onPress={() => nav.navigate('Sync')} hitSlop={6}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 30, paddingHorizontal: 10, borderRadius: 15, backgroundColor: bg }}>
      <Icon size={12} color={fg} />
      <Text style={{ color: fg, fontFamily: fonts.bodySemi, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

export function CoachTop({ back, title, sub, right }: { back?: boolean; title?: string; sub?: string; right?: ReactNode }) {
  return <TopBar back={back} title={title} sub={sub} right={<Row gap={2}>{right}<SyncPill /></Row>} />;
}

/** Wraps any coach screen: revalidates role, academy and access on every render. */
export function CoachGate({ children }: { children: ReactNode }) {
  const c = useCoach();
  const nav = useNavigation<any>();
  if (c.canAct) return <>{children}</>;
  return <StateBlock kind="permission" title="You can’t use Coach here" body={denyReason(c)} action={<Button size="sm" onPress={() => nav.navigate('Context')}>Switch academy or role</Button>} />;
}

export function NotFound({ what }: { what: string }) {
  const nav = useNavigation<any>();
  return <StateBlock kind="archived" title={`This ${what} is no longer available`} body="It may have been archived, reassigned or deleted after you opened the list. Anything you saved before that is kept." action={<Button size="sm" onPress={() => nav.goBack()}>Go back</Button>} />;
}

/** Page frame: top bar + scrolling body on the themed background. */
export function CoachPage({ children, back, title, sub, right, scroll = true }: { children: ReactNode; back?: boolean; title?: string; sub?: string; right?: ReactNode; scroll?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <CoachTop back={back} title={title} sub={sub} right={right} />
      <Screen scroll={scroll}>{children}</Screen>
    </View>
  );
}

export const accentWhite = raw.paper;
