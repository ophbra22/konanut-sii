import { useRouter } from 'expo-router';
import { ArrowRight, RotateCw } from 'lucide-react-native';
import { useDeferredValue, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppChip } from '@/src/components/ui/app-chip';
import { OpsIconButton } from '@/src/components/ui/ops-icon-button';
import { OpsListHeader } from '@/src/components/ui/ops-list-header';
import { OpsSearchBar } from '@/src/components/ui/ops-search-bar';
import { AppScreen } from '@/src/components/ui/app-screen';
import { isSuperAdmin } from '@/src/features/auth/lib/permissions';
import { useSyncSettlementRankingsMutation } from '@/src/features/rankings/api/rankings-service';
import { SettlementRankingCard } from '@/src/features/rankings/components/settlement-ranking-card';
import {
  useRankingPeriodsQuery,
  useRankingsQuery,
} from '@/src/features/rankings/hooks/use-rankings-query';
import {
  getCurrentRankingPeriod,
  getDefaultRankingPeriods,
  type RankingLevel,
} from '@/src/features/rankings/utils/ranking-calculator';
import { getHalfYearLabel } from '@/src/lib/date-utils';
import { useAuthStore } from '@/src/stores/auth-store';
import { theme } from '@/src/theme';

type LevelFilter = 'all' | RankingLevel;

const levelOptions: Array<{
  key: LevelFilter;
  label: string;
}> = [
  { key: 'all', label: 'הכל' },
  { key: 'מצטיין', label: 'מצטיין' },
  { key: 'טוב', label: 'טוב' },
  { key: 'תקין', label: 'תקין' },
  { key: 'דורש שיפור', label: 'דורש שיפור' },
  { key: 'חריג', label: 'חריג' },
];

export default function SettlementRankingsScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const [period, setPeriod] = useState(getCurrentRankingPeriod());
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm.trim().toLowerCase());
  const syncMutation = useSyncSettlementRankingsMutation();
  const periodsQuery = useRankingPeriodsQuery();
  const { data, error, isLoading, refetch } = useRankingsQuery(period);

  const availablePeriods = periodsQuery.data?.length
    ? periodsQuery.data
    : getDefaultRankingPeriods();

  const searchedRankings = useMemo(() => {
    const items = data ?? [];

    if (!deferredSearch) {
      return items;
    }

    return items.filter((item) => {
      const candidates = [
        item.settlementName,
        item.area,
        item.regionalCouncil,
      ]
        .map((value) => value?.trim().toLowerCase() ?? '');

      return candidates.some((candidate) => candidate.includes(deferredSearch));
    });
  }, [data, deferredSearch]);

  const filteredRankings = useMemo(() => {
    if (levelFilter === 'all') {
      return searchedRankings;
    }

    return searchedRankings.filter((item) => item.rankingLevel === levelFilter);
  }, [levelFilter, searchedRankings]);

  const levelCounts = useMemo(
    () => ({
      all: searchedRankings.length,
      alert: searchedRankings.filter((item) => item.rankingLevel === 'חריג').length,
      excellent: searchedRankings.filter((item) => item.rankingLevel === 'מצטיין').length,
      good: searchedRankings.filter((item) => item.rankingLevel === 'טוב').length,
      improve: searchedRankings.filter((item) => item.rankingLevel === 'דורש שיפור').length,
      okay: searchedRankings.filter((item) => item.rankingLevel === 'תקין').length,
    }),
    [searchedRankings]
  );

  if (isLoading) {
    return <AppLoader label="טוען את דירוגי היישובים..." />;
  }

  return (
    <AppScreen contentContainerStyle={styles.screenContent} scroll={false}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <OpsListHeader
            actions={
              <>
                {isSuperAdmin(role) ? (
                  <OpsIconButton
                    icon={RotateCw}
                    onPress={() => {
                      void syncMutation.mutateAsync(period);
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
            subtitle={`${filteredRankings.length} יישובים מדורגים`}
            title="דירוג יישובים"
          />

          <OpsSearchBar
            onChangeText={setSearchTerm}
            placeholder="חיפוש יישוב..."
            value={searchTerm}
          />

          <ScrollView
            contentContainerStyle={styles.chipsContent}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <View style={styles.chipsRow}>
              {availablePeriods.map((periodOption) => (
                <AppChip
                  key={periodOption}
                  label={getHalfYearLabel(periodOption)}
                  onPress={() => {
                    setPeriod(periodOption);
                  }}
                  selected={period === periodOption}
                  tone={period === periodOption ? 'accent' : 'neutral'}
                />
              ))}
            </View>
          </ScrollView>

          <ScrollView
            contentContainerStyle={styles.chipsContent}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <View style={styles.chipsRow}>
              {levelOptions.map((option) => {
                const count =
                  option.key === 'all'
                    ? levelCounts.all
                    : option.key === 'מצטיין'
                      ? levelCounts.excellent
                      : option.key === 'טוב'
                        ? levelCounts.good
                        : option.key === 'תקין'
                          ? levelCounts.okay
                          : option.key === 'דורש שיפור'
                            ? levelCounts.improve
                            : levelCounts.alert;

                return (
                  <AppChip
                    key={option.key}
                    label={`${option.label} ${count}`}
                    onPress={() => {
                      setLevelFilter(option.key);
                    }}
                    selected={levelFilter === option.key}
                    tone={levelFilter === option.key ? 'accent' : 'neutral'}
                  />
                );
              })}
            </View>
          </ScrollView>

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

          {!error && !filteredRankings.length ? (
            <StateCard
              actionLabel={isSuperAdmin(role) ? 'רענון דירוגים' : 'רענון'}
              description={
                isSuperAdmin(role)
                  ? 'לא נמצאו דירוגים לתקופה או למסננים שנבחרו. אפשר לרענן חישוב לתקופה הפעילה.'
                  : 'לא נמצאו דירוגים לתקופה או למסננים שנבחרו.'
              }
              onAction={() => {
                if (isSuperAdmin(role)) {
                  void syncMutation.mutateAsync(period);
                  return;
                }

                void refetch();
              }}
              title="אין תוצאות להצגה"
            />
          ) : null}

          {!error && filteredRankings.length ? (
            <View style={styles.list}>
              {filteredRankings.map((item) => (
                <SettlementRankingCard key={item.settlementId} ranking={item} />
              ))}
            </View>
          ) : null}
        </ScrollView>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  chipsContent: {
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.lg,
  },
  chipsRow: {
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
  },
  container: {
    flex: 1,
  },
  content: {
    gap: 12,
    paddingBottom: theme.spacing.xl,
  },
  list: {
    gap: 10,
  },
  screenContent: {
    flex: 1,
    paddingTop: theme.spacing.sm,
  },
});
