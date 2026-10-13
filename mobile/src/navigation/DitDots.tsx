import { View } from 'react-native';

/** The brand's two dots, used as the Dit Score tab icon. */
export function DitDots({ color }: { color: string }) {
  return (
    <View accessibilityElementsHidden style={{ flexDirection: 'row', gap: 4, height: 22, alignItems: 'center' }}>
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color }} />
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color }} />
    </View>
  );
}
