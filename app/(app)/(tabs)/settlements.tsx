import { StyleSheet, Text, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { AppScreen } from '@/src/components/ui/app-screen';
import { PageHeader } from '@/src/components/ui/page-header';
import { getRoleLabel, isSuperAdmin } from '@/src/features/auth/lib/permissions';
import { SettlementListCard } from '@/src/features/settlements/components/settlement-list-card';
import { useSettlementsQuery } from '@/src/features/settlements/hooks/use-settlements-query';
import { useAuthStore } from '@/src/stores/auth-store';
import { theme } from '@/src/theme';

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <AppCard style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </AppCard>
  );
}

export default function SettlementsScreen() {
  const role = useAuthStore((state) => state.role);
  const { data, error, isLoading, refetch } = useSettlementsQuery();

  if (isLoading) {
    return <AppLoader label="טוען את רשימת היישובים..." />;
  }

  const settlements = data ?? [];
  const activeSettlements = settlements.filter((item) => item.is_active).length;
  const councilsCount = new Set(
    settlements
      .map((item) => item.regional_council)
      .filter((value): value is string => Boolean(value))
  ).size;

  return (
    <AppScreen>
      <PageHeader
        eyebrow="יישובים"
        title="תמונת מצב יישובית"
        subtitle={
          isSuperAdmin(role)
            ? 'כל היישובים זמינים לצפייה עבור מנהל המערכת, בהתאם למדיניות ההרשאות.'
            : `מוצגים רק היישובים המקושרים לחשבון שלך תחת הרשאת ${getRoleLabel(role)}.`
        }
      />

      <View style={styles.metricsGrid}>
        <MetricCard label="יישובים נגישים" value={String(settlements.length)} />
        <MetricCard label="יישובים פעילים" value={String(activeSettlements)} />
        <MetricCard label="מועצות אזוריות" value={String(councilsCount)} />
      </View>

      {error ? (
        <StateCard
          actionLabel="נסו שוב"
          description={error.message}
          onAction={() => {
            void refetch();
          }}
          title="לא הצלחנו לטעון את היישובים"
          variant="warning"
        />
      ) : null}

      {!error && !settlements.length ? (
        <StateCard
          actionLabel="רענון"
          description="כרגע אין יישובים נגישים לחשבון המחובר. אפשר לבדוק שיוכים בטבלת user_settlements או לטעון שוב."
          onAction={() => {
            void refetch();
          }}
          title="אין יישובים להצגה"
        />
      ) : null}

      {!error && settlements.length ? (
        <View style={styles.list}>
          {settlements.map((settlement) => (
            <SettlementListCard key={settlement.id} settlement={settlement} />
          ))}
        </View>
      ) : null}

      <AppCard
        description="מסך דירוג היישובים מחובר לאותו עקרון דומיין שבו היישוב הוא יחידת הכוננות והדירוג המרכזית."
        title="המשך ניווט"
      >
        <AppButton href="/settlement-rankings" label="מעבר לדירוג יישובים" />
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.md,
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
    color: theme.colors.accentStrong,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'right',
  },
  metricsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
});
