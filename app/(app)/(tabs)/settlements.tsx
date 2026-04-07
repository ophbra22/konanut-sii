import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, SlidersHorizontal, Trophy } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppChip } from '@/src/components/ui/app-chip';
import { FilterBottomSheet } from '@/src/components/ui/filter-bottom-sheet';
import { KeyboardSafeScrollView } from '@/src/components/ui/keyboard-safe-scroll-view';
import { OpsIconButton } from '@/src/components/ui/ops-icon-button';
import { OpsListHeader } from '@/src/components/ui/ops-list-header';
import { OpsSearchBar } from '@/src/components/ui/ops-search-bar';
import { AppScreen } from '@/src/components/ui/app-screen';
import { canManageSettlements } from '@/src/features/auth/lib/permissions';
import { SettlementListCard } from '@/src/features/settlements/components/settlement-list-card';
import { useSettlementsQuery } from '@/src/features/settlements/hooks/use-settlements-query';
import {
  COMPLIANCE_FILTERS,
  getComplianceFilterFromParam,
  getEmptyFilterDescription,
  matchesComplianceFilter,
  SETTLEMENTS_COMPLIANCE_FILTER_PARAM,
  SETTLEMENTS_COMPLIANCE_FILTER_REQUEST_PARAM,
  type ComplianceFilterKey,
} from '@/src/features/settlements/lib/compliance-filters';
import {
  getCurrentHalfYearPeriod,
  getCurrentYear,
  getHalfYearLabel,
} from '@/src/lib/date-utils';
import { matchesSearchQuery } from '@/src/lib/search-utils';
import { useAuthStore } from '@/src/stores/auth-store';
import { createThemedStyles, type AppTheme } from '@/src/theme';

