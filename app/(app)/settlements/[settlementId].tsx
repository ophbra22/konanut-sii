import dayjs from 'dayjs';
import type { ComponentType } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Share,
  Text,
  View,
} from 'react-native';
import {
  Bell,
  CalendarDays,
  Check,
  CircleAlert,
  Gauge,
  MessageSquareText,
  Phone,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppBadge } from '@/src/components/ui/app-badge';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { AppRevealView } from '@/src/components/ui/app-reveal-view';
import { AppScreen } from '@/src/components/ui/app-screen';
import {
  canCreateFeedbacks,
  isSuperAdmin,
} from '@/src/features/auth/lib/permissions';
import { getRankingTone } from '@/src/features/rankings/lib/ranking-presenters';
import { useDeleteSettlementMutation } from '@/src/features/settlements/hooks/use-settlement-mutations';
import { useSettlementDetailsQuery } from '@/src/features/settlements/hooks/use-settlements-query';
import { formatDisplayDate, formatDisplayTime } from '@/src/lib/date-utils';
import { useAuthStore } from '@/src/stores/auth-store';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type CompactKpiItemProps = {
  icon: ComponentType<{ color: string; size: number; strokeWidth?: number }>;
  label: string;
  value: string;
};

type SettlementStatusIndicatorProps = {
  completed: boolean;
  label: string;
};

type ActivityItemProps = {
  description: string;
  meta: string;
  tone: 'danger' | 'neutral' | 'warning';
  title: string;
};

function getAlertTone(severity: 'high' | 'low' | 'medium') {
  switch (severity) {
    case 'high':
      return 'danger' as const;
    case 'medium':
      return 'warning' as const;
    default:
      return 'neutral' as const;
  }
}

function getOperationalStatusPresentation(params: {
  defenseCompleted: boolean;
  hasOpenAlerts: boolean;
  isActive: boolean;
  shootingCompleted: boolean;
}) {
  if (!params.isActive) {
    return {
      label: 'לא פעיל',
      tone: 'warning' as const,
    };
  }

  if (
    !params.shootingCompleted ||
    !params.defenseCompleted ||
    params.hasOpenAlerts
  ) {
    return {
      label: 'דורש טיפול',
      tone: 'warning' as const,
    };
  }

  return {
    label: 'פעיל',
    tone: 'success' as const,
  };
}

function getCoordinatorLine(name: string | null, phone: string | null) {
  const parts = [name?.trim(), phone?.trim()].filter(Boolean);

  return parts.join(' • ');
}

function getSettlementsLabel(settlementNames: string[], currentSettlementName: string) {
  if (!settlementNames.length) {
    return currentSettlementName;
  }

  if (settlementNames.length <= 2) {
    return settlementNames.join(' • ');
  }

  return `${settlementNames[0]} + ${settlementNames.length - 1} נוספים`;
}

function CompactKpiItem({ icon: Icon, label, value }: CompactKpiItemProps) {
  return (
    <View style={styles.kpiItem}>
      <View style={styles.kpiIcon}>
        <Icon color={theme.colors.textSecondary} size={15} strokeWidth={2.1} />
      </View>
      <Text numberOfLines={1} style={styles.kpiValue}>
        {value}
      </Text>
      <Text numberOfLines={1} style={styles.kpiLabel}>
        {label}
      </Text>
    </View>
  );
}

function SettlementStatusIndicator({
  completed,
  label,
}: SettlementStatusIndicatorProps) {
  return (
    <View style={styles.statusIndicatorRow}>
      <View style={styles.statusIndicatorTextBlock}>
        <Text
          style={[
            styles.statusIndicatorValue,
            completed ? styles.statusIndicatorValueSuccess : styles.statusIndicatorValueMissing,
          ]}
        >
          {completed ? 'בוצע' : 'חסר'}
        </Text>
        <Text style={styles.statusIndicatorLabel}>{label}</Text>
      </View>

      <View
        style={[
          styles.statusIndicatorIcon,
          completed ? styles.statusIndicatorIconSuccess : styles.statusIndicatorIconMissing,
        ]}
      >
        {completed ? (
          <Check color={theme.colors.success} size={15} strokeWidth={2.4} />
        ) : (
          <X color={theme.colors.danger} size={15} strokeWidth={2.4} />
        )}
      </View>
    </View>
  );
}

