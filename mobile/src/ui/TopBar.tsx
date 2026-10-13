import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { space } from '../theme/tokens';
import { Txt } from './index';
import { ProtoButton } from './ProtoSheet';

/** Top bar used by every screen: back button or title on the left, anything (score chip, actions) on the right. */
export function TopBar({ title, back, right, sub }: { title?: string; back?: boolean; right?: ReactNode; sub?: string }) {
  const t = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: t.bg, paddingTop: insets.top + space[2], paddingHorizontal: space[4], paddingBottom: space[2], flexDirection: 'row', alignItems: 'center', gap: space[3], minHeight: 56 + insets.top }}>
      {back ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} onPress={() => nav.goBack()} style={{ width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={26} color={t.text} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        {title ? <Txt variant="h3" numberOfLines={1} accessibilityRole="header">{title}</Txt> : null}
        {sub ? <Txt variant="xs" muted numberOfLines={1}>{sub}</Txt> : null}
      </View>
      {right}
      <ProtoButton />
    </View>
  );
}
