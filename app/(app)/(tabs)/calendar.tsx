import dayjs from 'dayjs';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  SlidersHorizontal,
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { AppChip } from '@/src/components/ui/app-chip';
import { AppRevealView } from '@/src/components/ui/app-reveal-view';
import { AppScreen } from '@/src/components/ui/app-screen';
import { CalendarTrainingCard } from '@/src/features/calendar/components/calendar-training-card';
import { MonthCalendarGrid } from '@/src/features/calendar/components/month-calendar-grid';
import { useCalendarOverviewQuery } from '@/src/features/calendar/hooks/use-calendar-query';
import {
  formatCalendarMonthLabel,
  formatCalendarSelectedDateLabel,
} from '@/src/features/calendar/lib/calendar-utils';
import { canCreateTrainings } from '@/src/features/auth/lib/permissions';
import { trainingStatuses } from '@/src/features/trainings/constants';
import { useAuthStore } from '@/src/stores/auth-store';
import { theme } from '@/src/theme';

const allFilterValue = 'all';

type CalendarMode = 'day' | 'month';

function CircleIconButton({
  icon,
  label,
  onPress,
}: {
  icon: ComponentType<{ color: string; size: number }>;
  label: string;
  onPress: () => void;
}) {
  const Icon = icon;

  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
    >
      <Icon color={theme.colors.textPrimary} size={18} />
    </Pressable>
  );
}

