import { useRouter } from 'expo-router';
import { ArrowRight, RotateCw } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppScreen } from '@/src/components/ui/app-screen';
import { KeyboardSafeScrollView } from '@/src/components/ui/keyboard-safe-scroll-view';
import { OpsIconButton } from '@/src/components/ui/ops-icon-button';
import { OpsListHeader } from '@/src/components/ui/ops-list-header';
import { OpsSearchBar } from '@/src/components/ui/ops-search-bar';
import { isSuperAdmin } from '@/src/features/auth/lib/permissions';
import { useSyncSettlementRankingsMutation } from '@/src/features/rankings/api/rankings-service';
import { SettlementRankingCard } from '@/src/features/rankings/components/settlement-ranking-card';
import { useRankingsQuery } from '@/src/features/rankings/hooks/use-rankings-query';
import { getCurrentHalfYearPeriod, getHalfYearLabel } from '@/src/lib/date-utils';
import { matchesSearchQuery } from '@/src/lib/search-utils';
import { useAuthStore } from '@/src/stores/auth-store';
import { createThemedStyles, type AppTheme } from '@/src/theme';

export default function SettlementRankingsScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const currentPeriod = getCurrentHalfYearPeriod();
  const [searchTerm, setSearchTerm] = useState('');
  const syncMutation = useSyncSettlementRankingsMutation();
  const { data, error, isLoading, refetch } = useRankingsQuery(currentPeriod);

  const visibleRankings = useMemo(() => {
    const items = data ?? [];

    return items.filter((item) =>
      matchesSearchQuery([item.settlementName, item.area, item.regionalCouncil], searchTerm)
    );
  }, [data, searchTerm]);

  if (isLoading) {
    return <AppLoader label="טוען את דירוגי היישובים..." />;
  }

  return (
    <AppScreen contentContainerStyle={styles.screenContent} scroll={false}>
      <View style={styles.container}>
        <KeyboardSafeScrollView contentContainerStyle={styles.content}>
          <View style={styles.topBlock}>
            <OpsListHeader
              actions={
                <>
                  {isSuperAdmin(role) ? (
                    <OpsIconButton
                      icon={RotateCw}
                      onPress={() => {
                        void syncMutation.mutateAsync(currentPeriod);
                      }}
                    />
                  ) : null}
                  <OpsIconButton
                    icon={ArrowRight}
                    onPress={() => {
                      router.push('/settlements' as never);
                    }}
                  />
                </>
              }
              subtitle={getHalfYearLabel(currentPeriod)}
              title="דירוג יישובים"
            />

            <View style={styles.summaryRow}>
              <View style={styles.summaryDot} />
              <Text style={styles.summaryText}>
                {`${visibleRankings.length} יישובים • ממוינים לפי ציון`}
              </Text>
            </View>

            <View style={styles.searchWrap}>
              <OpsSearchBar
                onChangeText={setSearchTerm}
                placeholder="חיפוש יישוב..."
                value={searchTerm}
              />
            </View>
          </View>

          {error ? (
            <StateCard
              actionLabel="נסו שוב"
              description={error.message}
              onAction={() => {
                void refetch();
              }}
              title="לא ניתן לטעון את הדירוגים"
              variant="warning"
            />
          ) : null}

          {!error && !visibleRankings.length ? (
            <StateCard
              actionLabel={isSuperAdmin(role) ? 'רענון דירוגים' : 'רענון'}
              description={
                isSuperAdmin(role)
                  ? `לא נמצאו דירוגים עבור ${getHalfYearLabel(currentPeriod)}. אפשר לרענן חישוב לתקופה הפעילה.`
                  : `לא נמצאו דירוגים עבור ${getHalfYearLabel(currentPeriod)}.`
              }
              onAction={() => {
                if (isSuperAdmin(role)) {
                  void syncMutation.mutateAsync(currentPeriod);
                  return;
                }

                void refetch();
              }}
              title="אין תוצאות להצגה"
            />
          ) : null}

          {!error && visibleRankings.length ? (
            <View style={styles.list}>
              {visibleRankings.map((item) => (
                <SettlementRankingCard key={item.settlementId} ranking={item} />
              ))}
            </View>
          ) : null}
        </KeyboardSafeScrollView>
      </View>
    </AppScreen>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  container: {
    flex: 1,
  },
  content: {
    gap: 8,
    paddingBottom: theme.spacing.xl,
  },
  list: {
    gap: 7,
  },
  searchWrap: {
    paddingTop: 2,
  },
  screenContent: {
    flex: 1,
    paddingTop: 0,
  },
  summaryDot: {
    backgroundColor: theme.colors.borderStrong,
    borderRadius: theme.radius.pill,
    height: 4,
    opacity: 0.8,
    width: 4,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
    justifyContent: 'flex-end',
  },
  summaryText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  topBlock: {
    gap: 6,
    marginBottom: 2,
  },
}));
