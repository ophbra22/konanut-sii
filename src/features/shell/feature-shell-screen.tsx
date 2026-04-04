import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/src/components/ui/app-card';
import {
  AppButton,
  type AppButtonHref,
  type AppButtonVariant,
} from '@/src/components/ui/app-button';
import { AppScreen } from '@/src/components/ui/app-screen';
import { PageHeader } from '@/src/components/ui/page-header';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type MetricTone = 'accent' | 'danger' | 'default' | 'warning';

type FeatureShellScreenProps = {
  actions?: Array<{
    description: string;
    href?: AppButtonHref;
    label: string;
    onPress?: () => void;
    variant?: AppButtonVariant;
  }>;
  checklist: string[];
  children?: ReactNode;
  eyebrow: string;
  metrics: Array<{
    label: string;
    tone?: MetricTone;
    value: string;
  }>;
  subtitle: string;
  title: string;
};

export function FeatureShellScreen({
  actions,
  checklist,
  children,
  eyebrow,
  metrics,
  subtitle,
  title,
}: FeatureShellScreenProps) {
  return (
    <AppScreen>
      <PageHeader eyebrow={eyebrow} subtitle={subtitle} title={title} />

      <View style={styles.metricsGrid}>
        {metrics.map((metric) => (
          <AppCard key={metric.label} style={styles.metricCard}>
            <Text style={[styles.metricValue, metricToneStyles[metric.tone ?? 'default']]}>
              {metric.value}
            </Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </AppCard>
        ))}
      </View>

      <AppCard
        title="תכולה ראשונית"
        description="המסך בנוי כמעטפת הניתנת להרחבה, בלי לממש עדיין תהליכים עסקיים מלאים."
      >
        <View style={styles.list}>
          {checklist.map((item) => (
            <View key={item} style={styles.listItem}>
              <View style={styles.listBullet} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      </AppCard>

      {actions?.length ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <AppCard key={action.label} title={action.label} description={action.description}>
              <AppButton
                href={action.href}
                label={action.label}
                onPress={action.onPress}
                variant={action.variant ?? 'primary'}
              />
            </AppCard>
          ))}
        </View>
      ) : null}

      {children}
    </AppScreen>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  actions: {
    gap: theme.spacing.md,
  },
  list: {
    gap: theme.spacing.md,
  },
  listBullet: {
    backgroundColor: theme.colors.accentStrong,
    borderRadius: 999,
    height: 8,
    marginTop: 8,
    width: 8,
  },
  listItem: {
    alignItems: 'flex-start',
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
  },
  listText: {
    color: theme.colors.textSecondary,
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },
  metricCard: {
    flex: 1,
    minWidth: 100,
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'right',
  },
  metricsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
}));

const metricToneStyles = createThemedStyles((theme: AppTheme) => ({
  accent: {
    color: theme.colors.accentStrong,
  },
  danger: {
    color: theme.colors.danger,
  },
  default: {
    color: theme.colors.textPrimary,
  },
  warning: {
    color: theme.colors.warning,
  },
}));
