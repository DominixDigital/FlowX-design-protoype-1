import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Launcher } from '../screens/Launcher';
import { AthleteNav } from './AthleteNav';
import { CoachNav } from './CoachNav';
import { navRef } from './ref';
import { raw } from '../theme/tokens';

const Stack = createNativeStackNavigator();

export function Root() {
  return (
    <NavigationContainer ref={navRef} theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: raw.char[700] } }}>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Launcher" screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Launcher" component={Launcher} />
        <Stack.Screen name="Athlete" component={AthleteNav} />
        <Stack.Screen name="Coach" component={CoachNav} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
