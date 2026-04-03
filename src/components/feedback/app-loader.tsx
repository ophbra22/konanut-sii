import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/src/components/ui/app-screen';
import { theme } from '@/src/theme';

type AppLoaderProps = {
  label: string;
};

export function AppLoader({ label }: AppLoaderProps) {
  return (
    <AppScreen contentContainerStyle={styles.content} scroll={false}>
      <View style={styles.loader}>
        <ActivityIndicator color={theme.colors.accentStrong} size="large" />
        <Text style={styles.label}>{label}</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  loader: {
    alignItems: 'center',
    gap: theme.spacing.md,
    maxWidth: 260,
  },
});
