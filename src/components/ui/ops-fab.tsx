import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type OpsFabProps = {
  onPress: () => void;
};

export function OpsFab({ onPress }: OpsFabProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        pressed && styles.pressed,
      ]}
    >
      <Plus color={theme.colors.background} size={22} />
    </Pressable>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  fab: {
    alignItems: 'center',
    backgroundColor: theme.colors.info,
    borderRadius: 24,
    bottom: 18,
    height: 56,
    justifyContent: 'center',
    left: theme.spacing.lg,
    position: 'absolute',
    shadowColor: theme.colors.info,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    width: 56,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
}));
