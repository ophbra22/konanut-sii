import { useRouter } from 'expo-router';
import { SlidersHorizontal } from 'lucide-react-native';
import { useDeferredValue, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { AppChip } from '@/src/components/ui/app-chip';
import { OpsFab } from '@/src/components/ui/ops-fab';
import { OpsIconButton } from '@/src/components/ui/ops-icon-button';
import { OpsListHeader } from '@/src/components/ui/ops-list-header';
import { OpsSearchBar } from '@/src/components/ui/ops-search-bar';
import { AppScreen } from '@/src/components/ui/app-screen';
import { canCreateTrainings } from '@/src/features/auth/lib/permissions';
import type { TrainingListItem } from '@/src/features/trainings/api/trainings-service';
import { TrainingListCard } from '@/src/features/trainings/components/training-list-card';
import { useTrainingsQuery } from '@/src/features/trainings/hooks/use-trainings-query';
import { useAuthStore } from '@/src/stores/auth-store';
import { theme } from '@/src/theme';

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

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function matchesSearch(training: TrainingListItem, searchTerm: string) {
  if (!searchTerm) {
    return true;
  }

  const candidates = [
    training.title,
    training.instructor?.full_name,
    ...training.settlements.map((settlement) => settlement.name),
  ].map(normalize);

  return candidates.some((candidate) => candidate.includes(searchTerm));
}

export default function TrainingsScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const canCreate = canCreateTrainings(role);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const deferredSearch = useDeferredValue(searchTerm.trim().toLowerCase());
  const { data, error, isLoading, refetch } = useTrainingsQuery();
  const trainings = data ?? [];

  const searchedTrainings = useMemo(
    () => trainings.filter((training) => matchesSearch(training, deferredSearch)),
    [deferredSearch, trainings]
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
                <OpsIconButton
                  icon={SlidersHorizontal}
                  onPress={() => {
                    setIsFilterSheetOpen(true);
                  }}
                />
              }
              subtitle={`${trainings.length} אימונים זמינים`}
              title="אימונים"
            />

            <OpsSearchBar
              onChangeText={setSearchTerm}
              placeholder="חיפוש אימון..."
              value={searchTerm}
            />

            <ScrollView
              contentContainerStyle={styles.chipsContent}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <View style={styles.chipsRow}>
                {statusFilterOptions.map((option) => {
                  const count =
                    option.key === 'all' ? chipCounts.all : chipCounts[option.key];
                  const isSelected = statusFilter === option.key;

                  return (
                    <AppChip
                      key={option.key}
                      label={`${option.label} ${count}`}
                      onPress={() => {
                        setStatusFilter(option.key);
                      }}
                      selected={isSelected}
                      tone={isSelected ? 'accent' : 'neutral'}
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

          {canCreate ? (
            <OpsFab
              onPress={() => {
                router.push('/trainings/create' as never);
              }}
            />
          ) : null}
        </View>
      </AppScreen>

      <Modal
        animationType="fade"
        onRequestClose={() => {
          setIsFilterSheetOpen(false);
        }}
        transparent
        visible={isFilterSheetOpen}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            onPress={() => {
              setIsFilterSheetOpen(false);
            }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.modalSheet}>
            <AppCard description="בחרו אילו סטטוסים להציג." title="סינון אימונים">
              <View style={styles.modalChips}>
                {statusFilterOptions.map((option) => {
                  const count =
                    option.key === 'all' ? chipCounts.all : chipCounts[option.key];
                  const isSelected = statusFilter === option.key;

                  return (
                    <AppChip
                      key={option.key}
                      label={`${option.label} ${count}`}
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

              <View style={styles.modalActions}>
                <AppButton
                  fullWidth={false}
                  label="איפוס"
                  onPress={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  style={styles.modalAction}
                  variant="ghost"
                />
                <AppButton
                  fullWidth={false}
                  label="סגירה"
                  onPress={() => {
                    setIsFilterSheetOpen(false);
                  }}
                  style={styles.modalAction}
                  variant="secondary"
                />
              </View>
            </AppCard>
          </View>
        </View>
      </Modal>
    </>
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
    paddingBottom: 112,
  },
  list: {
    gap: 10,
  },
  modalAction: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(5, 8, 11, 0.72)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: theme.spacing.lg,
  },
  modalChips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  modalSheet: {
    marginTop: 'auto',
  },
  screenContent: {
    flex: 1,
    paddingTop: theme.spacing.sm,
  },
});
