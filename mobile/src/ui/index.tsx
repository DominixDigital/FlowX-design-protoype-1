import { useEffect, useRef, type ReactNode } from 'react';
import {
  ActivityIndicator, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextProps, type TextStyle, type ViewStyle, type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle, Archive, Ban, BookOpen, CalendarCheck, Check, CircleDashed, CloudOff, Eye, FileClock, FileText, Flag, Info, Lock, RefreshCw, Trophy, Video as VideoIcon, X,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, fs, radius, space } from '../theme/tokens';
import { useStore } from 'ditcore/store/store';
import { fmtDate, initials, type TimelineItem } from 'ditcore/store/selectors';
import { assumptions } from 'ditcore/data/policy';

/* ───────── Text ───────── */

type Variant = 'body' | 'small' | 'xs' | 'h2' | 'h3' | 'num';
const sizes: Record<Variant, { fontSize: number; lineHeight: number }> = {
  body: { fontSize: fs.md, lineHeight: 23 }, small: { fontSize: fs.sm, lineHeight: 20 }, xs: { fontSize: fs.xs, lineHeight: 16 },
  h2: { fontSize: fs.xl, lineHeight: 26 }, h3: { fontSize: fs.lg, lineHeight: 24 }, num: { fontSize: fs['2xl'], lineHeight: 30 },
};

export function Txt({ variant = 'body', strong, muted, faint, color, style, ...rest }: TextProps & { variant?: Variant; strong?: boolean; muted?: boolean; faint?: boolean; color?: string }) {
  const t = useTheme();
  const base: TextStyle = {
    ...sizes[variant],
    color: color ?? (muted ? t.textMuted : faint ? t.textFaint : t.text),
    fontFamily: variant === 'num' ? fonts.display : variant === 'h2' || variant === 'h3' ? fonts.bodyBold : strong ? fonts.bodySemi : fonts.body,
    ...(variant === 'num' ? { fontVariant: ['tabular-nums'] } : null),
  };
  return <Text {...rest} style={[base, style]} />;
}

/** Big Shoulders display type. Mixed case by default; the athlete app and matchday mode use uppercase. */
export function Display({ size = 40, upper, color, style, ...rest }: TextProps & { size?: number; upper?: boolean; color?: string }) {
  const t = useTheme();
  const uc = upper ?? (t.role === 'athlete' || t.mode === 'matchday');
  return <Text {...rest} style={[{ fontFamily: fonts.display, fontSize: size, lineHeight: size * 1.02, color: color ?? t.text, textTransform: uc ? 'uppercase' : 'none', letterSpacing: -0.4 }, style]} />;
}

/* ───────── Layout ───────── */

export function Stack({ gap = 3, style, children }: { gap?: keyof typeof space; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return <View style={[{ gap: space[gap] }, style]}>{children}</View>;
}
export function Row({ gap = 2, between, wrap, center = true, style, children }: { gap?: keyof typeof space; between?: boolean; wrap?: boolean; center?: boolean; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return <View style={[{ flexDirection: 'row', gap: space[gap], alignItems: center ? 'center' : 'flex-start', justifyContent: between ? 'space-between' : 'flex-start', flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{children}</View>;
}

/** Scrollable screen with safe-area padding and the themed background. */
export function Screen({ children, scroll = true, bottomPad = 24, style, refresh }: { children: ReactNode; scroll?: boolean; bottomPad?: number; style?: StyleProp<ViewStyle>; refresh?: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const pad = { paddingHorizontal: space[4], paddingTop: space[2], paddingBottom: bottomPad + insets.bottom, gap: space[4] };
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: t.bg }, pad, style]}>{children}</View>;
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={[pad, style]} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic">{children}</ScrollView>
      {refresh}
    </View>
  );
}

export function Card({ children, style, onPress, flush, accent, label }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; flush?: boolean; accent?: boolean; label?: string }) {
  const t = useTheme();
  const s: ViewStyle = { backgroundColor: t.surface, borderColor: accent ? t.hl : t.line, borderWidth: 1, borderRadius: radius.md, padding: flush ? 0 : space[4], overflow: 'hidden' };
  if (onPress) return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [s, pressed && { opacity: 0.85 }, style]}>{children}</Pressable>;
  return <View style={[s, style]}>{children}</View>;
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.line }} />;
}

