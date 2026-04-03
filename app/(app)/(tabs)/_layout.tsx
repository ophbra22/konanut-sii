import {
  Bell,
  CalendarDays,
  House,
  MapPinned,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';
import { Tabs } from 'expo-router/tabs';

import { TabBarIcon } from '@/src/components/ui/tab-bar-icon';
import { theme } from '@/src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accentStrong,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surfaceStrong,
          borderTopColor: theme.colors.border,
          height: 78,
          paddingTop: 10,
          paddingBottom: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'בית',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon color={color} focused={focused} icon={House} />
          ),
        }}
      />
      <Tabs.Screen
        name="settlements"
        options={{
          title: 'יישובים',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon color={color} focused={focused} icon={MapPinned} />
          ),
        }}
      />
      <Tabs.Screen
        name="trainings"
        options={{
          title: 'אימונים',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon color={color} focused={focused} icon={ShieldCheck} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'יומן',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon color={color} focused={focused} icon={CalendarDays} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'התראות',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon color={color} focused={focused} icon={Bell} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'פרופיל',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon color={color} focused={focused} icon={UserRound} />
          ),
        }}
      />
    </Tabs>
  );
}
