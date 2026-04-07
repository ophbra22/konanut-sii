import {
  LibraryBig,
  CalendarDays,
  House,
  MapPinned,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';
import { Tabs } from 'expo-router/tabs';

import { TabBarIcon } from '@/src/components/ui/tab-bar-icon';
import { useAppTheme, useThemeMode } from '@/src/theme';

export default function TabsLayout() {
  const theme = useAppTheme();
  const themeMode = useThemeMode();

  return (
    <Tabs
      key={themeMode}
      initialRouteName="dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBackground,
          borderTopColor: theme.colors.tabBarBorder,
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
        name="professional-content"
        options={{
          title: 'תוכן מקצועי',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon color={color} focused={focused} icon={LibraryBig} />
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
