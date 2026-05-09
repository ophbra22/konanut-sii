import { useRouter } from 'expo-router';
import { ArrowRight, RotateCw } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppScreen } from '@/src/components/ui/app-screen';
import { FilterChip } from '@/src/components/ui/filter-chip';
import { OpsIconButton } from '@/src/components/ui/ops-icon-button';
import { OpsSearchBar } from '@/src/components/ui/ops-search-bar';
import { SegmentedControl } from '@/src/components/ui/segmented-control';
import { isSuperAdmin } from '@/src/features/auth/lib/permissions';
import {
  useSyncSettlementRankingsMutation,
  type SettlementRankingListItem,
} from '@/src/features/rankings/api/rankings-service';
import { SettlementRankingCard } from '@/src/features/rankings/components/settlement-ranking-card';
import { useRankingsQuery } from '@/src/features/rankings/hooks/use-rankings-query';
import {
  getRankingPeriodLabel,
  type RankingPeriod,
} from '@/src/features/rankings/utils/ranking-calculator';
import { getCurrentHalfYearPeriod, type HalfYearPeriod } from '@/src/lib/date-utils';
import { rtlRow } from '@/src/lib/rtl';
import { matchesSearchQuery } from '@/src/lib/search-utils';
import { useAuthStore } from '@/src/stores/auth-store';
import { createThemedStyles, type AppTheme } from '@/src/theme';

type PeriodMode = 'H1' | 'H2' | 'YEAR';
type RankingFilter = 'all' | 'has-score' | 'missing-defense' | 'missing-range' | 'under-70';

const filterLabels: Record<RankingFilter, string> = {
  all: 'הכל',
  'has-score': 'ציון 70+',
  'missing-defense': 'חסרי הגנת יישוב',
  'missing-range': 'חסרי מטווח',
  'under-70': 'מתחת ל-70',
};

function getCurrentYear() {
  return new Date().getFullYear();
}

function getDefaultPeriodMode() {
  return getCurrentHalfYearPeriod().endsWith('H1') ? 'H1' : 'H2';
}

function buildRankingPeriod(year: number, mode: PeriodMode): RankingPeriod {
  return (mode === 'YEAR' ? `${year}-YEAR` : `${year}-${mode}`) as RankingPeriod;
}

function getFilterCount(items: SettlementRankingListItem[], filter: RankingFilter) {
  return items.filter((item) => matchesFilter(item, filter)).length;
}

function matchesFilter(item: SettlementRankingListItem, filter: RankingFilter) {
  switch (filter) {
    case 'missing-range':
      return !item.shootingCompleted;
    case 'missing-defense':
      return !item.defenseCompleted;
    case 'has-score':
      return item.finalScore >= 70;
    case 'under-70':
      return item.finalScore < 70;
    default:
      return true;
  }
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text numberOfLines={1} style={styles.summaryLabel}>
        {label}
      </Text>
      <Text numberOfLines={1} style={styles.summaryValue}>
        {value}
      </Text>
    </View>
  );
}