function ActivityItem({ description, meta, tone, title }: ActivityItemProps) {
  return (
    <View style={styles.activityItem}>
      <View style={styles.activityHeader}>
        <AppBadge
          label={tone === 'danger' ? 'חריג' : tone === 'warning' ? 'פתוח' : 'עדכון'}
          size="sm"
          tone={tone}
        />
        <Text numberOfLines={1} style={styles.activityTitle}>
          {title}
        </Text>
      </View>

      <Text numberOfLines={2} style={styles.activityDescription}>
        {description}
      </Text>
      <Text numberOfLines={1} style={styles.activityMeta}>
        {meta}
      </Text>
    </View>
  );
}

export default function SettlementDetailsScreen() {
  const { settlementId } = useLocalSearchParams<{ settlementId: string }>();
  const role = useAuthStore((state) => state.role);
  const router = useRouter();
  const deleteMutation = useDeleteSettlementMutation();
  const { data, error, isLoading } = useSettlementDetailsQuery(settlementId);

  if (isLoading) {
    return <AppLoader label="טוען את פרטי היישוב..." />;
  }

  if (error || !data) {
    return (
      <AppScreen>
        <StateCard
          actionLabel="חזרה לרשימת היישובים"
          description={error?.message ?? 'היישוב המבוקש אינו זמין לחשבון המחובר.'}
          onAction={() => {
            router.replace('/settlements');
          }}
          title="היישוב לא זמין"
          variant="warning"
        />
      </AppScreen>
    );
  }

  const settlement = data;
  const ranking = settlement.compliance;
  const canEditSettlement = isSuperAdmin(role);
  const canAddFeedback = canCreateFeedbacks(role);
  const openAlerts = settlement.alerts.filter(
    (alertItem) => alertItem.status !== 'resolved'
  );
  const headerStatus = getOperationalStatusPresentation({
    defenseCompleted: ranking.defenseCompleted,
    hasOpenAlerts: openAlerts.length > 0,
    isActive: settlement.is_active,
    shootingCompleted: ranking.shootingCompleted,
  });
  const headerMeta = [settlement.regional_council?.trim(), settlement.area.trim()]
    .filter(Boolean)
    .join(' • ');
  const coordinatorLine = getCoordinatorLine(
    settlement.coordinator_name,
    settlement.coordinator_phone
  );
  const now = dayjs();
  const sortedTrainings = [...settlement.trainings].sort((left, right) =>
    `${left.training_date}${left.training_time ?? ''}`.localeCompare(
      `${right.training_date}${right.training_time ?? ''}`
    )
  );
  const nextTraining =
    sortedTrainings.find((training) => {
      if (training.status === 'בוטל') {
        return false;
      }

      const trainingMoment = dayjs(
        `${training.training_date}T${training.training_time ?? '00:00'}`
      );

      return trainingMoment.isAfter(now) || trainingMoment.isSame(now, 'day');
    }) ?? null;
  const latestCompletedTraining = [...settlement.trainings]
    .sort((left, right) =>
      `${right.training_date}${right.training_time ?? ''}`.localeCompare(
        `${left.training_date}${left.training_time ?? ''}`
      )
    )
    .find((training) => training.status === 'הושלם');
  const feedbackTargetTraining =
    latestCompletedTraining ?? nextTraining ?? sortedTrainings[0] ?? null;
  const latestFeedbacks = settlement.feedbacks.slice(0, 3);
  const latestAlerts = settlement.alerts.slice(0, 3);

  async function handleShareReport() {
    const reportMessage = [
      `יישוב: ${settlement.name}`,
      `מועצה: ${settlement.regional_council?.trim() || 'לא הוגדר'}`,
      `פלגה: ${settlement.area}`,
      `סטטוס: ${headerStatus.label}`,
      `ציון כללי: ${ranking.finalScore}`,
      `מטווח: ${ranking.shootingCompleted ? 'בוצע' : 'חסר'}`,
      `הגנת יישוב: ${ranking.defenseCompleted ? 'בוצעה' : 'חסרה'}`,
      `אימונים: ${settlement.trainings.length}`,
      `משובים: ${settlement.feedbacks.length}`,
      `התראות: ${settlement.alerts.length}`,
    ].join('\n');

    try {
      await Share.share({
        message: reportMessage,
        title: `דוח יישוב - ${settlement.name}`,
      });
    } catch {
      Alert.alert('הפקת דוח לא זמינה', 'לא הצלחנו לפתוח את חלונית השיתוף כרגע.');
    }
  }

  return (
    <AppScreen contentContainerStyle={styles.screenContent}>
      <AppRevealView delay={20}>
        <AppCard style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <AppBadge label={headerStatus.label} tone={headerStatus.tone} />
            <View style={styles.headerTitleBlock}>
              <Text style={styles.headerEyebrow}>תמונת מצב יישובית</Text>
              <Text style={styles.headerTitle}>{settlement.name}</Text>
            </View>
          </View>

          {headerMeta ? <Text style={styles.headerMeta}>{headerMeta}</Text> : null}

          {coordinatorLine ? (
            <View style={styles.headerSupportRow}>
              {settlement.coordinator_phone?.trim() ? (
                <View style={styles.headerSupportItem}>
                  <Phone color={theme.colors.textMuted} size={13} strokeWidth={2.1} />
                  <Text style={styles.headerSupportText}>{settlement.coordinator_phone.trim()}</Text>
                </View>
              ) : null}

              {settlement.coordinator_name?.trim() ? (
                <View style={styles.headerSupportItem}>
                  <Users color={theme.colors.textMuted} size={13} strokeWidth={2.1} />
                  <Text style={styles.headerSupportText}>{settlement.coordinator_name.trim()}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </AppCard>
      </AppRevealView>

      <AppRevealView delay={40}>
        <AppCard style={styles.kpiStrip}>
          <CompactKpiItem
            icon={CalendarDays}
            label="אימונים"
            value={String(settlement.trainings.length)}
          />
          <CompactKpiItem
            icon={Gauge}
            label="ציון אימון"
            value={String(ranking.finalScore)}
          />
          <CompactKpiItem
            icon={MessageSquareText}
            label="משובים"
            value={String(settlement.feedbacks.length)}
          />
          <CompactKpiItem
            icon={Bell}
            label="התראות"
            value={String(settlement.alerts.length)}
          />
        </AppCard>
      </AppRevealView>

      <AppRevealView delay={60}>
        <AppCard style={styles.statusCard}>
          <View style={styles.statusCardTopRow}>
            <View style={styles.statusScoreBlock}>
              <Text
                style={[
                  styles.statusScoreValue,
                  ranking.finalScore >= 80
                    ? styles.statusScoreValueSuccess
                    : ranking.finalScore >= 60
                      ? styles.statusScoreValueWarning
                      : styles.statusScoreValueDanger,
                ]}
              >
                {ranking.finalScore}
              </Text>
              <Text style={styles.statusScoreLabel}>ציון כללי</Text>
            </View>

            <View style={styles.statusContent}>
              <View style={styles.statusTitleRow}>
                <AppBadge
                  label={ranking.rankingLevel}
                  size="sm"
                  tone={getRankingTone(ranking.rankingLevel)}
                />
                <Text style={styles.statusTitle}>סטטוס יישוב</Text>
              </View>

              <SettlementStatusIndicator
                completed={ranking.shootingCompleted}
                label="מטווח"
              />
              <SettlementStatusIndicator
                completed={ranking.defenseCompleted}
                label="הגנת יישוב"
              />
            </View>
          </View>
        </AppCard>
      </AppRevealView>

      <AppRevealView delay={80}>
        <AppCard style={styles.nextTrainingCard}>
          <View style={styles.sectionTitleRow}>
            <CalendarDays color={theme.colors.textSecondary} size={16} strokeWidth={2.1} />
            <Text style={styles.sectionTitle}>האימון הבא</Text>
          </View>

          {nextTraining ? (
            <>
              <Text style={styles.nextTrainingTitle}>{nextTraining.title}</Text>
              <Text style={styles.nextTrainingMeta}>
                {formatDisplayDate(nextTraining.training_date)} •{' '}
                {formatDisplayTime(nextTraining.training_time)}
              </Text>
              <Text style={styles.nextTrainingDescription}>
                משתתפים: {getSettlementsLabel(
                  nextTraining.settlements.map((settlement) => settlement.name),
                  settlement.name
                )}
              </Text>

              <View style={styles.nextTrainingActions}>
                <AppButton
                  fullWidth={false}
                  href={{
                    params: { trainingId: nextTraining.id },
                    pathname: '/(app)/trainings/[trainingId]',
                  }}
                  label="מעבר לאימון"
                  size="sm"
                  variant="primary"
                />
              </View>
            </>
          ) : (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyTitle}>אין אימון קרוב</Text>
              <Text style={styles.emptyText}>
                כרגע לא נמצא אימון עתידי שמשויך ליישוב הזה.
              </Text>
            </View>
          )}
        </AppCard>
      </AppRevealView>

      <AppRevealView delay={100}>
        <AppCard style={styles.activityCard}>
          <View style={styles.sectionTitleRow}>
            <CircleAlert color={theme.colors.textSecondary} size={16} strokeWidth={2.1} />
            <Text style={styles.sectionTitle}>עדכונים אחרונים</Text>
          </View>

          {latestFeedbacks.length || latestAlerts.length ? (
            <View style={styles.activityContent}>
              {latestFeedbacks.length ? (
                <View style={styles.activityGroup}>
                  <Text style={styles.activityGroupTitle}>משובים אחרונים</Text>
                  <View style={styles.activityList}>
                    {latestFeedbacks.map((feedback) => (
                      <ActivityItem
                        key={feedback.id}
                        description={
                          feedback.comment?.trim() || 'לא נוספה הערת מדריך מפורטת.'
                        }
                        meta={`${formatDisplayDate(feedback.created_at)} • ${
                          feedback.instructor?.full_name || 'ללא מדריך'
                        }`}
                        title={feedback.training?.title || 'אימון לא זמין'}
                        tone="neutral"
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {latestFeedbacks.length && latestAlerts.length ? (
                <View style={styles.activityDivider} />
              ) : null}

              {latestAlerts.length ? (
                <View style={styles.activityGroup}>
                  <Text style={styles.activityGroupTitle}>התראות</Text>
                  <View style={styles.activityList}>
                    {latestAlerts.map((alertItem) => (
                      <ActivityItem
                        key={alertItem.id}
                        description={alertItem.description?.trim() || 'ללא פירוט נוסף'}
                        meta={`${formatDisplayDate(alertItem.created_at)} • ${alertItem.type}`}
                        title={alertItem.title}
                        tone={getAlertTone(alertItem.severity)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyTitle}>אין עדכונים להצגה</Text>
              <Text style={styles.emptyText}>
                לא נשמרו עדיין משובים או התראות עבור היישוב הזה.
              </Text>
            </View>
          )}
        </AppCard>
      </AppRevealView>

      <AppRevealView delay={120}>
        <AppCard style={styles.actionsCard}>
          <View style={styles.sectionTitleRow}>
            <ShieldCheck color={theme.colors.textSecondary} size={16} strokeWidth={2.1} />
            <Text style={styles.sectionTitle}>פעולות</Text>
          </View>

          <View style={styles.primaryActionRow}>
            <AppButton
              disabled={!canAddFeedback || !feedbackTargetTraining}
              fullWidth={false}
              href={
                feedbackTargetTraining
                  ? {
                      params: {
                        openFeedback: '1',
                        trainingId: feedbackTargetTraining.id,
                      },
                      pathname: '/(app)/trainings/[trainingId]',
                    }
                  : undefined
              }
              label="הוסף משוב"
              size="sm"
              style={styles.actionButton}
              variant="primary"
            />
          </View>

          <View style={styles.secondaryActionsRow}>
            {canEditSettlement ? (
              <AppButton
                fullWidth={false}
                href={{
                  params: { settlementId: settlement.id },
                  pathname: '/(app)/settlements/[settlementId]/edit',
                }}
                label="עריכת יישוב"
                size="sm"
                style={styles.actionButton}
                variant="secondary"
              />
            ) : null}

            <AppButton
              fullWidth={false}
              label="הפקת דוח"
              onPress={() => {
                void handleShareReport();
              }}
              size="sm"
              style={styles.actionButton}
              variant="secondary"
            />
          </View>

          {deleteMutation.error ? (
            <StateCard
              description={deleteMutation.error.message}
              title="לא ניתן למחוק את היישוב"
              variant="warning"
            />
          ) : null}

          {canEditSettlement ? (
            <View style={styles.dangerZone}>
              <AppButton
                disabled={deleteMutation.isPending}
                fullWidth={false}
                label="מחיקת יישוב"
                loading={deleteMutation.isPending}
                onPress={() => {
                  Alert.alert(
                    'מחיקת יישוב',
                    `האם למחוק את ${settlement.name}? הפעולה תמחק גם שיוכים, דירוגים ונתונים קשורים.`,
                    [
                      { style: 'cancel', text: 'ביטול' },
                      {
                        style: 'destructive',
                        text: 'מחיקה',
                        onPress: () => {
                          void deleteMutation.mutateAsync(settlement.id).then(() => {
                            router.replace('/settlements');
                          });
                        },
                      },
                    ]
                  );
                }}
                size="sm"
                style={styles.dangerButton}
                variant="danger"
              />
            </View>
          ) : null}
        </AppCard>
      </AppRevealView>
    </AppScreen>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  actionButton: {
    flex: 1,
  },
  actionsCard: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  activityCard: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  activityContent: {
    gap: theme.spacing.md,
  },
  activityDescription: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    textAlign: 'right',
  },
  activityDivider: {
    backgroundColor: theme.colors.separator,
    height: 1,
  },
  activityGroup: {
    gap: theme.spacing.sm,
  },
  activityGroupTitle: {
    ...theme.typography.meta,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  activityHeader: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
    justifyContent: 'space-between',
  },
  activityItem: {
    gap: 6,
  },
  activityList: {
    gap: theme.spacing.sm,
  },
  activityMeta: {
    ...theme.typography.badge,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  activityTitle: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 15,
    textAlign: 'right',
  },
  dangerButton: {
    width: '100%',
  },
  dangerZone: {
    borderTopColor: theme.colors.separator,
    borderTopWidth: 1,
    paddingTop: theme.spacing.md,
  },
  emptyBlock: {
    alignItems: 'flex-end',
    gap: 6,
  },
  emptyText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    lineHeight: 18,
    textAlign: 'right',
  },
  emptyTitle: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    fontSize: 15,
    textAlign: 'right',
  },
  headerCard: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  headerEyebrow: {
    ...theme.typography.badge,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  headerMeta: {
    ...theme.typography.meta,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  headerSupportItem: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 6,
  },
  headerSupportRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  headerSupportText: {
    ...theme.typography.badge,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  headerTitle: {
    ...theme.typography.screenTitle,
    color: theme.colors.textPrimary,
    fontSize: 28,
    lineHeight: 32,
    textAlign: 'right',
  },
  headerTitleBlock: {
    alignItems: 'flex-end',
    flex: 1,
    gap: 2,
  },
  headerTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  kpiIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.glassSurface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  kpiItem: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  kpiLabel: {
    ...theme.typography.badge,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  kpiStrip: {
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
  },
  kpiValue: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24,
    textAlign: 'center',
  },
  nextTrainingActions: {
    alignItems: 'flex-start',
    marginTop: theme.spacing.xs,
  },
  nextTrainingCard: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  nextTrainingDescription: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    textAlign: 'right',
  },
  nextTrainingMeta: {
    ...theme.typography.meta,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  nextTrainingTitle: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    fontSize: 18,
    textAlign: 'right',
  },
  primaryActionRow: {
    width: '100%',
  },
  screenContent: {
    gap: theme.spacing.section,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.xs,
  },
  secondaryActionsRow: {
    flexDirection: 'row-reverse',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    fontSize: 17,
    textAlign: 'right',
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
  },
  statusCard: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  statusCardTopRow: {
    flexDirection: 'row-reverse',
    gap: theme.spacing.md,
  },
  statusContent: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  statusIndicatorIcon: {
    alignItems: 'center',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  statusIndicatorIconMissing: {
    backgroundColor: theme.colors.dangerSurface,
    borderColor: theme.colors.dangerBorder,
  },
  statusIndicatorIconSuccess: {
    backgroundColor: theme.colors.successSurface,
    borderColor: theme.colors.accentBorder,
  },
  statusIndicatorLabel: {
    ...theme.typography.meta,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  statusIndicatorRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  statusIndicatorTextBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  statusIndicatorValue: {
    ...theme.typography.caption,
    fontWeight: '800',
    textAlign: 'right',
  },
  statusIndicatorValueMissing: {
    color: theme.colors.danger,
  },
  statusIndicatorValueSuccess: {
    color: theme.colors.success,
  },
  statusScoreBlock: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: theme.colors.glassSurface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 108,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  statusScoreLabel: {
    ...theme.typography.badge,
    color: theme.colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  statusScoreValue: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 36,
    textAlign: 'center',
  },
  statusScoreValueDanger: {
    color: theme.colors.danger,
  },
  statusScoreValueSuccess: {
    color: theme.colors.success,
  },
  statusScoreValueWarning: {
    color: theme.colors.warning,
  },
  statusTitle: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    fontSize: 18,
    textAlign: 'right',
  },
  statusTitleRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: theme.spacing.xs,
    justifyContent: 'space-between',
    marginBottom: 2,
  },
}));
