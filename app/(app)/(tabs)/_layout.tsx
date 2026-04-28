import {
  LibraryBig,
  CalendarDays,
  House,
  MapPinned,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';
import { Tabs } from 'expo-router/tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarIcon } from '@/src/components/ui/tab-bar-icon';
import { useAppTheme, useThemeMode } from '@/src/theme';

export default function TabsLayout() {
  const theme = useAppTheme();
  const themeMode = useThemeMode();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 62 + Math.max(insets.bottom, 10);

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
          flexDirection: 'row-reverse',
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
        },
        tabBarItemStyle: {
          direction: 'rtl',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          writingDirection: 'rtl',
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
