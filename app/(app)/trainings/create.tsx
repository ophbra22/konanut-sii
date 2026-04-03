import { useRouter } from 'expo-router';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppCard } from '@/src/components/ui/app-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppScreen } from '@/src/components/ui/app-screen';
import { PageHeader } from '@/src/components/ui/page-header';
import { isSuperAdmin } from '@/src/features/auth/lib/permissions';
import { useActiveProfilesQuery } from '@/src/features/auth/hooks/use-active-profiles-query';
import { useSettlementsQuery } from '@/src/features/settlements/hooks/use-settlements-query';
import { TrainingForm } from '@/src/features/trainings/components/training-form';
import { useCreateTrainingMutation } from '@/src/features/trainings/hooks/use-training-mutations';
import { toTrainingInsertInput } from '@/src/features/trainings/lib/training-form-utils';
import { useAuthStore } from '@/src/stores/auth-store';

export default function CreateTrainingScreen() {
  const role = useAuthStore((state) => state.role);
  const router = useRouter();
  const mutation = useCreateTrainingMutation();
  const settlementsQuery = useSettlementsQuery();
  const profilesQuery = useActiveProfilesQuery(isSuperAdmin(role));

  if (!isSuperAdmin(role)) {
    return (
      <AppScreen>
        <PageHeader
          eyebrow="אימונים"
          title="יצירת אימון"
          subtitle="המסך זמין רק למנהלי מערכת."
        />
        <StateCard
          actionLabel="חזרה לרשימת האימונים"
          description="לחשבון המחובר אין הרשאה ליצור אימון חדש."
          onAction={() => {
            router.replace('/(app)/(tabs)/trainings');
          }}
          title="אין הרשאה לפעולה"
          variant="warning"
        />
      </AppScreen>
    );
  }

  if (settlementsQuery.isLoading || profilesQuery.isLoading) {
    return <AppLoader label="מכין את טופס האימון..." />;
  }

  if (settlementsQuery.error || profilesQuery.error) {
    return (
      <AppScreen>
        <PageHeader
          eyebrow="אימונים"
          title="יצירת אימון"
          subtitle="לא הצלחנו לטעון את הנתונים הדרושים לטופס."
        />
        <StateCard
          actionLabel="חזרה לרשימה"
          description={
            settlementsQuery.error?.message ??
            profilesQuery.error?.message ??
            'אירעה שגיאה בטעינת הנתונים.'
          }
          onAction={() => {
            router.replace('/(app)/(tabs)/trainings');
          }}
          title="אי אפשר לפתוח את הטופס"
          variant="warning"
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <PageHeader
        eyebrow="אימונים"
        title="יצירת אימון חדש"
        subtitle="האימון יכול להיות משויך למספר יישובים, והמדריך הוא משתמש מערכת קיים."
      />

      {mutation.error ? (
        <StateCard
          description={mutation.error.message}
          title="לא ניתן ליצור את האימון"
          variant="warning"
        />
      ) : null}

      <AppCard description="הגדירו פרטי אימון, שיוך יישובים, מדריך וסטטוס." title="פרטי אימון">
        <TrainingForm
          instructorOptions={(profilesQuery.data ?? []).map((profile) => ({
            full_name: profile.full_name,
            id: profile.id,
          }))}
          isSubmitting={mutation.isPending}
          onSubmit={async (values) => {
            const created = await mutation.mutateAsync({
              settlementIds: values.settlement_ids,
              values: toTrainingInsertInput(values),
            });
            router.replace(`/trainings/${created.id}` as never);
          }}
          settlementOptions={(settlementsQuery.data ?? []).map((settlement) => ({
            area: settlement.area,
            id: settlement.id,
            name: settlement.name,
          }))}
          submitLabel="שמירת אימון"
        />
      </AppCard>

      <AppButton
        fullWidth={false}
        href="/(app)/(tabs)/trainings"
        label="ביטול וחזרה"
        variant="ghost"
      />
    </AppScreen>
  );
}
