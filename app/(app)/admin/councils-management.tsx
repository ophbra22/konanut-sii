import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowRight, Trash2 } from 'lucide-react-native';
import { Alert, Text, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppCard } from '@/src/components/ui/app-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppChip } from '@/src/components/ui/app-chip';
import { AppRevealView } from '@/src/components/ui/app-reveal-view';
import { AppScreen } from '@/src/components/ui/app-screen';
import { AppTextField } from '@/src/components/ui/app-text-field';
import { KeyboardSafeScrollView } from '@/src/components/ui/keyboard-safe-scroll-view';
import { OpsIconButton } from '@/src/components/ui/ops-icon-button';
import { OpsListHeader } from '@/src/components/ui/ops-list-header';
import { SectionBlock } from '@/src/components/ui/section-block';
import { canManageSettlements } from '@/src/features/auth/lib/permissions';
import { useCreateCouncilMutation, useDeleteCouncilMutation } from '@/src/features/councils/hooks/use-council-mutations';
import { useCouncilsQuery } from '@/src/features/councils/hooks/use-councils-query';
import { getPresentableErrorMessage } from '@/src/lib/error-utils';
import { PLAGA_VALUES, type PlagaName } from '@/src/lib/plaga';
import { rtlRow } from '@/src/lib/rtl';
import { useAuthStore } from '@/src/stores/auth-store';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

const DEFAULT_REGIONAL_SQUAD_NAME = 'כיתת כוננות אזורית';

