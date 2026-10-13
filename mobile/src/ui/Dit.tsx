import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { Circle, Rect, Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, raw } from '../theme/tokens';

export type DitState = 'idle' | 'listening' | 'thinking' | 'explaining' | 'celebrating' | 'uncertain' | 'insight';
export type DitForm = 'compact' | 'face' | 'immersive';

/**
 * The ditdit companion (concept C: hybrid). Two dots in a squircle face; the states are carried by motion
 * of the whole mark (pulse, sway, hop, tilt) plus the insight notch. Honours reduced motion via `still`.
 */
export function DitAvatar({ state = 'idle', form = 'face', size = 40, still = false, label }: { state?: DitState; form?: DitForm; size?: number; still?: boolean; label?: string }) {
  const t = useTheme();
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    v.setValue(0);
    if (still || state === 'idle' || state === 'insight') return;
    const dur = state === 'listening' ? 450 : state === 'thinking' ? 700 : state === 'celebrating' ? 380 : 900;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]), { iterations: state === 'celebrating' ? 4 : -1 });
    loop.start();
    return () => loop.stop();
  }, [state, still, v]);

  const transform =
    state === 'listening' ? [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }]
    : state === 'thinking' ? [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.04, size * 0.04] }) }]
    : state === 'celebrating' ? [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.12] }) }]
    : state === 'uncertain' ? [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] }) }]
    : state === 'explaining' ? [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }]
    : [];

  const ink = t.dark || form !== 'face' ? t.hl : t.hl;
  const eyeY = state === 'uncertain' ? 17.5 : 19;
  const happy = state === 'celebrating';
  return (
    <Animated.View accessible={!!label} accessibilityRole={label ? 'image' : undefined} accessibilityLabel={label} importantForAccessibility={label ? 'yes' : 'no-hide-descendants'} style={{ width: size, height: size, transform }}>
      <Svg width={size} height={size} viewBox="0 0 48 48" style={{ overflow: 'visible' }}>
        {form === 'immersive' ? (
          <>
            <Circle cx={19} cy={24} r={15} fill={ink} fillOpacity={0.45} stroke={ink} strokeOpacity={0.5} />
            <Circle cx={29} cy={24} r={15} fill={raw.grey[200]} fillOpacity={0.16} stroke={raw.grey[200]} strokeOpacity={0.4} />
          </>
        ) : form === 'face' ? (
          <Rect x={3} y={3} width={42} height={42} rx={15} fill={raw.char[500]} stroke={ink} strokeOpacity={0.4} strokeWidth={1.2} />
        ) : null}
        {happy ? (
          <Path d="M13 25 q4.5 -7 9 0 M26 25 q4.5 -7 9 0" stroke={ink} strokeWidth={3} strokeLinecap="round" fill="none" />
        ) : (
          <>
            <Rect x={13} y={eyeY} width={state === 'uncertain' ? 6 : 9} height={state === 'uncertain' ? 6 : 9} rx={4.5} fill={ink} />
            <Rect x={26} y={state === 'uncertain' ? 17 : 19} width={state === 'explaining' ? 14 : 9} height={9} rx={4.5} fill={ink} />
          </>
        )}
        {state === 'insight' && <Circle cx={41} cy={7} r={4} fill={ink} />}
      </Svg>
    </Animated.View>
  );
}

/** "dıtdıt": the tittles of the two i's are the brand's two dots (Morse "dit dit"). */
export function Wordmark({ size = 30, color }: { size?: number; color?: string }) {
  const t = useTheme();
  const c = color ?? t.text;
  const dot = Math.max(5, size * 0.17);
  const I = () => (
    <View accessibilityElementsHidden style={{ alignItems: 'center' }}>
      <Text style={{ fontFamily: fonts.display, fontSize: size, lineHeight: size, color: c }}>ı</Text>
      <View style={{ position: 'absolute', top: size * 0.06, width: dot, height: dot, borderRadius: dot / 2, backgroundColor: t.hl }} />
    </View>
  );
  const L = ({ ch }: { ch: string }) => <Text style={{ fontFamily: fonts.display, fontSize: size, lineHeight: size, color: c }}>{ch}</Text>;
  return (
    <View accessible accessibilityRole="header" accessibilityLabel="ditdit" style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      <L ch="d" /><I /><L ch="t" /><L ch="d" /><I /><L ch="t" />
    </View>
  );
}
