import { StyleSheet, Text, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppScreen } from '@/src/components/ui/app-screen';
import { MetricCard } from '@/src/components/ui/metric-card';
import { PageHeader } from '@/src/components/ui/page-header';
import { getRoleLabel, isSuperAdmin } from '@/src/features/auth/lib/permissions';
import { SettlementListCard } from '@/src/features/settlements/components/settlement-list-card';
import { useSettlementsQuery } from '@/src/features/settlements/hooks/use-settlements-query';
import { useAuthStore } from '@/src/stores/auth-store';
import { theme } from '@/src/theme';

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

      <View style={styles.topActions}>
        {isSuperAdmin(role) ? (
          <AppButton
            fullWidth={false}
            href="/settlements/create"
            label="יצירת יישוב"
            style={styles.topAction}
          />
        ) : null}
        <AppButton
          fullWidth={false}
          href="/settlement-rankings"
          label="דירוג יישובים"
          style={styles.topAction}
          variant="secondary"
        />
      </View>

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
            <SettlementListCard
              key={settlement.id}
              footer={
                <View style={styles.cardActions}>
                  <AppButton
                    fullWidth={false}
                    href={`/settlements/${settlement.id}`}
                    label="פרטים"
                    style={styles.cardAction}
                    variant="secondary"
                  />
                  {isSuperAdmin(role) ? (
                    <AppButton
                      fullWidth={false}
                      href={`/settlements/${settlement.id}/edit`}
                      label="עריכה"
                      style={styles.cardAction}
                      variant="ghost"
                    />
                  ) : null}
                </View>
              }
              settlement={settlement}
            />
          ))}
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  cardAction: {
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  list: {
    gap: theme.spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  topAction: {
    flex: 1,
  },
  topActions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
});
