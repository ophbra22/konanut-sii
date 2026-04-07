import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Plus, SlidersHorizontal } from 'lucide-react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppChip } from '@/src/components/ui/app-chip';
import { AppScreen } from '@/src/components/ui/app-screen';
import { FilterBottomSheet } from '@/src/components/ui/filter-bottom-sheet';
import { KeyboardSafeScrollView } from '@/src/components/ui/keyboard-safe-scroll-view';
import { OpsIconButton } from '@/src/components/ui/ops-icon-button';
import { OpsListHeader } from '@/src/components/ui/ops-list-header';
import { OpsSearchBar } from '@/src/components/ui/ops-search-bar';
import { canManageProfessionalContent } from '@/src/features/auth/lib/permissions';
import type { ProfessionalContentListItem } from '@/src/features/professional-content/api/professional-content-service';
import { ProfessionalContentCard } from '@/src/features/professional-content/components/professional-content-card';
import {
  professionalContentFilterOptions,
  type ProfessionalContentFilter,
} from '@/src/features/professional-content/constants';
import { useProfessionalContentQuery } from '@/src/features/professional-content/hooks/use-professional-content-query';
import { matchesSearchQuery } from '@/src/lib/search-utils';
import { useAuthStore } from '@/src/stores/auth-store';
import { useFeedbackStore } from '@/src/stores/feedback-store';
import { createThemedStyles, type AppTheme } from '@/src/theme';

function matchesFilter(
  item: ProfessionalContentListItem,
  filter: ProfessionalContentFilter
) {
  return filter === 'all' ? true : item.content_type === filter;
}

