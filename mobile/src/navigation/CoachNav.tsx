import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CalendarDays, Home, ListChecks, Users } from 'lucide-react-native';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { Toasts } from '../ui';
import { CompanionCanvas, CompanionIntro, CompanionProvider, DitFab } from '../companion/Companion';
import { Today } from '../screens/coach/Today';
import { SessionDetail, Sessions, WrapUp } from '../screens/coach/Sessions';
import { AthleteContext, AthletesList, GoalEditor, NewArea } from '../screens/coach/Athlete';
import { HandoverDetail, HandoverNew, TaskDetail, TaskList } from '../screens/coach/Tasks';
import { Capture, UploadSimulator, VideoReview } from '../screens/coach/Capture';
import { Reassess } from '../screens/coach/Reassess';
import { Sync } from '../screens/coach/Sync';
import { Context } from '../screens/coach/Context';
import { CoachScore } from '../screens/coach/CoachScore';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  const t = useTheme();
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false, tabBarActiveTintColor: t.roleText, tabBarInactiveTintColor: t.textMuted,
      tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.line }, tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 11 },
    }}>
      <Tab.Screen name="Today" component={Today} options={{ tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tab.Screen name="Sessions" component={Sessions} options={{ tabBarIcon: ({ color }) => <CalendarDays size={22} color={color} /> }} />
      <Tab.Screen name="Athletes" component={AthletesList} options={{ tabBarIcon: ({ color }) => <Users size={22} color={color} /> }} />
      <Tab.Screen name="Tasks" component={TaskList} options={{ tabBarIcon: ({ color }) => <ListChecks size={22} color={color} /> }} />
    </Tab.Navigator>
  );
}

/** Coach app: teal identity on light chalk surfaces; dit and the Dit Score stay charcoal. */
export function CoachNav() {
  return (
    <ThemeProvider role="coach" mode="chalk">
      <CompanionProvider>
        <View style={{ flex: 1 }}>
          <UploadSimulator />
          <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="Tabs" component={Tabs} />
            <Stack.Screen name="Context" component={Context} />
            <Stack.Screen name="SessionDetail" component={SessionDetail} />
            <Stack.Screen name="WrapUp" component={WrapUp} />
            <Stack.Screen name="AthleteContext" component={AthleteContext} />
            <Stack.Screen name="NewArea" component={NewArea} />
            <Stack.Screen name="GoalEditor" component={GoalEditor} />
            <Stack.Screen name="CoachScore" component={CoachScore} />
            <Stack.Screen name="TaskDetail" component={TaskDetail} />
            <Stack.Screen name="HandoverNew" component={HandoverNew} />
            <Stack.Screen name="HandoverDetail" component={HandoverDetail} />
            <Stack.Screen name="Capture" component={Capture} />
            <Stack.Screen name="VideoReview" component={VideoReview} />
            <Stack.Screen name="Reassess" component={Reassess} />
            <Stack.Screen name="Sync" component={Sync} />
          </Stack.Navigator>
          <DitFab />
          <Toasts />
          <CompanionCanvas />
          <CompanionIntro surface="coach" />
        </View>
      </CompanionProvider>
    </ThemeProvider>
  );
}