export default function SettlementsScreen() {
  const router = useRouter();
  const localParams = useLocalSearchParams<{
    complianceFilter?: string | string[];
    filterRequestAt?: string | string[];
  }>();
  const role = useAuthStore((state) => state.role);
  const canCreateSettlement = canManageSettlements(role);
  const incomingFilterParam = localParams[SETTLEMENTS_COMPLIANCE_FILTER_PARAM];
  const incomingRequestParam = localParams[SETTLEMENTS_COMPLIANCE_FILTER_REQUEST_PARAM];
  const initialFilter = getComplianceFilterFromParam(incomingFilterParam);
  const initialRequestKey = Array.isArray(incomingRequestParam)
    ? incomingRequestParam[0]
    : incomingRequestParam;
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<ComplianceFilterKey>(initialFilter);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const lastAppliedShortcutKeyRef = useRef<string | null>(initialRequestKey ?? null);
  const { data, error, isLoading, refetch } = useSettlementsQuery();
  const settlements = data ?? [];
  const currentHalfYear = getCurrentHalfYearPeriod();
  const currentYear = getCurrentYear();
  const activeFilterLabel =
    COMPLIANCE_FILTERS.find((filterOption) => filterOption.key === activeFilter)?.label ??
    'כל היישובים';
  const hasActiveFilter = activeFilter !== 'all';

  useEffect(() => {
    const nextRequestKey = Array.isArray(incomingRequestParam)
      ? incomingRequestParam[0]
      : incomingRequestParam;

    if (!nextRequestKey || lastAppliedShortcutKeyRef.current === nextRequestKey) {
      return;
    }

    setActiveFilter(getComplianceFilterFromParam(incomingFilterParam));
    lastAppliedShortcutKeyRef.current = nextRequestKey;
  }, [incomingFilterParam, incomingRequestParam]);

  const searchedSettlements = useMemo(() => {
    return settlements.filter((settlement) => {
      return matchesSearchQuery(
        [settlement.name, settlement.regional_council, settlement.area],
        searchTerm
      );
    });
  }, [searchTerm, settlements]);

  const filteredSettlements = useMemo(() => {
    return searchedSettlements.filter((settlement) =>
      matchesComplianceFilter(settlement, activeFilter)
    );
  }, [activeFilter, searchedSettlements]);

  const filterCounts = useMemo(() => {
    return {
      all: searchedSettlements.length,
      'defense-completed': searchedSettlements.filter(
        (settlement) => settlement.defenseCompletedCurrentYear
      ).length,
      'defense-missing': searchedSettlements.filter(
        (settlement) => !settlement.defenseCompletedCurrentYear
      ).length,
      'shooting-completed': searchedSettlements.filter(
        (settlement) => settlement.shootingCompletedCurrentHalfYear
      ).length,
      'shooting-missing': searchedSettlements.filter(
        (settlement) => !settlement.shootingCompletedCurrentHalfYear
      ).length,
    } satisfies Record<ComplianceFilterKey, number>;
  }, [searchedSettlements]);

  if (isLoading) {
    return <AppLoader label="טוען את רשימת היישובים..." />;
  }

  return (
    <>
      <AppScreen contentContainerStyle={styles.screenContent} scroll={false}>
        <View style={styles.container}>
          <KeyboardSafeScrollView
            contentContainerStyle={styles.content}
          >
            <OpsListHeader
              actions={
                <>
                  <OpsIconButton
                    accessibilityLabel="סינון יישובים"
                    accent={hasActiveFilter}
                    icon={SlidersHorizontal}
                    onPress={() => {
                      setIsFilterSheetOpen(true);
                    }}
                    showIndicator={hasActiveFilter}
                  />
                  <OpsIconButton
                    accessibilityLabel="מעבר לדירוג יישובים"
                    icon={Trophy}
                    onPress={() => {
                      router.push('/settlement-rankings' as never);
                    }}
                  />
                  {canCreateSettlement ? (
                    <OpsIconButton
                      accessibilityLabel="הוספת יישוב"
                      accent
                      icon={Plus}
                      onPress={() => {
                        router.push('/settlements/create' as never);
                      }}
                    />
                  ) : null}
                </>
              }
              subtitle={
                hasActiveFilter
                  ? `${settlements.length} יישובים פעילים • מסונן: ${activeFilterLabel}`
                  : `${settlements.length} יישובים פעילים`
              }
              title="יישובים"
            />

            <OpsSearchBar
              onChangeText={setSearchTerm}
              placeholder="חיפוש יישוב..."
              value={searchTerm}
            />

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
                description="כרגע אין יישובים נגישים לחשבון המחובר. אפשר לבדוק שיוכים או לנסות שוב."
                onAction={() => {
                  void refetch();
                }}
                title="אין יישובים להצגה"
              />
            ) : null}

            {!error && settlements.length && !searchedSettlements.length ? (
              <StateCard
                description="לא נמצאו יישובים שתואמים לחיפוש הנוכחי."
                title="לא נמצאו תוצאות"
              />
            ) : null}

            {!error && searchedSettlements.length && !filteredSettlements.length ? (
              <StateCard
                description={getEmptyFilterDescription(activeFilter)}
                title="אין יישובים בפילטר הנבחר"
              />
            ) : null}

            {!error && filteredSettlements.length ? (
              <View style={styles.list}>
                {filteredSettlements.map((settlement) => (
                  <SettlementListCard key={settlement.id} settlement={settlement} />
                ))}
              </View>
            ) : null}
          </KeyboardSafeScrollView>
        </View>
      </AppScreen>

      <FilterBottomSheet
        actions={
          <>
            <AppButton
              disabled={!hasActiveFilter}
              fullWidth={false}
              label="איפוס"
              onPress={() => {
                setActiveFilter('all');
              }}
              size="sm"
              style={styles.modalAction}
              variant="ghost"
            />
            <AppButton
              fullWidth={false}
              label="סגירה"
              onPress={() => {
                setIsFilterSheetOpen(false);
              }}
              size="sm"
              style={styles.modalAction}
              variant="secondary"
            />
          </>
        }
        description={`מטווח: ${getHalfYearLabel(currentHalfYear)} • הגנת יישוב: ${currentYear}`}
        onClose={() => {
          setIsFilterSheetOpen(false);
        }}
        title="סינון יישובים"
        visible={isFilterSheetOpen}
      >
        <View style={styles.modalChips}>
          {COMPLIANCE_FILTERS.map((filterOption) => (
            <AppChip
              key={filterOption.key}
              count={filterCounts[filterOption.key]}
              label={filterOption.label}
              onPress={() => {
                setActiveFilter(filterOption.key);
                setIsFilterSheetOpen(false);
              }}
              selected={activeFilter === filterOption.key}
              tone={activeFilter === filterOption.key ? 'accent' : filterOption.tone}
            />
          ))}
        </View>
      </FilterBottomSheet>
    </>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  container: {
    flex: 1,
  },
  content: {
    gap: theme.spacing.section,
    paddingBottom: theme.spacing.xl,
  },
  list: {
    gap: theme.spacing.sm,
  },
  modalAction: {
    flex: 1,
  },
  modalChips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  screenContent: {
    flex: 1,
    paddingTop: theme.spacing.xxs,
  },
}));
