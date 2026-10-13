import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Crosshair, Dumbbell, MessageCircle, TrendingUp } from 'lucide-react-native';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { Toasts } from '../ui';
import { CompanionCanvas, CompanionIntro, CompanionProvider, DitFab } from '../companion/Companion';
import { Home } from '../screens/athlete/Home';
import { Practice } from '../screens/athlete/Practice';
import { FeedbackDetail, FeedbackList } from '../screens/athlete/Feedback';
import { Progress } from '../screens/athlete/Progress';
import { Compare, ScoreScreen } from '../screens/athlete/Score';
import { Session } from '../screens/athlete/Session';
import { Access } from '../screens/athlete/Access';
import { DitDots } from './DitDots';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  const t = useTheme();
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: t.text, tabBarInactiveTintColor: t.textMuted,
      tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.line },
      tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 11 },
    }}>
      <Tab.Screen name="Home" component={Home} options={{ tabBarIcon: ({ color }) => <Crosshair size={22} color={color} /> }} />
      <Tab.Screen name="Practice" component={Practice} options={{ tabBarIcon: ({ color }) => <Dumbbell size={22} color={color} /> }} />
      <Tab.Screen name="Score" component={ScoreScreen} options={{ title: 'Dit Score', tabBarIcon: ({ color }) => <DitDots color={color} /> }} />
      <Tab.Screen name="Feedback" component={FeedbackList} options={{ tabBarIcon: ({ color }) => <MessageCircle size={22} color={color} /> }} />
      <Tab.Screen name="Progress" component={Progress} options={{ tabBarIcon: ({ color }) => <TrendingUp size={22} color={color} /> }} />
    </Tab.Navigator>
  );
}

/** Athlete app: grey identity on light chalk surfaces, floodlit charcoal for the score and dit. */
export function AthleteNav() {
  return (
    <ThemeProvider role="athlete" mode="chalk">
      <CompanionProvider>
        <View style={{ flex: 1 }}>
          <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="Tabs" component={Tabs} />
            <Stack.Screen name="Session" component={Session} />
            <Stack.Screen name="FeedbackDetail" component={FeedbackDetail} />
            <Stack.Screen name="Compare" component={Compare} />
            <Stack.Screen name="Access" component={Access} />
          </Stack.Navigator>
          <DitFab />
          <Toasts />
          <CompanionCanvas />
          <CompanionIntro surface="athlete" />
        </View>
      </CompanionProvider>
    </ThemeProvider>
  );
}