function SegmentedModeSwitch({
  mode,
  onChange,
}: {
  mode: CalendarMode;
  onChange: (mode: CalendarMode) => void;
}) {
  return (
    <View style={styles.segmentedSwitch}>
      {([
        { key: 'month', label: 'חודש' },
        { key: 'day', label: 'יום' },
      ] as const).map((item) => {
        const isActive = item.key === mode;

        return (
          <Pressable
            key={item.key}
            onPress={() => {
              onChange(item.key);
            }}
            style={({ pressed }) => [
              styles.segment,
              isActive && styles.segmentActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function CalendarScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const canCreate = canCreateTrainings(role);
  const currentMonthKey = dayjs().format('YYYY-MM');
  const currentDateKey = dayjs().format('YYYY-MM-DD');
  const [mode, setMode] = useState<CalendarMode>('month');
  const [monthCursor, setMonthCursor] = useState(dayjs(currentDateKey).startOf('month'));
  const [selectedDate, setSelectedDate] = useState(currentDateKey);
  const [selectedSettlementId, setSelectedSettlementId] = useState(allFilterValue);
  const [selectedArea, setSelectedArea] = useState(allFilterValue);
  const [selectedStatus, setSelectedStatus] = useState(allFilterValue);
  const [selectedInstructorId, setSelectedInstructorId] = useState(allFilterValue);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const monthKey = monthCursor.format('YYYY-MM');
  const { data, error, isLoading, refetch } = useCalendarOverviewQuery(monthKey);

  const trainings = useMemo(
    () =>
      (data?.trainings ?? []).filter((training) => {
        const matchesSettlement =
          selectedSettlementId === allFilterValue ||
          training.settlements.some(
            (settlement) => settlement.id === selectedSettlementId
          );
        const matchesArea =
          selectedArea === allFilterValue ||
          training.settlements.some((settlement) => settlement.area === selectedArea);
        const matchesStatus =
          selectedStatus === allFilterValue || training.status === selectedStatus;
        const matchesInstructor =
          selectedInstructorId === allFilterValue ||
          training.instructor?.id === selectedInstructorId;

        return matchesSettlement && matchesArea && matchesStatus && matchesInstructor;
      }),
    [
      data?.trainings,
      selectedArea,
      selectedInstructorId,
      selectedSettlementId,
      selectedStatus,
    ]
  );

  const dayStatusMap = useMemo(
    () =>
      trainings.reduce<Record<string, Array<(typeof trainings)[number]['status']>>>(
        (accumulator, training) => {
          if (!accumulator[training.training_date]) {
            accumulator[training.training_date] = [];
          }

          accumulator[training.training_date].push(training.status);
          return accumulator;
        },
        {}
      ),
    [trainings]
  );

  const selectedDayTrainings = useMemo(
    () => trainings.filter((training) => training.training_date === selectedDate),
    [selectedDate, trainings]
  );

  const activeFiltersCount = [
    selectedSettlementId,
    selectedArea,
    selectedStatus,
    selectedInstructorId,
  ].filter((item) => item !== allFilterValue).length;

  const selectDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    setMonthCursor(dayjs(dateKey).startOf('month'));
  };

  const changeMonth = (diff: number) => {
    const nextMonth = monthCursor.add(diff, 'month').startOf('month');
    const nextMonthKey = nextMonth.format('YYYY-MM');

    setMonthCursor(nextMonth);
    setSelectedDate(
      nextMonthKey === currentMonthKey
        ? currentDateKey
        : nextMonth.startOf('month').format('YYYY-MM-DD')
    );
  };

  const moveSelectedDay = (diff: number) => {
    const nextDate = dayjs(selectedDate).add(diff, 'day');
    setSelectedDate(nextDate.format('YYYY-MM-DD'));
    setMonthCursor(nextDate.startOf('month'));
  };

  if (isLoading && !data) {
    return <AppLoader label="טוען את היומן המבצעי..." />;
  }

  return (
    <>
      <AppScreen contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            {canCreate ? (
              <Pressable
                onPress={() => {
                  router.push('/trainings/create' as never);
                }}
                style={({ pressed }) => [
                  styles.plusButton,
                  pressed && styles.pressed,
                ]}
              >
                <Plus color={theme.colors.background} size={20} />
              </Pressable>
            ) : (
              <View style={styles.plusButtonPlaceholder} />
            )}

            <View style={styles.titleBlock}>
              <Text style={styles.eyebrow}>חמ״ל מבצעי</Text>
              <Text style={styles.title}>לוח שנה</Text>
            </View>
          </View>

          <SegmentedModeSwitch mode={mode} onChange={setMode} />
        </View>

        {error ? (
          <StateCard
            actionLabel="רענון"
            description={error.message}
            onAction={() => {
              void refetch();
            }}
            title="היומן לא זמין כרגע"
            variant="warning"
          />
        ) : (
          <>
            <AppRevealView delay={40} style={styles.calendarShell}>
              <View style={styles.monthNavRow}>
                <CircleIconButton
                  icon={ChevronLeft}
                  label="חודש קודם"
                  onPress={() => {
                    changeMonth(-1);
                  }}
                />

                <Text style={styles.monthTitle}>{formatCalendarMonthLabel(monthCursor)}</Text>

                <CircleIconButton
                  icon={ChevronRight}
                  label="חודש הבא"
                  onPress={() => {
                    changeMonth(1);
                  }}
                />
              </View>

              {mode === 'month' ? (
                <MonthCalendarGrid
                  monthCursor={monthCursor}
                  onSelectDate={selectDate}
                  selectedDate={selectedDate}
                  statusMap={dayStatusMap}
                />
              ) : (
                <View style={styles.dayFocus}>
                  <CircleIconButton
                    icon={ChevronLeft}
                    label="יום קודם"
                    onPress={() => {
                      moveSelectedDay(-1);
                    }}
                  />

                  <View style={styles.dayFocusCenter}>
                    <View style={styles.dayFocusBadge}>
                      <Text style={styles.dayFocusDate}>{dayjs(selectedDate).date()}</Text>
                    </View>
                    <Text style={styles.dayFocusLabel}>
                      {formatCalendarSelectedDateLabel(selectedDate)}
                    </Text>
                    <Text style={styles.dayFocusSubLabel}>
                      {selectedDayTrainings.length
                        ? `${selectedDayTrainings.length} אימונים ביום הנבחר`
                        : 'אין אימונים ביום הנבחר'}
                    </Text>
                  </View>

                  <CircleIconButton
                    icon={ChevronRight}
                    label="יום הבא"
                    onPress={() => {
                      moveSelectedDay(1);
                    }}
                  />
                </View>
              )}

              <View style={styles.selectionRow}>
                <View style={styles.selectionActions}>
                  <Pressable
                    onPress={() => {
                      setIsFiltersOpen(true);
                    }}
                    style={({ pressed }) => [
                      styles.secondaryAction,
                      pressed && styles.pressed,
                    ]}
                  >
                    <SlidersHorizontal color={theme.colors.textSecondary} size={15} />
                    <Text style={styles.secondaryActionText}>
                      {activeFiltersCount ? `סינון ${activeFiltersCount}` : 'סינון'}
                    </Text>
                  </Pressable>

                  {canCreate ? (
                    <Pressable
                      onPress={() => {
                        router.push('/trainings/create' as never);
                      }}
                      style={({ pressed }) => [styles.addAction, pressed && styles.pressed]}
                    >
                      <Text style={styles.addActionText}>+ הוסף</Text>
                    </Pressable>
                  ) : null}
                </View>

                <View style={styles.selectionMeta}>
                  <Text style={styles.selectionTitle}>
                    {formatCalendarSelectedDateLabel(selectedDate)}
                  </Text>
                  <Text style={styles.selectionSubTitle}>
                    {selectedDayTrainings.length
                      ? `${selectedDayTrainings.length} אימונים ליום זה`
                      : 'ללא אימונים ליום זה'}
                  </Text>
                </View>
              </View>
            </AppRevealView>

            {selectedDayTrainings.length ? (
              <AppRevealView delay={80} key={selectedDate} style={styles.eventsList}>
                {selectedDayTrainings.map((training) => (
                  <CalendarTrainingCard key={training.id} training={training} />
                ))}
              </AppRevealView>
            ) : (
              <AppRevealView delay={80} key={`${selectedDate}-empty`}>
                <StateCard
                  description="אין אימונים בתאריך הנבחר. אפשר לעבור יום, לשנות חודש או לנקות סינון."
                  title="היום פנוי"
                />
              </AppRevealView>
            )}
          </>
        )}
      </AppScreen>

      <Modal
        animationType="fade"
        onRequestClose={() => {
          setIsFiltersOpen(false);
        }}
        transparent
        visible={isFiltersOpen}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            onPress={() => {
              setIsFiltersOpen(false);
            }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.modalSheet}>
            <AppCard
              description="המסננים חלים על סימון הימים ועל רשימת האימונים בתאריך הנבחר."
              title="סינון יומן"
            >
              <View style={styles.filterGroup}>
                <Text style={styles.filterTitle}>יישוב</Text>
                <View style={styles.filterChips}>
                  <AppChip
                    label="הכול"
                    onPress={() => {
                      setSelectedSettlementId(allFilterValue);
                    }}
                    selected={selectedSettlementId === allFilterValue}
                    tone={selectedSettlementId === allFilterValue ? 'accent' : 'neutral'}
                  />
                  {(data?.settlements ?? []).map((settlement) => (
                    <AppChip
                      key={settlement.id}
                      label={settlement.name}
                      onPress={() => {
                        setSelectedSettlementId(settlement.id);
                      }}
                      selected={selectedSettlementId === settlement.id}
                      tone={selectedSettlementId === settlement.id ? 'accent' : 'neutral'}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterTitle}>אזור</Text>
                <View style={styles.filterChips}>
                  <AppChip
                    label="הכול"
                    onPress={() => {
                      setSelectedArea(allFilterValue);
                    }}
                    selected={selectedArea === allFilterValue}
                    tone={selectedArea === allFilterValue ? 'accent' : 'neutral'}
                  />
                  {(data?.areas ?? []).map((area) => (
                    <AppChip
                      key={area}
                      label={area}
                      onPress={() => {
                        setSelectedArea(area);
                      }}
                      selected={selectedArea === area}
                      tone={selectedArea === area ? 'accent' : 'neutral'}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterTitle}>סטטוס</Text>
                <View style={styles.filterChips}>
                  <AppChip
                    label="הכול"
                    onPress={() => {
                      setSelectedStatus(allFilterValue);
                    }}
                    selected={selectedStatus === allFilterValue}
                    tone={selectedStatus === allFilterValue ? 'accent' : 'neutral'}
                  />
                  {trainingStatuses.map((status) => (
                    <AppChip
                      key={status}
                      label={status}
                      onPress={() => {
                        setSelectedStatus(status);
                      }}
                      selected={selectedStatus === status}
                      tone={selectedStatus === status ? 'accent' : 'neutral'}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterTitle}>מדריך</Text>
                <View style={styles.filterChips}>
                  <AppChip
                    label="הכול"
                    onPress={() => {
                      setSelectedInstructorId(allFilterValue);
                    }}
                    selected={selectedInstructorId === allFilterValue}
                    tone={selectedInstructorId === allFilterValue ? 'accent' : 'neutral'}
                  />
                  {(data?.instructors ?? []).map((instructor) => (
                    <AppChip
                      key={instructor.id}
                      label={instructor.full_name}
                      onPress={() => {
                        setSelectedInstructorId(instructor.id);
                      }}
                      selected={selectedInstructorId === instructor.id}
                      tone={selectedInstructorId === instructor.id ? 'accent' : 'neutral'}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.modalActions}>
                <AppButton
                  fullWidth={false}
                  label="איפוס"
                  onPress={() => {
                    setSelectedSettlementId(allFilterValue);
                    setSelectedArea(allFilterValue);
                    setSelectedStatus(allFilterValue);
                    setSelectedInstructorId(allFilterValue);
                  }}
                  style={styles.modalAction}
                  variant="ghost"
                />
                <AppButton
                  fullWidth={false}
                  label="סגירה"
                  onPress={() => {
                    setIsFiltersOpen(false);
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
  addAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  addActionText: {
    color: theme.colors.info,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'left',
  },
  calendarShell: {
    backgroundColor: 'rgba(13, 19, 24, 0.96)',
    borderColor: theme.colors.borderStrong,
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  circleButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: 14,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  content: {
    gap: 12,
    paddingBottom: theme.spacing.xl,
    paddingTop: 12,
  },
  dayFocus: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 248,
  },
  dayFocusBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.info,
    borderRadius: 20,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  dayFocusCenter: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  dayFocusDate: {
    color: theme.colors.background,
    fontSize: 24,
    fontWeight: '900',
  },
  dayFocusLabel: {
    color: theme.colors.textPrimary,
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  dayFocusSubLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  eyebrow: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    textAlign: 'right',
  },
  eventsList: {
    gap: 10,
  },
  filterChips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterGroup: {
    gap: 8,
  },
  filterTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },
  hero: {
    gap: 10,
    paddingBottom: 2,
  },
  heroHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  modalSheet: {
    marginTop: 'auto',
  },
  monthNavRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthTitle: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  plusButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.info,
    borderRadius: 16,
    height: 38,
    justifyContent: 'center',
    shadowColor: theme.colors.info,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    width: 38,
  },
  plusButtonPlaceholder: {
    height: 38,
    width: 38,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  secondaryAction: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 12,
  },
  secondaryActionText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  segmentedSwitch: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    padding: 3,
  },
  segment: {
    alignItems: 'center',
    borderRadius: 15,
    flex: 1,
    minHeight: 38,
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: theme.colors.info,
  },
  segmentLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  segmentLabelActive: {
    color: theme.colors.background,
  },
  selectionActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  selectionMeta: {
    flex: 1,
    gap: 2,
  },
  selectionRow: {
    alignItems: 'center',
    borderColor: theme.colors.borderStrong,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  selectionSubTitle: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  selectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'right',
  },
  titleBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
});
