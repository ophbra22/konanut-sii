import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppCard } from '@/src/components/ui/app-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppScreen } from '@/src/components/ui/app-screen';
import { PageHeader } from '@/src/components/ui/page-header';
import { isSuperAdmin } from '@/src/features/auth/lib/permissions';
import { SettlementForm } from '@/src/features/settlements/components/settlement-form';
import { useUpdateSettlementMutation } from '@/src/features/settlements/hooks/use-settlement-mutations';
import { useSettlementDetailsQuery } from '@/src/features/settlements/hooks/use-settlements-query';
import {
  getSettlementFormValues,
  toSettlementUpdateInput,
} from '@/src/features/settlements/lib/settlement-form-utils';
import { useAuthStore } from '@/src/stores/auth-store';

export default function EditSettlementScreen() {
  const { settlementId } = useLocalSearchParams<{ settlementId: string }>();
  const role = useAuthStore((state) => state.role);
  const router = useRouter();
  const mutation = useUpdateSettlementMutation();
  const { data, error, isLoading } = useSettlementDetailsQuery(settlementId);

  if (isLoading) {
    return <AppLoader label="טוען את פרטי היישוב לעריכה..." />;
  }

  if (!isSuperAdmin(role)) {
    return (
      <AppScreen>
        <PageHeader
          eyebrow="ניהול יישובים"
          title="עריכת יישוב"
          subtitle="המסך זמין רק למנהלי מערכת."
        />
        <StateCard
          actionLabel="חזרה לפרטי היישוב"
          description="לחשבון המחובר אין הרשאה לערוך יישובים."
          onAction={() => {
            router.replace(`/settlements/${settlementId}` as never);
          }}
          title="אין הרשאה לפעולה"
          variant="warning"
        />
      </AppScreen>
    );
  }

  if (error || !data) {
    return (
      <AppScreen>
        <PageHeader
          eyebrow="ניהול יישובים"
          title="עריכת יישוב"
          subtitle="לא הצלחנו לטעון את הנתונים לעריכה."
        />
        <StateCard
          actionLabel="חזרה לרשימת היישובים"
          description={error?.message ?? 'לא נמצא יישוב לעריכה.'}
          onAction={() => {
            router.replace('/(app)/(tabs)/settlements');
          }}
          title="אי אפשר לערוך כרגע"
          variant="warning"
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <PageHeader
        eyebrow="ניהול יישובים"
        title={`עריכת ${data.name}`}
        subtitle="עדכון פרטי היישוב, הרכז והסטטוס המבצעי."
      />

      {mutation.error ? (
        <StateCard
          description={mutation.error.message}
          title="לא ניתן לשמור את השינויים"
          variant="warning"
        />
      ) : null}

      <AppCard description="השינויים ישפיעו מיידית על מסכי הדשבורד והדירוגים." title="עדכון יישוב">
        <SettlementForm
          initialValues={getSettlementFormValues(data)}
          isSubmitting={mutation.isPending}
          onSubmit={async (values) => {
            await mutation.mutateAsync({
              settlementId: data.id,
              values: toSettlementUpdateInput(values),
            });
            router.replace(`/settlements/${data.id}` as never);
          }}
          submitLabel="שמירת שינויים"
        />
      </AppCard>

      <AppButton
        fullWidth={false}
        href={{
          params: { settlementId: data.id },
          pathname: '/(app)/settlements/[settlementId]',
        }}
        label="ביטול וחזרה"
        variant="ghost"
      />
    </AppScreen>
  );
}
