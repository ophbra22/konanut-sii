import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppBadge } from '@/src/components/ui/app-badge';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { DataRow } from '@/src/components/ui/data-row';
import { MetricCard } from '@/src/components/ui/metric-card';
import { AppScreen } from '@/src/components/ui/app-screen';
import { PageHeader } from '@/src/components/ui/page-header';
import { SectionBlock } from '@/src/components/ui/section-block';
import { isSuperAdmin } from '@/src/features/auth/lib/permissions';
import { getRankingTone } from '@/src/features/rankings/lib/ranking-presenters';
import { useDeleteSettlementMutation } from '@/src/features/settlements/hooks/use-settlement-mutations';
import { useSettlementDetailsQuery } from '@/src/features/settlements/hooks/use-settlements-query';
import { formatDisplayDate, formatDisplayTime } from '@/src/lib/date-utils';
import { useAuthStore } from '@/src/stores/auth-store';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

function getAlertTone(severity: 'high' | 'low' | 'medium') {
  switch (severity) {
    case 'high':
      return 'danger';
    case 'medium':
      return 'warning';
    default:
      return 'neutral';
  }
}

export default function SettlementDetailsScreen() {
  const { settlementId } = useLocalSearchParams<{ settlementId: string }>();
  const role = useAuthStore((state) => state.role);
  const router = useRouter();
  const deleteMutation = useDeleteSettlementMutation();
  const { data, error, isLoading, refetch } = useSettlementDetailsQuery(settlementId);

  if (isLoading) {
    return <AppLoader label="טוען את פרטי היישוב..." />;
  }

  if (error || !data) {
    return (
      <AppScreen>
        <PageHeader
          eyebrow="יישובים"
          title="פרטי יישוב"
          subtitle="לא הצלחנו להציג את הנתונים המבצעיים של היישוב."
        />
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

  const ranking = data.compliance;

  return (
    <AppScreen>
      <PageHeader
        eyebrow="יישובים"
        title={data.name}
        subtitle="מסך פירוט מבצעי הכולל אימונים, משובים, התראות ותמונת כשירות עבור היישוב."
      />

      <View style={styles.metricsGrid}>
        <MetricCard label="אימונים משויכים" value={String(data.trainings.length)} />
        <MetricCard label="משובים" value={String(data.feedbacks.length)} />
        <MetricCard
          label="ציון חציון"
          tone="accent"
          value={String(ranking.finalScore)}
        />
        <MetricCard label="התראות" tone="warning" value={String(data.alerts.length)} />
      </View>

      <AppCard description="נתוני הליבה של היישוב במערכת." title="פרטים כלליים">
        <DataRow label="אזור" value={data.area} />
        <DataRow
          label="מועצה אזורית"
          value={data.regional_council?.trim() || 'לא הוגדר'}
        />
        <DataRow
          label="רכז יישובי"
          value={data.coordinator_name?.trim() || 'לא הוגדר'}
        />
        <DataRow
          label="טלפון רכז"
          value={data.coordinator_phone?.trim() || 'לא הוגדר'}
        />
        <View style={styles.badges}>
          <AppBadge
            label={data.is_active ? 'יישוב פעיל' : 'יישוב לא פעיל'}
            tone={data.is_active ? 'accent' : 'warning'}
          />
        </View>
      </AppCard>

      <AppCard
        description="חישוב הכשירות מתבצע על בסיס החציון הנוכחי בלבד."
        title="סיכום דירוג וכשירות"
        variant="accent"
      >
        <View style={styles.badges}>
          <AppBadge
            label={ranking.rankingLevel}
            tone={getRankingTone(ranking.rankingLevel)}
          />
          <AppBadge
            label={`ציון סופי ${ranking.finalScore}`}
            tone="accent"
          />
        </View>
        <DataRow
          label="מטווח"
          value={ranking.shootingCompleted ? 'הושלם' : 'חסר'}
        />
        <DataRow
          label="הגנת יישוב"
          value={ranking.defenseCompleted ? 'הושלם' : 'חסר'}
        />
        <DataRow label="ממוצע משוב" value={String(ranking.averageRating ?? 0)} />
        <DataRow label="ניקוד אימונים" value={String(ranking.trainingScore)} />
        <DataRow label="ניקוד משובים" value={String(ranking.feedbackScore)} />
      </AppCard>

      {data.rankings.length ? (
        <AppCard
          description="רשומות שנשמרו בטבלת settlement_rankings."
          title="היסטוריית דירוגים"
        >
          <View style={styles.list}>
            {data.rankings.map((item) => (
              <AppCard
                key={item.id}
                description={`חושב ב-${formatDisplayDate(item.calculated_at)}`}
                style={styles.innerCard}
                title={item.half_year_period}
              >
                <View style={styles.badges}>
                  <AppBadge label={`ציון ${item.final_score}`} tone="accent" />
                  <AppBadge label={item.ranking_level} tone="neutral" />
                </View>
              </AppCard>
            ))}
          </View>
        </AppCard>
      ) : null}

      <SectionBlock
        description="אימונים המקושרים ליישוב, כולל קפיצה למסך האימון."
        title="אימונים קשורים"
      >
        {data.trainings.length ? (
          <View style={styles.list}>
            {data.trainings.map((training) => (
              <AppCard
                key={training.id}
                description={`${formatDisplayDate(training.training_date)} • ${formatDisplayTime(
                  training.training_time
                )}`}
                style={styles.innerCard}
                title={training.title}
              >
                <View style={styles.badges}>
                  <AppBadge label={training.training_type} tone="accent" />
                  <AppBadge label={training.status} tone="neutral" />
                </View>
                <DataRow label="מיקום" value={training.location?.trim() || 'לא הוגדר'} />
                <AppButton
                  fullWidth={false}
                  href={`/trainings/${training.id}`}
                  label="מעבר לאימון"
                  variant="secondary"
                />
              </AppCard>
            ))}
          </View>
        ) : (
          <StateCard
            description="עדיין לא שויכו אימונים ליישוב הזה."
            title="אין אימונים להצגה"
          />
        )}
      </SectionBlock>

      <SectionBlock
        description="משובים שנמסרו עבור אימוני היישוב."
        title="משובים"
      >
        {data.feedbacks.length ? (
          <View style={styles.list}>
            {data.feedbacks.map((feedback) => (
              <AppCard
                key={feedback.id}
                description={feedback.comment?.trim() || 'לא נכתב פירוט חופשי.'}
                style={styles.innerCard}
                title={feedback.training?.title || 'אימון לא זמין'}
              >
                <View style={styles.badges}>
                  <AppBadge label={`דירוג ${feedback.rating}/5`} tone="accent" />
                </View>
                <DataRow
                  label="מדריך"
                  value={feedback.instructor?.full_name || 'לא הוגדר'}
                />
                <DataRow
                  label="תאריך יצירה"
                  value={formatDisplayDate(feedback.created_at)}
                />
              </AppCard>
            ))}
          </View>
        ) : (
          <StateCard description="עדיין לא הוזנו משובים עבור היישוב." title="אין משובים" />
        )}
      </SectionBlock>

      <SectionBlock
        description="התראות פעילות והיסטוריות המקושרות ישירות ליישוב."
        title="התראות"
      >
        {data.alerts.length ? (
          <View style={styles.list}>
            {data.alerts.map((alertItem) => (
              <AppCard
                key={alertItem.id}
                description={alertItem.description?.trim() || 'ללא פירוט נוסף'}
                style={styles.innerCard}
                title={alertItem.title}
              >
                <View style={styles.badges}>
                  <AppBadge label={alertItem.type} tone="neutral" />
                  <AppBadge
                    label={alertItem.severity}
                    tone={getAlertTone(alertItem.severity)}
                  />
                  <AppBadge label={alertItem.status} tone="warning" />
                </View>
                <DataRow
                  label="תאריך פתיחה"
                  value={formatDisplayDate(alertItem.created_at)}
                />
              </AppCard>
            ))}
          </View>
        ) : (
          <StateCard description="לא קיימות התראות פעילות עבור היישוב." title="אין התראות" />
        )}
      </SectionBlock>

      <AppCard
        description="פעולות ניהול זמינות רק למנהל מערכת."
        title="פעולות"
      >
        <View style={styles.actions}>
          <AppButton
            fullWidth={false}
            href="/settlements"
            label="חזרה לרשימה"
            style={styles.actionButton}
            variant="ghost"
          />
          {isSuperAdmin(role) ? (
            <AppButton
              fullWidth={false}
              href={`/settlements/${data.id}/edit`}
              label="עריכת יישוב"
              style={styles.actionButton}
              variant="secondary"
            />
          ) : null}
          {isSuperAdmin(role) ? (
            <AppButton
              disabled={deleteMutation.isPending}
              fullWidth={false}
              label="מחיקת יישוב"
              onPress={() => {
                Alert.alert(
                  'מחיקת יישוב',
                  `האם למחוק את ${data.name}? הפעולה תמחק גם שיוכים, דירוגים ונתונים קשורים.`,
                  [
                    { style: 'cancel', text: 'ביטול' },
                    {
                      style: 'destructive',
                      text: 'מחיקה',
                      onPress: () => {
                        void deleteMutation
                          .mutateAsync(data.id)
                          .then(() => {
                            router.replace('/settlements');
                          });
                      },
                    },
                  ]
                );
              }}
              style={styles.actionButton}
              variant="danger"
            />
          ) : null}
          <AppButton
            fullWidth={false}
            label="רענון נתונים"
            onPress={() => {
              void refetch();
            }}
            style={styles.actionButton}
            variant="secondary"
          />
        </View>
      </AppCard>
    </AppScreen>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  actionButton: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  badges: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  innerCard: {
    padding: theme.spacing.md,
  },
  list: {
    gap: theme.spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
}));
