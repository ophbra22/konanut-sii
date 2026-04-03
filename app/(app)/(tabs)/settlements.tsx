import { useRouter } from 'expo-router';
import { SlidersHorizontal, Trophy } from 'lucide-react-native';
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
import { canManageSettlements } from '@/src/features/auth/lib/permissions';
import { SettlementListCard } from '@/src/features/settlements/components/settlement-list-card';
import { useSettlementsQuery } from '@/src/features/settlements/hooks/use-settlements-query';
import { useAuthStore } from '@/src/stores/auth-store';
import { theme } from '@/src/theme';

type SettlementFilter = 'active' | 'all' | 'inactive';

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

export default function SettlementsScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const canCreateSettlement = canManageSettlements(role);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SettlementFilter>('all');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const deferredSearch = useDeferredValue(searchTerm.trim().toLowerCase());
  const { data, error, isLoading, refetch } = useSettlementsQuery();
  const settlements = data ?? [];

  const searchedSettlements = useMemo(() => {
    if (!deferredSearch) {
      return settlements;
    }

    return settlements.filter((settlement) => {
      const name = normalize(settlement.name);
      const council = normalize(settlement.regional_council);
      const area = normalize(settlement.area);

      return (
        name.includes(deferredSearch) ||
        council.includes(deferredSearch) ||
        area.includes(deferredSearch)
      );
    });
  }, [deferredSearch, settlements]);

  const filteredSettlements = useMemo(() => {
    if (statusFilter === 'all') {
      return searchedSettlements;
    }

    return searchedSettlements.filter((settlement) =>
      statusFilter === 'active' ? settlement.is_active : !settlement.is_active
    );
  }, [searchedSettlements, statusFilter]);

  const chipCounts = useMemo(
    () => ({
      active: searchedSettlements.filter((settlement) => settlement.is_active).length,
      all: searchedSettlements.length,
      inactive: searchedSettlements.filter((settlement) => !settlement.is_active).length,
    }),
    [searchedSettlements]
  );

  if (isLoading) {
    return <AppLoader label="טוען את רשימת היישובים..." />;
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
                    icon={SlidersHorizontal}
                    onPress={() => {
                      setIsFilterSheetOpen(true);
                    }}
                  />
                  <OpsIconButton
                    icon={Trophy}
                    onPress={() => {
                      router.push('/settlement-rankings' as never);
                    }}
                  />
                </>
              }
              subtitle={`${settlements.length} יישובים זמינים`}
              title="יישובים"
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
                {([
                  { key: 'all', label: 'הכל' },
                  { key: 'active', label: 'פעילים' },
                  { key: 'inactive', label: 'לא פעילים' },
                ] as const).map((option) => {
                  const count =
                    option.key === 'all'
                      ? chipCounts.all
                      : option.key === 'active'
                        ? chipCounts.active
                        : chipCounts.inactive;

                  return (
                    <AppChip
                      key={option.key}
                      label={`${option.label} ${count}`}
                      onPress={() => {
                        setStatusFilter(option.key);
                      }}
                      selected={statusFilter === option.key}
                      tone={statusFilter === option.key ? 'accent' : 'neutral'}
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

            {!error && settlements.length && !filteredSettlements.length ? (
              <StateCard
                description="לא נמצאו יישובים שמתאימים לחיפוש או לסינון הנוכחי."
                title="לא נמצאו תוצאות"
              />
            ) : null}

            {!error && filteredSettlements.length ? (
              <View style={styles.list}>
                {filteredSettlements.map((settlement) => (
                  <SettlementListCard key={settlement.id} settlement={settlement} />
                ))}
              </View>
            ) : null}
          </ScrollView>

          {canCreateSettlement ? (
            <OpsFab
              onPress={() => {
                router.push('/settlements/create' as never);
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
            <AppCard description="בחרו אילו יישובים להציג." title="סינון יישובים">
              <View style={styles.modalChips}>
                {([
                  { key: 'all', label: 'הכל' },
                  { key: 'active', label: 'פעילים' },
                  { key: 'inactive', label: 'לא פעילים' },
                ] as const).map((option) => {
                  const count =
                    option.key === 'all'
                      ? chipCounts.all
                      : option.key === 'active'
                        ? chipCounts.active
                        : chipCounts.inactive;

                  return (
                    <AppChip
                      key={option.key}
                      label={`${option.label} ${count}`}
                      onPress={() => {
                        setStatusFilter(option.key);
                        setIsFilterSheetOpen(false);
                      }}
                      selected={statusFilter === option.key}
                      tone={statusFilter === option.key ? 'accent' : 'neutral'}
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
    paddingBottom: 132,
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
