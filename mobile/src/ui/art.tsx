import { useId, type ReactElement } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { AlertTriangle, Ban, Clapperboard, CloudOff, Play, RefreshCw } from 'lucide-react-native';
import type { Video } from 'ditcore/data/types';
import { fmtTime } from 'ditcore/store/selectors';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, raw } from '../theme/tokens';

/** The ditdit motif: a pitch strip in perspective with a ball's flight line. Stands in for footage in the prototype. */
export function PitchArt({ tone = 'forest', flight = true }: { tone?: 'forest' | 'court' | 'ink'; flight?: boolean }) {
  const t = useTheme();
  const gid = `pa${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [a, b] = { forest: [raw.char[400], raw.char[700]], court: [raw.taupe[700], raw.char[700]], ink: [raw.char[500], raw.char[800]] }[tone];
  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute' }}>
      <Defs><LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={a} /><Stop offset="1" stopColor={b} /></LinearGradient></Defs>
      <Rect width={400} height={225} fill={`url(#${gid})`} />
      <Path d="M170 40 L230 40 L300 225 L100 225 Z" fill="rgba(255,255,255,0.06)" />
      <Path d="M161 64 L239 64" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
      <Path d="M118 190 L282 190" stroke="rgba(255,255,255,0.45)" strokeWidth={2} />
      <Path d="M142 190 L150 225 M258 190 L250 225" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
      <Path d="M196 44 V64 M200 44 V64 M204 44 V64" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />
      {flight && (<><Path d="M60 30 C 150 10, 230 60, 205 150" stroke={t.hl} strokeWidth={2} fill="none" strokeDasharray="2 6" strokeLinecap="round" /><Circle cx={205} cy={150} r={5} fill={t.hl} /></>)}
    </Svg>
  );
}

/** Video reference card. Upload, processing and publication are separate states. */
export function Clip({ video, onPlay, compact }: { video: Video; onPlay?: () => void; compact?: boolean }) {
  const t = useTheme();
  const white = '#fff';
  let overlay: { icon: ReactElement; text: string; progress?: number } | null = null;
  if (video.share === 'withdrawn') overlay = { icon: <Ban size={20} color={white} />, text: 'Withdrawn by the coach' };
  else if (video.upload === 'local' || video.upload === 'queued') overlay = { icon: <CloudOff size={20} color={white} />, text: 'Saved on this device · waiting to upload' };
  else if (video.upload === 'uploading') overlay = { icon: <RefreshCw size={20} color={white} />, text: `Uploading ${video.progress}%`, progress: video.progress };
  else if (video.upload === 'failed') overlay = { icon: <AlertTriangle size={20} color={white} />, text: 'Upload failed · clip kept on device' };
  else if (video.processing === 'processing' || video.processing === 'pending') overlay = { icon: <Clapperboard size={20} color={white} />, text: 'Processing on the server' };
  else if (video.processing === 'failed') overlay = { icon: <AlertTriangle size={20} color={white} />, text: 'Processing failed · re-upload needed' };
  return (
    <View style={{ aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden', backgroundColor: raw.char[700] }} accessibilityLabel={`${video.title}, ${fmtTime(video.duration)}`}>
      <PitchArt tone={video.tint === '#0f2a57' ? 'court' : video.tint === '#26362e' ? 'ink' : 'forest'} />
      {overlay ? (
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.45)', padding: 16 }}>
          {overlay.icon}
          <Text style={{ color: white, fontFamily: fonts.bodySemi, fontSize: 13, textAlign: 'center' }}>{overlay.text}</Text>
          {overlay.progress != null && <View style={{ width: '70%', height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,.2)' }}><View style={{ width: `${overlay.progress}%`, height: 4, borderRadius: 2, backgroundColor: t.hl }} /></View>}
        </View>
      ) : onPlay ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Play ${video.title}`} onPress={onPlay} style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,19,15,.7)' }}><Play size={22} color={white} fill={white} /></View>
        </Pressable>
      ) : null}
      {!compact && (
        <View style={{ position: 'absolute', left: 12, right: 12, bottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Text style={{ color: white, fontFamily: fonts.bodySemi, fontSize: 13, flex: 1 }} numberOfLines={1}>{video.title}</Text>
          <Text style={{ color: white, fontFamily: fonts.display, fontSize: 18 }}>{fmtTime(video.duration)}</Text>
        </View>
      )}
    </View>
  );
}
