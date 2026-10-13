import { useId, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, Polyline, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import type { DB } from 'ditcore/store/store';
import type { ID } from 'ditcore/data/types';
import { fmtDate } from 'ditcore/store/selectors';
import { computeDitScore, scoreHistory, personalBest, type DimensionResult, type ScoreState } from 'ditcore/score/ditScore';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, raw } from '../theme/tokens';
import { Txt } from './index';

const avg = (ds: DimensionResult[]) => {
  const v = ds.filter((d) => d.value !== null);
  return v.length ? Math.round(v.reduce((n, d) => n + d.value!, 0) / v.length) : 0;
};
const dev = (s: Extract<ScoreState, { kind: 'scored' }>) => avg(s.dims.filter((d) => d.def.key === 'coach_progress' || d.def.key === 'milestones'));
const com = (s: Extract<ScoreState, { kind: 'scored' }>) => avg(s.dims.filter((d) => d.def.key === 'consistency' || d.def.key === 'practice'));

/** Two Dits: Development (left) and Commitment (right) as two translucent discs; the score sits in the overlap. */
export function ScoreDiscs({ state, size = 280 }: { state: ScoreState; size?: number }) {
  const t = useTheme();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  if (state.kind !== 'scored') {
    const msg = state.kind === 'building' ? 'Building' : state.kind === 'paused' ? 'Paused' : 'Off';
    return (
      <View accessible accessibilityLabel={`Dit Score ${msg.toLowerCase()}`} style={{ width: size, height: size * 0.79, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size * 0.79} viewBox="0 0 280 222">
          <Circle cx={116} cy={104} r={62} fill="none" stroke={t.textMuted} strokeDasharray="3 6" />
          <Circle cx={164} cy={104} r={62} fill="none" stroke={t.textMuted} strokeDasharray="3 6" />
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Txt variant="xs" strong muted>Dit Score</Txt>
          <Text style={{ fontFamily: fonts.display, fontSize: size * 0.14, color: t.text }}>{msg}</Text>
        </View>
      </View>
    );
  }
  const d = dev(state); const c = com(state);
  const rl = 52 + d * 0.28; const rr = 52 + c * 0.28;
  const cx = 140; const gap = 34 - (state.value / 100) * 14;
  const dark = t.dark;
  const rightHi = dark ? raw.paper : raw.char[500]; const rightHiA = dark ? 0.42 : 0.22;
  const rightLo = dark ? raw.grey[200] : raw.char[500]; const rightLoA = dark ? 0.16 : 0.1;
  return (
    <View accessible accessibilityLabel={`Dit Score ${state.value}. Development ${d}, commitment ${c}.`} style={{ width: size, height: size * 0.79 }}>
      <Svg width={size} height={size * 0.79} viewBox="0 0 280 222">
        <Defs>
          <RadialGradient id={`${uid}l`} cx="35%" cy="35%"><Stop offset="0" stopColor={t.hl} stopOpacity={0.78} /><Stop offset="1" stopColor={t.hl} stopOpacity={0.42} /></RadialGradient>
          <RadialGradient id={`${uid}r`} cx="65%" cy="35%"><Stop offset="0" stopColor={rightHi} stopOpacity={rightHiA} /><Stop offset="1" stopColor={rightLo} stopOpacity={rightLoA} /></RadialGradient>
        </Defs>
        <Circle cx={cx - gap} cy={104} r={rl} fill={`url(#${uid}l)`} stroke={t.text} strokeOpacity={0.3} />
        <Circle cx={cx + gap} cy={104} r={rr} fill={`url(#${uid}r)`} stroke={t.text} strokeOpacity={0.3} />
        <Circle cx={cx - gap - rl * 0.62} cy={104} r={5} fill={t.text} />
        <Circle cx={cx + gap + rr * 0.62} cy={104} r={5} fill={t.text} />
        <SvgText x={cx - gap - 10} y={212} textAnchor="end" fontSize={12} fontWeight="600" fill={t.textMuted} fontFamily={fonts.bodySemi}>{`Development ${d}`}</SvgText>
        <SvgText x={cx + gap + 10} y={212} textAnchor="start" fontSize={12} fontWeight="600" fill={t.textMuted} fontFamily={fonts.bodySemi}>{`Commitment ${c}`}</SvgText>
      </Svg>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: size * 0.79 * (208 / 222), alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 11, letterSpacing: 0.7, color: t.textMuted, fontFamily: fonts.bodySemi, marginBottom: 2 }}>Dit Score</Text>
        <Text style={{ fontFamily: fonts.display, fontSize: size * 0.27, lineHeight: size * 0.25, color: t.text, fontVariant: ['tabular-nums'] }}>{state.value}</Text>
      </View>
    </View>
  );
}