export default function CouncilsManagementScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const canManage = canManageSettlements(role);
  const councilsQuery = useCouncilsQuery(canManage);
  const createMutation = useCreateCouncilMutation();
  const deleteMutation = useDeleteCouncilMutation();
  const [name, setName] = useState('');
  const [selectedPlaga, setSelectedPlaga] = useState<PlagaName>(PLAGA_VALUES[0]);

  const sortedCouncils = useMemo(
    () => [...(councilsQuery.data ?? [])].sort((left, right) => left.name.localeCompare(right.name, 'he')),
    [councilsQuery.data]
  );
  const trimmedName = name.trim();
  const canSubmit = Boolean(trimmedName) && !createMutation.isPending;

  if (!canManage) {
    return (
      <AppScreen>
        <OpsListHeader
          actions={
            <OpsIconButton
              accessibilityLabel="חזרה לפרופיל"
              icon={ArrowRight}
              onPress={() => {
                router.replace('/profile' as never);
              }}
            />
          }
          subtitle="גישה מוגבלת למנהל מערכת בלבד"
          title="ניהול מועצות"
        />

        <StateCard
          actionLabel="חזרה לפרופיל"
          description="המסך הזה זמין רק למשתמש שמוגדר מנהל מערכת."
          onAction={() => {
            router.replace('/profile' as never);
          }}
          title="אין הרשאה לצפייה במסך"
          variant="warning"
        />
      </AppScreen>
    );
  }

  if (councilsQuery.isLoading) {
    return <AppLoader label="טוען את רשימת המועצות..." />;
  }

  const handleCreateCouncil = async () => {
    if (!trimmedName) {
      return;
    }

    await createMutation.mutateAsync({
      name: trimmedName,
      plaga_name: selectedPlaga,
      regional_squad_name: DEFAULT_REGIONAL_SQUAD_NAME,
    });

    setName('');
    setSelectedPlaga(PLAGA_VALUES[0]);
  };

  const handleDeleteCouncil = (councilId: string, councilName: string) => {
    Alert.alert(
      'הסרת מועצה',
      `האם להסיר את המועצה ${councilName}? הפעולה תנקה גם שיוכים של יישובים ומשתמשים למועצה זו.`,
      [
        { style: 'cancel', text: 'ביטול' },
        {
          style: 'destructive',
          text: 'הסרה',
          onPress: () => {
            deleteMutation.mutate(councilId);
          },
        },
      ]
    );
  };

  return (
    <AppScreen contentContainerStyle={styles.screenContent} scroll={false}>
      <KeyboardSafeScrollView contentContainerStyle={styles.content}>
        <OpsListHeader
          actions={
            <OpsIconButton
              accessibilityLabel="חזרה לפרופיל"
              icon={ArrowRight}
              onPress={() => {
                router.back();
              }}
            />
          }
          subtitle={`${sortedCouncils.length} מועצות מוגדרות במערכת`}
          title="ניהול מועצות"
        />

        {councilsQuery.error ? (
          <StateCard
            actionLabel="נסו שוב"
            description={getPresentableErrorMessage(
              councilsQuery.error,
              'לא ניתן לטעון את רשימת המועצות'
            )}
            onAction={() => {
              void councilsQuery.refetch();
            }}
            title="לא ניתן לטעון את רשימת המועצות"
            variant="warning"
          />
        ) : null}

        <AppRevealView delay={30}>
          <AppCard
            description="הוספת מועצה חדשה עם שיוך לפלגה. ניתן להשאיר את כיתת הכוננות האזורית בשם ברירת המחדל."
            title="הוספת מועצה"
          >
            <View style={styles.formStack}>
              <AppTextField
                label="שם המועצה"
                onChangeText={setName}
                placeholder="לדוגמה: באר טוביה"
                value={name}
              />

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>פלגה</Text>
                <View style={styles.chipsRow}>
                  {PLAGA_VALUES.map((plaga) => (
                    <AppChip
                      key={plaga}
                      label={plaga}
                      onPress={() => {
                        setSelectedPlaga(plaga);
                      }}
                      selected={selectedPlaga === plaga}
                      tone={selectedPlaga === plaga ? 'accent' : 'neutral'}
                    />
                  ))}
                </View>
              </View>

              <AppButton
                disabled={!canSubmit}
                label="הוספת מועצה"
                loading={createMutation.isPending}
                onPress={() => {
                  void handleCreateCouncil();
                }}
                size="sm"
                variant="primary"
              />
            </View>
          </AppCard>
        </AppRevealView>

        <AppRevealView delay={60}>
          <SectionBlock
            description="כאן ניתן להסיר מועצות קיימות. ההסרה תנקה שיוכים למועצה זו."
            title="מועצות קיימות"
          >
            {sortedCouncils.length ? (
              <View style={styles.list}>
                {sortedCouncils.map((council) => (
                  <AppCard key={council.id} style={styles.councilCard}>
                    <View style={styles.councilTopRow}>
                      <View style={styles.badgesRow}>
                        <AppChip label={council.plaga_name} selected tone="accent" />
                        <AppChip
                          label={council.regional_squad_name?.trim() || DEFAULT_REGIONAL_SQUAD_NAME}
                          selected={false}
                          tone="neutral"
                        />
                      </View>

                      <Text style={styles.councilName}>{council.name}</Text>
                    </View>

                    <View style={styles.councilActions}>
                      <AppButton
                        label="הסרת מועצה"
                        onPress={() => {
                          handleDeleteCouncil(council.id, council.name);
                        }}
                        size="sm"
                        variant="danger"
                      />
                      <View style={styles.deleteHint}>
                        <Trash2 color={theme.colors.textMuted} size={14} strokeWidth={2.1} />
                        <Text style={styles.deleteHintText}>הפעולה תשחרר שיוכים קיימים למועצה זו</Text>
                      </View>
                    </View>
                  </AppCard>
                ))}
              </View>
            ) : (
              <StateCard
                description="עדיין לא הוגדרו מועצות במערכת."
                title="אין מועצות להצגה"
              />
            )}
          </SectionBlock>
        </AppRevealView>
      </KeyboardSafeScrollView>
    </AppScreen>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  badgesRow: {
    ...rtlRow,
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  chipsRow: {
    ...rtlRow,
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  content: {
    gap: theme.spacing.section,
    paddingBottom: theme.spacing.xl,
  },
  councilActions: {
    gap: theme.spacing.sm,
  },
  councilCard: {
    gap: theme.spacing.md,
  },
  councilName: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
  councilTopRow: {
    alignItems: 'flex-start',
    ...rtlRow,
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  deleteHint: {
    alignItems: 'center',
    ...rtlRow,
    gap: theme.spacing.xs,
    justifyContent: 'flex-end',
  },
  deleteHintText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  fieldBlock: {
    gap: theme.spacing.sm,
  },
  fieldLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  formStack: {
    gap: theme.spacing.md,
  },
  list: {
    gap: theme.spacing.sm,
  },
  screenContent: {
    flex: 1,
    paddingTop: theme.spacing.xxs,
  },
}));