/** Rows inside a flush Card, separated by hairlines. */
export function ListRow({ children, onPress, last, style, label }: { children: ReactNode; onPress?: () => void; last?: boolean; style?: StyleProp<ViewStyle>; label?: string }) {
  const t = useTheme();
  const s: ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[3], paddingHorizontal: space[4], minHeight: 52, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: t.line };
  if (onPress) return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [s, pressed && { backgroundColor: t.surface2 }, style]}>{children}</Pressable>;
  return <View style={[s, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return <Row between><Txt variant="small" strong muted>{children}</Txt>{right}</Row>;
}

/* ───────── Buttons ───────── */

type BtnVariant = 'primary' | 'highlight' | 'ghost' | 'danger' | 'default';
export function Button({ children, onPress, variant = 'default', size = 'md', block, pending, disabled, icon, label, style }: {
  children?: ReactNode; onPress?: () => void; variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; block?: boolean; pending?: boolean; disabled?: boolean; icon?: ReactNode; label?: string; style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const bg = variant === 'primary' ? t.accent : variant === 'highlight' ? t.hl : variant === 'danger' ? t.err : 'transparent';
  const fg = variant === 'primary' ? t.accentInk : variant === 'highlight' ? t.hlInk : variant === 'danger' ? (t.dark ? '#111' : '#fff') : t.text;
  const bd = variant === 'ghost' ? 'transparent' : variant === 'default' ? t.lineStrong : bg;
  const h = size === 'sm' ? 36 : size === 'lg' ? 56 : 48;
  const off = disabled || pending;
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!off, busy: !!pending }}
      onPress={() => { if (!off) onPress?.(); }}
      style={({ pressed }) => [{ minHeight: h, paddingHorizontal: size === 'sm' ? 12 : 18, borderRadius: radius.sm, backgroundColor: bg, borderWidth: 1.5, borderColor: bd, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: block ? 'stretch' : 'flex-start', opacity: off ? 0.5 : pressed ? 0.85 : 1 }, style]}
    >
      {pending ? <ActivityIndicator size="small" color={fg} /> : icon}
      {children != null && <Text style={{ color: fg, fontFamily: fonts.bodySemi, fontSize: size === 'sm' ? fs.sm : fs.md }}>{children}</Text>}
    </Pressable>
  );
}

/** Quick-reply chip, used in the companion and on score cards. */
export function Chip({ children, onPress, selected, icon }: { children: ReactNode; onPress?: () => void; selected?: boolean; icon?: ReactNode }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ minHeight: 44, paddingHorizontal: 14, borderRadius: radius.sm, borderWidth: 1, borderColor: selected ? t.hl : t.line, backgroundColor: selected ? t.hlSoft : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
      {icon}
      <Text style={{ color: selected && !t.dark ? t.hlInk : t.text, fontFamily: fonts.bodySemi, fontSize: fs.sm }}>{children}</Text>
    </Pressable>
  );
}

/* ───────── Status ───────── */