/** Compact chip for headers and cards. */
export function DitChip({ db, athleteId, onPress }: { db: DB; athleteId: ID; onPress?: () => void }) {
  const t = useTheme();
  const s = computeDitScore(db, athleteId);
  const label = s.kind === 'scored' ? String(s.value) : s.kind === 'building' ? 'Building' : s.kind === 'paused' ? 'Paused' : 'Off';
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={`Dit Score ${label}`} onPress={onPress} hitSlop={8}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 10, borderRadius: 17, backgroundColor: raw.char[500] }}>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.hl }} /><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.hl }} />
      </View>
      <Text style={{ color: raw.grey[50], fontFamily: fonts.bodyBold, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

/** Single-series weekly trend with a personal-best line and tap-to-read points. */
export function ScoreTrend({ db, athleteId, height = 140 }: { db: DB; athleteId: ID; height?: number }) {
  const t = useTheme();
  const h = scoreHistory(db, athleteId);
  const pts = h.filter((p) => p.value !== null) as { date: string; value: number }[];
  const pb = personalBest(db, athleteId);
  const [sel, setSel] = useState<number | null>(null);
  const W = 320; const H = height; const pad = { l: 28, r: 12, t: 14, b: 22 };
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, h.length - 1);
  const y = (v: number) => pad.t + (1 - v / 100) * (H - pad.t - pad.b);
  if (pts.length < 2) return <Txt variant="small" muted>The trend appears once there are two weeks with enough data.</Txt>;
  const line = h.map((p, i) => (p.value === null ? null : `${x(i)},${y(p.value)}`)).filter(Boolean).join(' ');
  return (
    <View style={{ gap: 6 }}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} accessibilityLabel={`Dit Score by week: ${pts.map((p) => `${fmtDate(p.date)} ${p.value}`).join(', ')}`}>
        {[0, 50, 100].map((v) => (
          <G key={v}>
            <Line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke={t.line} strokeWidth={1} />
            <SvgText x={pad.l - 6} y={y(v) + 4} textAnchor="end" fontSize={10} fill={t.textMuted}>{String(v)}</SvgText>
          </G>
        ))}
        {pb !== null && <Line x1={pad.l} x2={W - pad.r} y1={y(pb)} y2={y(pb)} stroke={t.hl} strokeDasharray="4 4" strokeWidth={1.5} />}
        <Polyline points={line} fill="none" stroke={t.hl} strokeWidth={2.5} strokeLinejoin="round" />
        {h.map((p, i) => (
          <G key={p.date}>
            <SvgText x={x(i)} y={H - 6} textAnchor="middle" fontSize={10} fill={t.textMuted}>{fmtDate(p.date)}</SvgText>
            {p.value !== null ? (
              <>
                <Circle cx={x(i)} cy={y(p.value)} r={sel === i ? 6 : 4.5} fill={t.hl} stroke={t.surface} strokeWidth={2} />
                <Circle cx={x(i)} cy={y(p.value)} r={18} fill="transparent" onPress={() => setSel(sel === i ? null : i)} accessibilityLabel={`Week of ${fmtDate(p.date)}: ${p.value}`} />
              </>
            ) : <Circle cx={x(i)} cy={H - pad.b} r={2.5} fill="none" stroke={t.textMuted} />}
          </G>
        ))}
        {sel !== null && h[sel].value !== null && (
          <G>
            <Rect x={Math.min(Math.max(x(sel) - 36, 0), W - 76)} y={y(h[sel].value!) - 36} width={72} height={24} rx={6} fill={raw.char[500]} />
            <SvgText x={Math.min(Math.max(x(sel), 36), W - 40)} y={y(h[sel].value!) - 20} textAnchor="middle" fontSize={11} fontWeight="700" fill={raw.grey[50]}>{`${h[sel].value} · ${fmtDate(h[sel].date)}`}</SvgText>
          </G>
        )}
      </Svg>
      <Txt variant="xs" muted>Weekly, recalculated from the records available at each date. Hollow ticks: not enough data that week.{pb !== null ? ` Dashed: personal best (${pb}).` : ''}</Txt>
    </View>
  );
}

/** Inputs as horizontal bars; trust shown in words. */
export function ScoreBreakdown({ state, audience = 'athlete' }: { state: ScoreState; audience?: 'athlete' | 'parent' | 'coach' }) {
  const t = useTheme();
  if (state.kind !== 'scored' && state.kind !== 'building') return null;
  return (
    <View style={{ gap: 14 }}>
      {state.dims.map((d) => {
        const label = audience === 'athlete' ? d.def.athleteLabel : audience === 'parent' ? d.def.parentLabel : d.def.label;
        const na = d.def.weight === null;
        return (
          <View key={d.def.key} style={{ gap: 4, opacity: na ? 0.65 : 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Txt variant="small" strong>{label}</Txt>
              <Text style={{ fontFamily: fonts.display, fontSize: 22, color: t.text }}>{na ? '—' : d.value ?? '—'}</Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: t.surfaceSunk, overflow: 'hidden' }}>
              {!na && <View style={{ width: `${d.value ?? 0}%`, height: 8, backgroundColor: t.hl }} />}
            </View>
            <Txt variant="xs" muted>
              {na ? `Not measured yet. ${d.def.needs}.` : d.evidence[0]}
              {d.def.trust === 'self_reported' ? ' · self-reported, counts for less' : ''}
              {d.def.trust === 'coach_approved' ? ' · coach-confirmed' : ''}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}
