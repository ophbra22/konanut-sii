import { useRouter } from 'expo-router';
import { Plus, Trophy } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { OpsIconButton } from '@/src/components/ui/ops-icon-button';
import { OpsListHeader } from '@/src/components/ui/ops-list-header';
import { OpsSearchBar } from '@/src/components/ui/ops-search-bar';
import { AppScreen } from '@/src/components/ui/app-screen';
import { canManageSettlements } from '@/src/features/auth/lib/permissions';
import { SettlementListCard } from '@/src/features/settlements/components/settlement-list-card';
import { useSettlementsQuery } from '@/src/features/settlements/hooks/use-settlements-query';
import { matchesSearchQuery } from '@/src/lib/search-utils';
import { useAuthStore } from '@/src/stores/auth-store';
import { theme } from '@/src/theme';

export default function SettlementsScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const canCreateSettlement = canManageSettlements(role);
  const [searchTerm, setSearchTerm] = useState('');
  const { data, error, isLoading, refetch } = useSettlementsQuery();
  const settlements = data ?? [];

  const searchedSettlements = useMemo(() => {
    return settlements.filter((settlement) => {
      return matchesSearchQuery(
        [settlement.name, settlement.regional_council, settlement.area],
        searchTerm
      );
    });
  }, [searchTerm, settlements]);

  if (isLoading) {
    return <AppLoader label="טוען את רשימת היישובים..." />;
  }

  return (
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
            subtitle={`${settlements.length} יישובים פעילים`}
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

          {!error && searchedSettlements.length ? (
            <View style={styles.list}>
              {searchedSettlements.map((settlement) => (
                <SettlementListCard key={settlement.id} settlement={settlement} />
              ))}
            </View>
          ) : null}
        </ScrollView>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
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
  screenContent: {
    flex: 1,
    paddingTop: theme.spacing.xxs,
  },
});
