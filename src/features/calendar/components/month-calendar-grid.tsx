import dayjs, { type Dayjs } from 'dayjs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  buildCalendarMonthGrid,
  calendarWeekdayLabels,
  getCalendarDateKey,
  isSameCalendarDay,
  isSameCalendarMonth,
} from '@/src/features/calendar/lib/calendar-utils';
import type { TrainingStatus } from '@/src/types/database';
import { theme } from '@/src/theme';

type DayStatusMap = Record<string, TrainingStatus[]>;

type MonthCalendarGridProps = {
  monthCursor: Dayjs;
  onSelectDate: (dateKey: string) => void;
  selectedDate: string;
  statusMap: DayStatusMap;
};

const statusColors: Record<TrainingStatus, string> = {
  בוטל: theme.colors.danger,
  הושלם: theme.colors.accentStrong,
  מתוכנן: theme.colors.info,
  נדחה: theme.colors.warning,
};

export function MonthCalendarGrid({
  monthCursor,
  onSelectDate,
  selectedDate,
  statusMap,
}: MonthCalendarGridProps) {
  const days = buildCalendarMonthGrid(monthCursor);
  const todayKey = getCalendarDateKey(dayjs());

  return (
    <View style={styles.wrapper}>
      <View style={styles.weekHeader}>
        {calendarWeekdayLabels.map((label) => (
          <Text key={label} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((date) => {
          const dateKey = getCalendarDateKey(date);
          const dayStatuses = Array.from(new Set(statusMap[dateKey] ?? [])).slice(0, 3);
          const isSelected = isSameCalendarDay(dateKey, selectedDate);
          const isToday = dateKey === todayKey;
          const inCurrentMonth = isSameCalendarMonth(date, monthCursor);

          return (
            <Pressable
              key={dateKey}
              onPress={() => {
                onSelectDate(dateKey);
              }}
              style={({ pressed }) => [
                styles.dayButton,
                pressed && styles.dayButtonPressed,
              ]}
            >
              <View
                style={[
                  styles.dayCell,
                  !inCurrentMonth && styles.dayCellMuted,
                  isToday && styles.dayCellToday,
                  isSelected && styles.dayCellSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    !inCurrentMonth && styles.dayLabelMuted,
                    isSelected && styles.dayLabelSelected,
                  ]}
                >
                  {date.date()}
                </Text>

                <View style={styles.indicators}>
                  {dayStatuses.map((status) => (
                    <View
                      key={`${dateKey}-${status}`}
                      style={[
                        styles.indicator,
                        { backgroundColor: statusColors[status] },
                        isSelected && styles.indicatorOnSelected,
                      ]}
                    />
                  ))}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dayButton: {
    width: '14.285%',
  },
  dayButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  dayCell: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 16,
    gap: 5,
    height: 52,
    justifyContent: 'center',
    width: 42,
  },
  dayCellMuted: {
    opacity: 0.28,
  },
  dayCellSelected: {
    backgroundColor: theme.colors.info,
    shadowColor: theme.colors.info,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  dayCellToday: {
    backgroundColor: 'rgba(108, 143, 255, 0.08)',
    borderColor: 'rgba(108, 143, 255, 0.45)',
    borderWidth: 1,
  },
  dayLabel: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  dayLabelMuted: {
    color: theme.colors.textMuted,
  },
  dayLabelSelected: {
    color: theme.colors.background,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  indicator: {
    borderRadius: 999,
    height: 4,
    width: 4,
  },
  indicatorOnSelected: {
    backgroundColor: theme.colors.background,
  },
  indicators: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 4,
    minHeight: 8,
  },
  weekHeader: {
    flexDirection: 'row-reverse',
    marginBottom: 12,
  },
  weekday: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    width: '14.285%',
  },
  wrapper: {
    gap: 0,
  },
});
