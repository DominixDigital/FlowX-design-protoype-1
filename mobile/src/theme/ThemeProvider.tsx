import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { makeTheme, type Mode, type Role, type Theme } from './tokens';

const Ctx = createContext<Theme>(makeTheme('coach', 'chalk'));
export const useTheme = () => useContext(Ctx);

/** Sets role and/or mode for a subtree, like data-role / data-theme on the web. Omitted props inherit. */
export function ThemeScope({ role, mode, children, style }: { role?: Role; mode?: Mode; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const parent = useTheme();
  const theme = useMemo(() => makeTheme(role ?? parent.role, mode ?? parent.mode), [role, mode, parent.role, parent.mode]);
  return (
    <Ctx.Provider value={theme}>
      <View style={[{ backgroundColor: theme.bg }, style]}>{children}</View>
    </Ctx.Provider>
  );
}

/** Same as ThemeScope without the wrapping View (for providing a theme at the root or a navigator). */
export function ThemeProvider({ role, mode, children }: { role: Role; mode: Mode; children: ReactNode }) {
  const theme = useMemo(() => makeTheme(role, mode), [role, mode]);
  return <Ctx.Provider value={theme}>{children}</Ctx.Provider>;
}
