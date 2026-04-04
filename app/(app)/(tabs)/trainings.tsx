import { useRouter } from 'expo-router';
import { Plus, SlidersHorizontal } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
} from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppChip } from '@/src/components/ui/app-chip';
import { FilterBottomSheet } from '@/src/components/ui/filter-bottom-sheet';
import { OpsIconButton } from '@/src/components/ui/ops-icon-button';
import { OpsListHeader } from '@/src/components/ui/ops-list-header';
import { OpsSearchBar } from '@/src/components/ui/ops-search-bar';
import { AppScreen } from '@/src/components/ui/app-screen';
import { canCreateTrainings } from '@/src/features/auth/lib/permissions';
import type { TrainingListItem } from '@/src/features/trainings/api/trainings-service';
import { TrainingListCard } from '@/src/features/trainings/components/training-list-card';
import { useTrainingsQuery } from '@/src/features/trainings/hooks/use-trainings-query';
import { matchesSearchQuery } from '@/src/lib/search-utils';
import { useAuthStore } from '@/src/stores/auth-store';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type StatusFilter = 'all' | 'בוטל' | 'הושלם' | 'מתוכנן';

const statusFilterOptions: Array<{
  key: StatusFilter;
  label: string;
}> = [
  { key: 'all', label: 'הכל' },
  { key: 'מתוכנן', label: 'מתוכנן' },
  { key: 'הושלם', label: 'הושלם' },
  { key: 'בוטל', label: 'בוטל' },
];

function matchesSearch(training: TrainingListItem, searchTerm: string) {
  return matchesSearchQuery(
    [
      training.title,
      training.training_type,
      training.location,
      training.instructor?.full_name,
      ...training.settlements.flatMap((settlement) => [
        settlement.name,
        settlement.area,
      ]),
    ],
    searchTerm
  );
}

export default function TrainingsScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const canCreate = canCreateTrainings(role);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const { data, error, isLoading, refetch } = useTrainingsQuery();
  const trainings = data ?? [];
  const activeStatusFilterLabel =
    statusFilterOptions.find((option) => option.key === statusFilter)?.label ?? 'הכל';
  const hasActiveStatusFilter = statusFilter !== 'all';

  const searchedTrainings = useMemo(
    () => trainings.filter((training) => matchesSearch(training, searchTerm)),
    [searchTerm, trainings]
  );

  const filteredTrainings = useMemo(() => {
    if (statusFilter === 'all') {
      return searchedTrainings;
    }

    return searchedTrainings.filter((training) => training.status === statusFilter);
  }, [searchedTrainings, statusFilter]);

  const chipCounts = useMemo(
    () => ({
      all: searchedTrainings.length,
      בוטל: searchedTrainings.filter((training) => training.status === 'בוטל').length,
      הושלם: searchedTrainings.filter((training) => training.status === 'הושלם').length,
      מתוכנן: searchedTrainings.filter((training) => training.status === 'מתוכנן').length,
    }),
    [searchedTrainings]
  );

  if (isLoading) {
    return <AppLoader label="טוען את רשימת האימונים..." />;
  }

  return (
    <>
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
                  <OpsIconButton
                    accessibilityLabel="פתיחת מסנני אימונים"
                    accent={hasActiveStatusFilter}
                    icon={SlidersHorizontal}
                    onPress={() => {
                      setIsFilterSheetOpen(true);
                    }}
                    showIndicator={hasActiveStatusFilter}
                  />
                  {canCreate ? (
                    <OpsIconButton
                      accessibilityLabel="הוספת אימון"
                      accent
                      icon={Plus}
                      onPress={() => {
                        router.push('/trainings/create' as never);
                      }}
                    />
                  ) : null}
                </>
              }
              subtitle={
                hasActiveStatusFilter
                  ? `${trainings.length} אימונים זמינים • מסונן: ${activeStatusFilterLabel}`
                  : `${trainings.length} אימונים זמינים`
              }
              title="אימונים"
            />

            <OpsSearchBar
              onChangeText={setSearchTerm}
              placeholder="חיפוש אימון..."
              value={searchTerm}
            />

            {error ? (
              <StateCard
                actionLabel="נסו שוב"
                description={error.message}
                onAction={() => {
                  void refetch();
                }}
                title="לא הצלחנו לטעון את האימונים"
                variant="warning"
              />
            ) : null}

            {!error && !trainings.length ? (
              <StateCard
                actionLabel="רענון"
                description="כרגע אין אימונים נגישים לחשבון המחובר."
                onAction={() => {
                  void refetch();
                }}
                title="אין אימונים להצגה"
              />
            ) : null}

            {!error && trainings.length && !filteredTrainings.length ? (
              <StateCard
                description="לא נמצאו אימונים שתואמים לחיפוש או לסינון הנוכחי."
                title="לא נמצאו תוצאות"
              />
            ) : null}

            {!error && filteredTrainings.length ? (
              <View style={styles.list}>
                {filteredTrainings.map((training) => (
                  <TrainingListCard key={training.id} training={training} />
                ))}
              </View>
            ) : null}
          </ScrollView>

        </View>
      </AppScreen>

      <FilterBottomSheet
        actions={
          <>
            <AppButton
              disabled={!hasActiveStatusFilter}
              fullWidth={false}
              label="איפוס"
              onPress={() => {
                setStatusFilter('all');
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
        description="בחרו אילו סטטוסים להציג ברשימת האימונים."
        onClose={() => {
          setIsFilterSheetOpen(false);
        }}
        title="סינון אימונים"
        visible={isFilterSheetOpen}
      >
        <View style={styles.modalChips}>
          {statusFilterOptions.map((option) => {
            const count =
              option.key === 'all' ? chipCounts.all : chipCounts[option.key];
            const isSelected = statusFilter === option.key;

            return (
              <AppChip
                key={option.key}
                count={count}
                label={option.label}
                onPress={() => {
                  setStatusFilter(option.key);
                  setIsFilterSheetOpen(false);
                }}
                selected={isSelected}
                tone={isSelected ? 'accent' : 'neutral'}
              />
            );
          })}
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
