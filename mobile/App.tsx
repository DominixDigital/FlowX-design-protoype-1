import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { StoreProvider } from 'ditcore/store/store';
import { initPlatform } from './src/platform';
import { Root } from './src/navigation/Root';
import { raw } from './src/theme/tokens';

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
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