export default function SettlementRankingsScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const [periodMode, setPeriodMode] = useState<PeriodMode>(getDefaultPeriodMode);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<RankingFilter>('all');
  const syncMutation = useSyncSettlementRankingsMutation();
  const selectedPeriod = useMemo(
    () => buildRankingPeriod(getCurrentYear(), periodMode),
    [periodMode]
  );
  const { data, error, isLoading, isRefetching, refetch } = useRankingsQuery(selectedPeriod);

  const rankings = data ?? [];
  const summary = useMemo(() => {
    const total = rankings.length;
    const averageScore = total
      ? Math.round(rankings.reduce((sum, item) => sum + item.finalScore, 0) / total)
      : 0;
    const rangeDone = rankings.filter((item) => item.shootingCompleted).length;
    const defenseDone = rankings.filter((item) => item.defenseCompleted).length;

    return {
      averageScore,
      defenseDone,
      rangeDone,
      total,
    };
  }, [rankings]);

  const visibleRankings = useMemo(
    () =>
      rankings.filter(
        (item) =>
          matchesSearchQuery(
            [item.settlementName, item.area, item.regionalCouncil, item.councilName],
            searchTerm
          ) && matchesFilter(item, activeFilter)
      ),
    [activeFilter, rankings, searchTerm]
  );

  const handleRefresh = () => {
    if (isSuperAdmin(role) && periodMode !== 'YEAR') {
      void syncMutation.mutateAsync(selectedPeriod as HalfYearPeriod).finally(() => {
        void refetch();
      });
      return;
    }

    void refetch();
  };

  if (isLoading) {
    return <AppLoader label="טוען את דירוג היישובים..." />;
  }

  return (
    <AppScreen contentContainerStyle={styles.screenContent} scroll={false}>
      <FlatList
        ListEmptyComponent={
          error ? null : (
            <StateCard
              description={
                rankings.length
                  ? 'לא נמצאו יישובים שתואמים לחיפוש'
                  : 'אין עדיין נתוני דירוג להצגה'
              }
              title={rankings.length ? 'אין תוצאות' : 'אין נתונים'}
            />
          )
        }
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.header}>
              <View style={styles.headerActions}>
                <OpsIconButton
                  accessibilityLabel="חזרה"
                  icon={ArrowRight}
                  onPress={() => {
                    router.push('/settlements' as never);
                  }}
                />
                <OpsIconButton
                  accessibilityLabel="רענון"
                  accent={isRefetching || syncMutation.isPending}
                  icon={RotateCw}
                  onPress={handleRefresh}
                />
              </View>

              <View style={styles.headerText}>
                <Text style={styles.title}>דירוג יישובים</Text>
                <Text style={styles.subtitle}>{getRankingPeriodLabel(selectedPeriod)}</Text>
              </View>
            </View>

            <View style={styles.summaryGrid}>
              <SummaryMetric label="ממוצע ציון" value={`${summary.averageScore}`} />
              <SummaryMetric label="יישובים" value={`${summary.total}`} />
              <SummaryMetric
                label="מטווח"
                value={`${summary.rangeDone}/${summary.total}`}
              />
              <SummaryMetric
                label="הגנת יישוב"
                value={`${summary.defenseDone}/${summary.total}`}
              />
            </View>

            <SegmentedControl
              onValueChange={setPeriodMode}
              options={[
                { label: 'חציון א׳', value: 'H1' },
                { label: 'חציון ב׳', value: 'H2' },
                { label: 'שנתי', value: 'YEAR' },
              ]}
              value={periodMode}
            />

            <OpsSearchBar
              onChangeText={setSearchTerm}
              placeholder="חיפוש יישוב..."
              value={searchTerm}
            />

            <View style={styles.filters}>
              {(
                ['all', 'missing-range', 'missing-defense', 'has-score', 'under-70'] as const
              ).map((filter) => (
                <FilterChip
                  count={filter === 'all' ? rankings.length : getFilterCount(rankings, filter)}
                  key={filter}
                  label={filterLabels[filter]}
                  onPress={() => {
                    setActiveFilter(filter);
                  }}
                  selected={activeFilter === filter}
                  tone={filter === 'under-70' || filter.startsWith('missing') ? 'warning' : 'neutral'}
                />
              ))}
            </View>

            {error ? (
              <StateCard
                actionLabel="נסה שוב"
                description="לא הצלחנו לטעון את דירוג היישובים. נסה שוב."
                onAction={() => {
                  void refetch();
                }}
                title="שגיאה בטעינת הדירוג"
                variant="warning"
              />
            ) : null}
          </View>
        }
        contentContainerStyle={styles.listContent}
        data={error ? [] : visibleRankings}
        keyExtractor={(item) => item.settlementId}
        renderItem={({ item, index }) => (
          <SettlementRankingCard rankNumber={index + 1} ranking={item} />
        )}
        refreshing={isRefetching || syncMutation.isPending}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
      />
    </AppScreen>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  filters: {
    ...rtlRow,
    flexWrap: 'wrap',
    gap: 7,
  },
  header: {
    ...rtlRow,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerActions: {
    ...rtlRow,
    flexShrink: 0,
    gap: 8,
  },
  headerContent: {
    gap: 12,
    paddingBottom: 10,
  },
  headerText: {
    alignItems: 'flex-end',
    flex: 1,
    gap: 3,
  },
  listContent: {
    gap: 10,
    paddingBottom: 18,
  },
  screenContent: {
    flex: 1,
    paddingTop: 10,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    gap: 4,
    minHeight: 62,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryGrid: {
    ...rtlRow,
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  summaryValue: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  title: {
    ...theme.typography.screenTitle,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
}));