type Tone = 'ok' | 'warn' | 'err' | 'info' | 'outline' | 'lime' | '';
const STATUS: Record<string, { tone: Tone; icon: 'check' | 'dash' | 'ban' | 'archive' | 'sync' | 'cloud' | 'clock' | 'x' | 'warn' | 'lock' | 'eye' | 'trophy' | 'none'; label: string }> = {
  draft: { tone: '', icon: 'dash', label: 'Draft' }, approved: { tone: 'info', icon: 'check', label: 'Approved' }, published: { tone: 'ok', icon: 'check', label: 'Published' },
  corrected: { tone: 'warn', icon: 'clock', label: 'Corrected' }, withdrawn: { tone: 'err', icon: 'ban', label: 'Withdrawn' }, archived: { tone: 'outline', icon: 'archive', label: 'Archived' },
  inactive: { tone: 'outline', icon: 'archive', label: 'Inactive' }, invited: { tone: 'info', icon: 'dash', label: 'Invited' }, active: { tone: 'ok', icon: 'check', label: 'Active' },
  duplicate_suspected: { tone: 'warn', icon: 'warn', label: 'Possible duplicate' },
  local: { tone: '', icon: 'dash', label: 'On this device' }, queued: { tone: 'warn', icon: 'cloud', label: 'Queued' }, sending: { tone: 'info', icon: 'sync', label: 'Sending' },
  synced: { tone: 'ok', icon: 'check', label: 'Synced' }, failed: { tone: 'err', icon: 'x', label: 'Failed' }, conflict: { tone: 'err', icon: 'warn', label: 'Conflict' },
  open: { tone: 'info', icon: 'dash', label: 'Open' }, in_progress: { tone: 'warn', icon: 'sync', label: 'In progress' }, blocked: { tone: 'err', icon: 'ban', label: 'Blocked' },
  completed: { tone: 'ok', icon: 'check', label: 'Completed' }, cancelled: { tone: 'outline', icon: 'x', label: 'Cancelled' },
  pending: { tone: 'info', icon: 'dash', label: 'Pending' }, submitted: { tone: 'warn', icon: 'clock', label: 'Awaiting approval' },
  uploading: { tone: 'info', icon: 'sync', label: 'Uploading' }, uploaded: { tone: 'ok', icon: 'check', label: 'Uploaded' }, processing: { tone: 'info', icon: 'sync', label: 'Processing' },
  ready: { tone: 'ok', icon: 'check', label: 'Ready' }, shared: { tone: 'lime', icon: 'eye', label: 'Shared' }, private: { tone: 'outline', icon: 'lock', label: 'Coaches only' },
  achieved: { tone: 'lime', icon: 'trophy', label: 'Achieved' }, reopened: { tone: 'warn', icon: 'sync', label: 'Reopened' }, closed: { tone: 'outline', icon: 'archive', label: 'Closed' },
  scheduled: { tone: 'outline', icon: 'dash', label: 'Scheduled' },
};

function Glyph({ k, size, color }: { k: string; size: number; color: string }) {
  const p = { size, color, strokeWidth: 2.2 };
  switch (k) {
    case 'check': return <Check {...p} />; case 'dash': return <CircleDashed {...p} />; case 'ban': return <Ban {...p} />; case 'archive': return <Archive {...p} />;
    case 'sync': return <RefreshCw {...p} />; case 'cloud': return <CloudOff {...p} />; case 'clock': return <FileClock {...p} />; case 'x': return <X {...p} />;
    case 'warn': return <AlertTriangle {...p} />; case 'lock': return <Lock {...p} />; case 'eye': return <Eye {...p} />; case 'trophy': return <Trophy {...p} />;
    default: return null;
  }
}

/** Always a shape glyph plus text: colour is never the only signal. */
export function StatusBadge({ status, label, tone: toneOverride }: { status?: string; label?: string; tone?: Tone }) {
  const t = useTheme();
  const s = (status && STATUS[status]) || { tone: '' as Tone, icon: 'none' as const, label: status ?? '' };
  const tone = toneOverride ?? s.tone;
  const c = { ok: [t.okBg, t.ok], warn: [t.warnBg, t.warn], err: [t.errBg, t.err], info: [t.infoBg, t.info], lime: [t.dark ? 'rgba(190,229,1,0.14)' : '#eef6dc', t.dark ? '#bee501' : '#546b00'], outline: ['transparent', t.textMuted], '': [t.surfaceSunk, t.text] }[tone];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, height: 24, borderRadius: radius.xs, backgroundColor: c[0], borderWidth: tone === 'outline' ? 1 : 0, borderColor: t.line }}>
      <Glyph k={s.icon} size={12} color={c[1]} />
      <Text style={{ color: c[1], fontFamily: fonts.bodySemi, fontSize: fs.xs }}>{label ?? s.label}</Text>
    </View>
  );
}

export function Avatar({ name, size = 36, muted }: { name: string; size?: number; muted?: boolean }) {
  const t = useTheme();
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: muted ? t.surfaceSunk : t.ramp[700], alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: muted ? t.textMuted : '#fff', fontFamily: fonts.bodyBold, fontSize: size * 0.36 }}>{initials(name)}</Text>
    </View>
  );
}

export function Banner({ tone = 'info', children, action }: { tone?: 'info' | 'warn' | 'err' | 'ok'; children: ReactNode; action?: ReactNode }) {
  const t = useTheme();
  const [bg, fg] = { info: [t.infoBg, t.info], warn: [t.warnBg, t.warn], err: [t.errBg, t.err], ok: [t.okBg, t.ok] }[tone];
  const Ic = tone === 'info' ? Info : tone === 'ok' ? Check : AlertTriangle;
  return (
    <View accessibilityRole={tone === 'err' ? 'alert' : undefined} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: space[3], borderRadius: radius.sm, backgroundColor: bg }}>
      <Ic size={16} color={fg} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>{typeof children === 'string' ? <Txt variant="small" color={t.text}>{children}</Txt> : children}</View>
      {action}
    </View>
  );
}

