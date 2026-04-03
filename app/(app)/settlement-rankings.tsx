import { useDeferredValue, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { AppChip } from '@/src/components/ui/app-chip';
import { DataRow } from '@/src/components/ui/data-row';
import { MetricCard } from '@/src/components/ui/metric-card';
import { AppScreen } from '@/src/components/ui/app-screen';
import { AppTextField } from '@/src/components/ui/app-text-field';
import { PageHeader } from '@/src/components/ui/page-header';
import { SectionBlock } from '@/src/components/ui/section-block';
import { isSuperAdmin } from '@/src/features/auth/lib/permissions';
import {
  useSyncSettlementRankingsMutation,
} from '@/src/features/rankings/api/rankings-service';
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
type AreaFilter = 'all' | string;

export default function SettlementRankingsScreen() {
  const role = useAuthStore((state) => state.role);
  const [period, setPeriod] = useState(getCurrentRankingPeriod());
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [areaFilter, setAreaFilter] = useState<AreaFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm.trim().toLowerCase());
  const syncMutation = useSyncSettlementRankingsMutation();
  const periodsQuery = useRankingPeriodsQuery();
  const { data, error, isLoading, refetch } = useRankingsQuery(period);

  const availablePeriods = periodsQuery.data?.length
    ? periodsQuery.data
    : getDefaultRankingPeriods();

  const availableAreas = useMemo(
    () => Array.from(new Set((data ?? []).map((item) => item.area))).sort((left, right) =>
      left.localeCompare(right, 'he')
    ),
    [data]
  );

  const filteredRankings = useMemo(() => {
    const items = (data ?? []).filter((item) => {
      const matchesLevel =
        levelFilter === 'all' || item.rankingLevel === levelFilter;
      const matchesArea = areaFilter === 'all' || item.area === areaFilter;
      const matchesSearch =
        !deferredSearch ||
        item.settlementName.toLowerCase().includes(deferredSearch) ||
        item.area.toLowerCase().includes(deferredSearch) ||
        item.regionalCouncil?.toLowerCase().includes(deferredSearch);

      return matchesArea && matchesLevel && matchesSearch;
    });

    return [...items].sort((left, right) => {
      if (right.finalScore !== left.finalScore) {
        return right.finalScore - left.finalScore;
      }

      return left.settlementName.localeCompare(right.settlementName, 'he');
    });
  }, [areaFilter, data, deferredSearch, levelFilter]);

  if (isLoading) {
    return <AppLoader label="טוען את דירוגי היישובים..." />;
  }

  return (
    <AppScreen>
      <PageHeader
        eyebrow="דירוג יישובים"
        title="דירוגי כוננות"
        subtitle="חישוב דירוג חציוני לכל יישוב לפי השלמת מטווח, הגנת יישוב וממוצע משובים."
      />

      <View style={styles.topActions}>
        <AppButton
          fullWidth={false}
          href="/settlements"
          label="חזרה ליישובים"
          style={styles.topAction}
          variant="ghost"
        />
        {isSuperAdmin(role) ? (
          <AppButton
            disabled={syncMutation.isPending}
            fullWidth={false}
            label="רענן דירוגים"
            loading={syncMutation.isPending}
            onPress={() => {
              void syncMutation.mutateAsync(period);
            }}
            style={styles.topAction}
            variant="secondary"
          />
        ) : null}
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard label="יישובים מחושבים" value={String(filteredRankings.length)} />
        <MetricCard
          label="ממוצע כללי"
          tone="accent"
          value={
            filteredRankings.length
              ? String(
                  Math.round(
                    filteredRankings.reduce((sum, item) => sum + item.finalScore, 0) /
                      filteredRankings.length
                  )
                )
              : '0'
          }
        />
        <MetricCard
          label="מצטיינים"
          value={String(
            filteredRankings.filter((item) => item.rankingLevel === 'מצטיין').length
          )}
        />
      </View>

      <AppCard
        description="נוסחת הדירוג: 25 נק׳ למטווח, 25 נק׳ להגנת יישוב, ועוד ממוצע משוב כפול 10 עד מקסימום 50."
        title="לוגיקת חישוב"
        variant="accent"
      >
        <DataRow label="מטווח" value="הושלם = 25 נקודות" />
        <DataRow label="הגנת יישוב" value="הושלם = 25 נקודות" />
        <DataRow label="משובים" value="ממוצע דירוג 1–5 כפול 10" />
        <DataRow label="ציון סופי" value="training_score + feedback_score" />
      </AppCard>

      <SectionBlock
        description="התוצאות ממוינות אוטומטית מהציון הגבוה לנמוך."
        title="סינון"
      >
        <View style={styles.filterBlock}>
          <Text style={styles.filterLabel}>תקופה</Text>
          <View style={styles.chips}>
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
        </View>

        <AppTextField
          label="חיפוש יישוב או אזור"
          onChangeText={setSearchTerm}
          placeholder="הקלידו שם יישוב או אזור"
          value={searchTerm}
        />

        <View style={styles.filterBlock}>
          <Text style={styles.filterLabel}>סינון לפי אזור</Text>
          <View style={styles.chips}>
            <AppChip
              label="כל האזורים"
              onPress={() => {
                setAreaFilter('all');
              }}
              selected={areaFilter === 'all'}
              tone={areaFilter === 'all' ? 'accent' : 'neutral'}
            />
            {availableAreas.map((area) => (
              <AppChip
                key={area}
                label={area}
                onPress={() => {
                  setAreaFilter(area);
                }}
                selected={areaFilter === area}
                tone={areaFilter === area ? 'accent' : 'neutral'}
              />
            ))}
          </View>
        </View>

        <View style={styles.filterBlock}>
          <Text style={styles.filterLabel}>סינון לפי רמה</Text>
          <View style={styles.chips}>
            {(['all', 'מצטיין', 'טוב', 'תקין', 'דורש שיפור', 'חריג'] as const).map(
              (option) => (
                <AppChip
                  key={option}
                  label={option === 'all' ? 'הכול' : option}
                  onPress={() => {
                    setLevelFilter(option);
                  }}
                  selected={levelFilter === option}
                  tone={levelFilter === option ? 'accent' : 'neutral'}
                />
              )
            )}
          </View>
        </View>
      </SectionBlock>

      {error ? (
        <StateCard
          actionLabel="נסו שוב"
          description={error.message}
          onAction={() => {
            void refetch();
          }}
          title="לא ניתן לחשב את הדירוגים"
          variant="warning"
        />
      ) : null}

      {!error && !filteredRankings.length ? (
        <StateCard
          actionLabel={isSuperAdmin(role) ? 'רענן דירוגים' : 'רענון'}
          description={
            isSuperAdmin(role)
              ? 'אין עדיין דירוגים לתקופה הזו. ניתן להפעיל חישוב ולסנכרן לטבלת הדירוגים.'
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
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterBlock: {
    gap: theme.spacing.sm,
  },
  filterLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
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
