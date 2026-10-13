import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Platform, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { StoreProvider } from 'ditcore/store/store';
import { initPlatform } from './src/platform';
import { Root } from './src/navigation/Root';
import { fonts, PHONE_MAX, raw } from './src/theme/tokens';

export default function App() {
  const [ready, setReady] = useState(false);
  // Fonts ship from ./assets/fonts (OFL). Served from a node_modules path they 404 on some static hosts.
  const [fontsLoaded, fontError] = useFonts({
    BigShouldersDisplay_900Black: require('./assets/fonts/BigShouldersDisplay_900Black.ttf'),
    BigShouldersDisplay_700Bold: require('./assets/fonts/BigShouldersDisplay_700Bold.ttf'),
    InstrumentSans_400Regular: require('./assets/fonts/InstrumentSans_400Regular.ttf'),
    InstrumentSans_500Medium: require('./assets/fonts/InstrumentSans_500Medium.ttf'),
    InstrumentSans_600SemiBold: require('./assets/fonts/InstrumentSans_600SemiBold.ttf'),
    InstrumentSans_700Bold: require('./assets/fonts/InstrumentSans_700Bold.ttf'),
  });
  // Never wait forever: storage or fonts that fail or stall must not leave the user on a spinner.
  const [giveUp, setGiveUp] = useState(false);
  useEffect(() => {
    initPlatform().catch(() => {}).finally(() => setReady(true));
    const timer = setTimeout(() => setGiveUp(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!giveUp && (!ready || !(fontsLoaded || fontError))) {
    return <View style={{ flex: 1, backgroundColor: raw.char[700], alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={raw.grey[500]} /></View>;
  }
  const app = (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
  return <PhoneFrame>{app}</PhoneFrame>;
}

/** On a wide browser window, show the app as a phone-width column instead of stretching it across the screen. */
function PhoneFrame({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web' || width <= PHONE_MAX + 80) return <>{children}</>;
  return (
    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', backgroundColor: raw.char[800] }}>
      <View style={{ width: PHONE_MAX, flexShrink: 0, height: '100%', overflow: 'hidden', borderLeftWidth: 1, borderRightWidth: 1, borderColor: raw.char[500] }}>{children}</View>
      {width > PHONE_MAX + 420 ? (
        <View style={{ position: 'absolute', left: 32, bottom: 32, maxWidth: (width - PHONE_MAX) / 2 - 64 }}>
          <Text style={{ color: raw.grey[600], fontFamily: fonts.bodySemi, fontSize: 13 }}>ditdit · native app preview</Text>
          <Text style={{ color: raw.grey[700], fontFamily: fonts.body, fontSize: 12, marginTop: 4 }}>The Expo app running in a browser at phone width. Open it on a phone with Expo Go for the real feel.</Text>
        </View>
      ) : null}
    </View>
  );
}
