import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Check, Smartphone } from 'lucide-react-native';
import { useStore } from 'ditcore/store/store';
import { TODAY } from 'ditcore/data/fixtures';
import { daysBetween } from 'ditcore/store/selectors';
import { useTheme } from '../../theme/ThemeProvider';
import { Row, StatusBadge, Txt } from '../../ui';
import { TopBar } from '../../ui/TopBar';
import { DitChip } from '../../ui/score';
import { useAthlete } from './hooks';

/** Header for athlete screens: greeting or back, parent-device badge, Dit Score chip. */
export function AthleteTop({ back, title }: { back?: boolean; title?: string }) {
  const { db } = useStore();
  const { a, first, viaParent } = useAthlete();
  const nav = useNavigation<any>();
  return (
    <TopBar
      back={back}
      title={title ?? (back ? undefined : `Hi, ${first}`)}
      right={<Row gap={2}>{viaParent ? <View accessibilityLabel="Signed in on a parent’s device"><StatusBadge tone="outline" label="Parent’s device" /></View> : null}<DitChip db={db} athleteId={a.id} onPress={() => nav.navigate('Tabs', { screen: 'Score' })} /></Row>}
    />
  );
}

/** Practice this week vs the assigned frequency: athlete-reported counts only. */
export function WeekDots({ goalId, frequency }: { goalId: string; frequency: string }) {
  const { db } = useStore();
  const t = useTheme();
  const target = frequency.startsWith('3') ? 3 : frequency.startsWith('2') ? 2 : frequency.startsWith('Once') ? 1 : 4;
  const done = db.practiceLogs.filter((p) => p.goalId === goalId && daysBetween(p.date, TODAY) < 7 && daysBetween(p.date, TODAY) >= 0).length;
  return (
    <Row gap={2} >
      <View accessible accessibilityLabel={`${done} of ${target} practices logged this week`} style={{ flexDirection: 'row', gap: 8 }}>
        {Array.from({ length: Math.max(target, done) }, (_, i) => (
          <View key={i} style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: i < done ? t.hl : t.line, backgroundColor: i < done ? t.hl : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            {i < done ? <Check size={14} color={t.hlInk} /> : null}
          </View>
        ))}
      </View>
      <Txt variant="small">{done}/{target} this week</Txt>
    </Row>
  );
}

export const ParentDeviceIcon = Smartphone;