export function StateBlock({ kind, title, body, action }: { kind: 'empty' | 'error' | 'permission' | 'archived' | 'offline' | 'withdrawn' | 'loading'; title: string; body?: ReactNode; action?: ReactNode }) {
  const t = useTheme();
  const c = kind === 'error' ? t.err : kind === 'permission' || kind === 'withdrawn' ? t.warn : kind === 'offline' ? t.info : t.textMuted;
  const Ic = kind === 'error' ? AlertTriangle : kind === 'permission' ? Lock : kind === 'offline' ? CloudOff : kind === 'withdrawn' ? Ban : kind === 'archived' ? Archive : CircleDashed;
  return (
    <View accessibilityRole={kind === 'error' ? 'alert' : undefined} style={{ alignItems: 'center', gap: space[2], padding: space[6], borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: t.line }}>
      {kind === 'loading' ? <ActivityIndicator color={t.textMuted} /> : <Ic size={22} color={c} />}
      <Txt variant="h3" style={{ textAlign: 'center' }}>{title}</Txt>
      {body != null && (typeof body === 'string' ? <Txt variant="small" muted style={{ textAlign: 'center' }}>{body}</Txt> : body)}
      {action}
    </View>
  );
}

/* ───────── Forms ───────── */

export function Field({ label, hint, error, optional, children }: { label: string; hint?: string; error?: string; optional?: boolean; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="small" strong>{label}{optional ? <Txt variant="small" muted> (optional)</Txt> : null}</Txt>
      {children}
      {hint && !error ? <Txt variant="xs" muted>{hint}</Txt> : null}
      {error ? <Row gap={1}><AlertTriangle size={12} color={t.err} /><Txt variant="xs" color={t.err}>{error}</Txt></Row> : null}
    </View>
  );
}

export function Input(props: TextInputProps & { multiline?: boolean }) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.textFaint}
      {...props}
      style={[{ minHeight: props.multiline ? 96 : 48, paddingHorizontal: 14, paddingVertical: 12, borderRadius: radius.sm, borderWidth: 1.5, borderColor: t.line, backgroundColor: t.surface, color: t.text, fontFamily: fonts.body, fontSize: fs.md, textAlignVertical: props.multiline ? 'top' : 'center' }, props.style]}
    />
  );
}

/* ───────── Overlays ───────── */

/** Bottom sheet. Tapping the scrim or hardware back closes it. */
export function Sheet({ visible, onClose, children, dark }: { visible: boolean; onClose: () => void; children: ReactNode; dark?: boolean }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable accessibilityLabel="Close" style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={onClose} />
      <View style={{ backgroundColor: dark ? '#1a1819' : t.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: insets.bottom + space[4], maxHeight: '88%' }}>
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.line, marginTop: 10 }} />
        {children}
      </View>
    </Modal>
  );
}

/** Store toasts, shown above the tab bar. Mount once per role navigator. */
export function Toasts() {
  const { toasts, dismissToast } = useStore();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  if (!toasts.length) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 12, right: 12, bottom: insets.bottom + 76, gap: 8 }}>
      {toasts.slice(-2).map((x) => (
        <Pressable key={x.id} onPress={() => dismissToast(x.id)} accessibilityRole="alert" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.sm, backgroundColor: '#1a1819', borderLeftWidth: 4, borderLeftColor: x.tone === 'ok' ? '#bee501' : x.tone === 'err' ? '#ff8a8a' : x.tone === 'warn' ? '#f2c14e' : '#6abcc3' }}>
          <Text style={{ flex: 1, color: '#f7f7f7', fontFamily: fonts.body, fontSize: fs.sm }}>{x.text}</Text>
          {x.action ? <Text onPress={() => { x.action!.run(); dismissToast(x.id); }} style={{ color: t.hl, fontFamily: fonts.bodyBold, fontSize: fs.sm }}>{x.action.label}</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}

/** Pulsing dot used while something loads. */
export function Pulse({ size = 8, color }: { size?: number; color?: string }) {
  const t = useTheme();
  const v = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: 500, useNativeDriver: true }), Animated.timing(v, { toValue: 0.3, duration: 500, useNativeDriver: true })]));
    a.start();
    return () => a.stop();
  }, [v]);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color ?? t.hl, opacity: v }} />;
}