export default function ProfessionalContentScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const showToast = useFeedbackStore((state) => state.showToast);
  const canManage = canManageProfessionalContent(role);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<ProfessionalContentFilter>('all');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const { data, error, isLoading, refetch } = useProfessionalContentQuery(canManage);
  const contentItems = data ?? [];
  const hasActiveFilter = activeFilter !== 'all';
  const activeFilterLabel =
    professionalContentFilterOptions.find((option) => option.key === activeFilter)?.label ??
    'הכל';

  const searchedItems = useMemo(() => {
    return contentItems.filter((item) =>
      matchesSearchQuery([item.title, item.topic, item.description], searchTerm)
    );
  }, [contentItems, searchTerm]);

  const visibleItems = useMemo(() => {
    return searchedItems.filter((item) => matchesFilter(item, activeFilter));
  }, [activeFilter, searchedItems]);

  const filterCounts = useMemo(() => {
    return {
      all: searchedItems.length,
      document: searchedItems.filter((item) => item.content_type === 'document').length,
      presentation: searchedItems.filter((item) => item.content_type === 'presentation').length,
      video: searchedItems.filter((item) => item.content_type === 'video').length,
    } satisfies Record<ProfessionalContentFilter, number>;
  }, [searchedItems]);

  const inactiveCount = useMemo(
    () => contentItems.filter((item) => !item.is_active).length,
    [contentItems]
  );

  const openContent = useCallback(
    async (item: ProfessionalContentListItem) => {
      const url = item.url?.trim();

      if (!url) {
        showToast('לא ניתן לפתוח את הקישור לתוכן', 'error');
        return;
      }

      try {
        const supported = await Linking.canOpenURL(url);

        if (!supported) {
          showToast('לא ניתן לפתוח את הקישור לתוכן', 'error');
          return;
        }

        await Linking.openURL(url);
      } catch {
        showToast('לא ניתן לפתוח את הקישור לתוכן', 'error');
      }
    },
    [showToast]
  );

  if (isLoading) {
    return <AppLoader label="טוען את ספריית התוכן המקצועי..." />;
  }

  return (
    <>
      <AppScreen contentContainerStyle={styles.screenContent} scroll={false}>
        <View style={styles.container}>
          <KeyboardSafeScrollView contentContainerStyle={styles.content}>
            <View style={styles.topBlock}>
              <OpsListHeader
                actions={
                  <>
                    <OpsIconButton
                      accessibilityLabel="סינון תוכן מקצועי"
                      accent={hasActiveFilter}
                      icon={SlidersHorizontal}
                      onPress={() => {
                        setIsFilterSheetOpen(true);
                      }}
                      showIndicator={hasActiveFilter}
                    />
                    {canManage ? (
                      <OpsIconButton
                        accessibilityLabel="הוספת תוכן מקצועי"
                        accent
                        icon={Plus}
                        onPress={() => {
                          router.push('/professional-content/create' as never);
                        }}
                      />
                    ) : null}
                  </>
                }
                subtitle="מאגר סרטונים, מצגות ומסמכים מקצועיים"
                title="תוכן מקצועי"
              />

              <View style={styles.summaryRow}>
                <View style={styles.summaryDot} />
                <Text style={styles.summaryText}>
                  {canManage && inactiveCount
                    ? `${visibleItems.length} פריטים • ${inactiveCount} ממתינים לניהול`
                    : hasActiveFilter
                      ? `${visibleItems.length} פריטים • סינון: ${activeFilterLabel}`
                      : `${visibleItems.length} פריטים זמינים לעיון`}
                </Text>
              </View>

              <OpsSearchBar
                onChangeText={setSearchTerm}
                placeholder="חיפוש תוכן..."
                value={searchTerm}
              />
            </View>

            {error ? (
              <StateCard
                actionLabel="נסו שוב"
                description={error.message}
                onAction={() => {
                  void refetch();
                }}
                title="לא הצלחנו לטעון את התוכן המקצועי"
                variant="warning"
              />
            ) : null}

            {!error && !contentItems.length ? (
              <StateCard
                actionLabel={canManage ? 'הוספת תוכן' : 'רענון'}
                description="ספריית הידע עדיין ריקה. תכנים מקצועיים זמינים יופיעו כאן."
                onAction={() => {
                  if (canManage) {
                    router.push('/professional-content/create' as never);
                    return;
                  }

                  void refetch();
                }}
                title="אין תכנים זמינים כרגע"
              />
            ) : null}

            {!error && contentItems.length && !visibleItems.length ? (
              <StateCard
                description="לא נמצאו פריטי תוכן שתואמים לחיפוש או למסנן שנבחר."
                title="אין תוצאות מתאימות"
              />
            ) : null}

            {!error && visibleItems.length ? (
              <View style={styles.list}>
                {visibleItems.map((item) => (
                  <ProfessionalContentCard
                    canManage={canManage}
                    content={item}
                    key={item.id}
                    onEdit={
                      canManage
                        ? () => {
                            router.push(`/professional-content/${item.id}/edit` as never);
                          }
                        : undefined
                    }
                    onOpen={() => {
                      void openContent(item);
                    }}
                  />
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
        description="סננו לפי סוג תוכן כדי לגלוש מהר יותר בספרייה."
        onClose={() => {
          setIsFilterSheetOpen(false);
        }}
        title="סינון תוכן מקצועי"
        visible={isFilterSheetOpen}
      >
        <View style={styles.modalChips}>
          {professionalContentFilterOptions.map((option) => (
            <AppChip
              count={filterCounts[option.key]}
              key={option.key}
              label={option.label}
              onPress={() => {
                setActiveFilter(option.key);
                setIsFilterSheetOpen(false);
              }}
              selected={activeFilter === option.key}
              tone={activeFilter === option.key ? 'accent' : 'neutral'}
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
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  list: {
    gap: 8,
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
    paddingTop: 0,
  },
  summaryDot: {
    backgroundColor: theme.colors.borderStrong,
    borderRadius: theme.radius.pill,
    height: 4,
    opacity: 0.84,
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
    gap: 8,
    marginBottom: 2,
  },
}));
