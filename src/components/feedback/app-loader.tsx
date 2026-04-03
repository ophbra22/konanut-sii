import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/src/components/ui/app-card';
import { AppScreen } from '@/src/components/ui/app-screen';
import { theme } from '@/src/theme';

type AppLoaderProps = {
  label: string;
};

export function AppLoader({ label }: AppLoaderProps) {
  return (
    <AppScreen contentContainerStyle={styles.content} scroll={false}>
      <AppCard style={styles.loader} variant="default">
        <ActivityIndicator color={theme.colors.info} size="large" />
        <Text style={styles.label}>{label}</Text>
      </AppCard>
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
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  loader: {
    alignItems: 'center',
    gap: 12,
    maxWidth: 260,
    minWidth: 220,
  },
});