/* ───────── Timeline ───────── */

const TL_ICON = { observation: BookOpen, milestone: Trophy, reassessment: Flag, video: VideoIcon, area: Flag, report: FileText, session: CalendarCheck } as const;

export function Timeline({ items, empty }: { items: TimelineItem[]; empty?: string }) {
  const t = useTheme();
  if (!items.length) return <StateBlock kind="empty" title={empty ?? 'Nothing recorded yet'} />;
  return (
    <View style={{ gap: 0 }}>
      {items.map((i, n) => {
        const Ic = TL_ICON[i.kind];
        return (
          <View key={`${i.kind}-${i.id}`} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: t.surfaceSunk, alignItems: 'center', justifyContent: 'center' }}><Ic size={12} color={t.text} /></View>
              {n < items.length - 1 && <View style={{ flex: 1, width: 1, backgroundColor: t.line, marginVertical: 2 }} />}
            </View>
            <View style={{ flex: 1, paddingBottom: 16 }}>
              <Txt variant="xs" muted>{fmtDate(i.date, { day: 'numeric', month: 'short', year: 'numeric' })}</Txt>
              <Txt variant="small" strong>{i.title}</Txt>
              {i.detail ? <Txt variant="small" muted style={{ marginTop: 2 }}>{i.detail}</Txt> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Destructive-action guard: centred modal with a clear cancel. */
export function ConfirmDialog({ open, title, body, confirmLabel, tone = 'primary', onConfirm, onCancel, children }: {
  open: boolean; title: string; body?: ReactNode; confirmLabel: string; tone?: 'primary' | 'danger'; onConfirm: () => void; onCancel: () => void; children?: ReactNode;
}) {
  const t = useTheme();
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: space[5] }}>
        <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 420, backgroundColor: t.surface, borderRadius: radius.lg, padding: space[5], gap: space[3] }}>
          <Txt variant="h2" accessibilityRole="header">{title}</Txt>
          {body != null ? (typeof body === 'string' ? <Txt variant="small" muted>{body}</Txt> : body) : null}
          {children}
          <Row gap={2} style={{ justifyContent: 'flex-end' }}>
            <Button onPress={onCancel}>Cancel</Button>
            <Button variant={tone === 'danger' ? 'danger' : 'primary'} onPress={onConfirm}>{confirmLabel}</Button>
          </Row>
        </View>
      </View>
    </Modal>
  );
}

/** Two-state attendance switch: present / absent. */
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T | null; options: { v: T; node: ReactNode; label: string; tone?: 'ok' | 'err' }[]; onChange: (v: T) => void; label: string }) {
  const t = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', borderRadius: radius.sm, borderWidth: 1, borderColor: t.line, overflow: 'hidden' }}>
      {options.map((o, i) => {
        const on = value === o.v;
        return (
          <Pressable key={o.v} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={o.label} onPress={() => onChange(o.v)}
            style={{ width: 48, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? (o.tone === 'err' ? t.errBg : t.okBg) : 'transparent', borderLeftWidth: i ? 1 : 0, borderLeftColor: t.line }}>
            {o.node}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Pick one option from a short list (stands in for <select> and segmented controls). */
export function ChoiceGroup<T extends string>({ value, onChange, options, none, label }: { value: T | ''; onChange: (v: T | '') => void; options: { v: T; label: string }[]; none?: string; label?: string }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {none != null ? <Chip selected={value === ''} onPress={() => onChange('')}>{none}</Chip> : null}
      {options.map((op) => <Chip key={op.v} selected={value === op.v} onPress={() => onChange(op.v)}>{op.label}</Chip>)}
    </View>
  );
}

/** An unresolved product rule shown honestly where it applies. */
export function AssumptionNote({ code }: { code: string }) {
  const t = useTheme();
  const a = assumptions[code];
  if (!a) return null;
  return <Txt variant="xs" color={t.warn}><Txt variant="xs" strong color={t.warn}>Assumption {a.code}</Txt> (“{a.marker}”): {a.assumption}</Txt>;
}
