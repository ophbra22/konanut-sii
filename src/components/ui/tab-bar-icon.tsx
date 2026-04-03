import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';

type TabBarIconProps = {
  color: string;
  focused: boolean;
  icon: ComponentType<{
    color?: string;
    size?: number;
    strokeWidth?: number;
  }>;
};

export function TabBarIcon({ color, focused, icon: Icon }: TabBarIconProps) {
  return (
    <View style={[styles.wrapper, focused && styles.focused]}>
      <Icon color={color} size={18} strokeWidth={focused ? 2.4 : 2} />
    </View>
  );
}

const styles = StyleSheet.create({
  focused: {
    transform: [{ scale: 1.04 }],
  },
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
    minWidth: 24,
  },
});
