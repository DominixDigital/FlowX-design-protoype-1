import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { BigShouldersDisplay_900Black, BigShouldersDisplay_700Bold } from '@expo-google-fonts/big-shoulders-display';
import { InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold, InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans';
import { StoreProvider } from 'ditcore/store/store';
import { initPlatform } from './src/platform';
import { Root } from './src/navigation/Root';
import { raw } from './src/theme/tokens';

export default function App() {
  const [ready, setReady] = useState(false);
  const [fontsLoaded] = useFonts({
    BigShouldersDisplay_900Black, BigShouldersDisplay_700Bold,
    InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold, InstrumentSans_700Bold,
  });
  useEffect(() => { initPlatform().finally(() => setReady(true)); }, []);

  if (!ready || !fontsLoaded) {
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
