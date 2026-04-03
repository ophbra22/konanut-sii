import { useQuery } from '@tanstack/react-query';

import { getCalendarOverview } from '@/src/features/calendar/api/calendar-service';
import { queryKeys } from '@/src/lib/query-keys';

export function useCalendarOverviewQuery(monthKey: string) {
  return useQuery({
    enabled: Boolean(monthKey),
    queryFn: () => getCalendarOverview(monthKey),
    queryKey: queryKeys.calendar.month(monthKey),
  });
}
