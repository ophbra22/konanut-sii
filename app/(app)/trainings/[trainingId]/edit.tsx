import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppCard } from '@/src/components/ui/app-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppScreen } from '@/src/components/ui/app-screen';
import { PageHeader } from '@/src/components/ui/page-header';
import {
  canManageTrainings,
  isSuperAdmin,
} from '@/src/features/auth/lib/permissions';
import { useActiveProfilesQuery } from '@/src/features/auth/hooks/use-active-profiles-query';
import { useSettlementsQuery } from '@/src/features/settlements/hooks/use-settlements-query';
import { TrainingForm } from '@/src/features/trainings/components/training-form';
import { useUpdateTrainingMutation } from '@/src/features/trainings/hooks/use-training-mutations';
import { useTrainingDetailsQuery } from '@/src/features/trainings/hooks/use-trainings-query';
import {
  getTrainingFormValues,
  toTrainingUpdateInput,
} from '@/src/features/trainings/lib/training-form-utils';
import { useAuthStore } from '@/src/stores/auth-store';

export default function EditTrainingScreen() {
  const { trainingId } = useLocalSearchParams<{ trainingId: string }>();
  const role = useAuthStore((state) => state.role);
  const router = useRouter();
  const mutation = useUpdateTrainingMutation();
  const detailsQuery = useTrainingDetailsQuery(trainingId);
  const settlementsQuery = useSettlementsQuery();
  const canChooseInstructor = isSuperAdmin(role);
  const profilesQuery = useActiveProfilesQuery(canChooseInstructor);

  if (
    detailsQuery.isLoading ||
    settlementsQuery.isLoading ||
    profilesQuery.isLoading
  ) {
    return <AppLoader label="טוען את נתוני האימון לעריכה..." />;
  }

  if (!canManageTrainings(role)) {
    return (
      <AppScreen>
        <PageHeader
          eyebrow="אימונים"
          title="עריכת אימון"
          subtitle="המסך זמין למנהלי מערכת ולמדריכים."
        />
        <StateCard
          actionLabel="חזרה לפרטי האימון"
          description="לחשבון המחובר אין הרשאה לערוך אימונים."
          onAction={() => {
            router.replace(`/trainings/${trainingId}` as never);
          }}
          title="אין הרשאה לפעולה"
          variant="warning"
        />
      </AppScreen>
    );
  }

  if (
    detailsQuery.error ||
    settlementsQuery.error ||
    profilesQuery.error ||
    !detailsQuery.data
  ) {
    return (
      <AppScreen>
        <PageHeader
          eyebrow="אימונים"
          title="עריכת אימון"
          subtitle="לא הצלחנו לטעון את הנתונים לעריכה."
        />
        <StateCard
          actionLabel="חזרה לרשימת האימונים"
          description={
            detailsQuery.error?.message ??
            settlementsQuery.error?.message ??
            profilesQuery.error?.message ??
            'לא נמצא אימון לעריכה.'
          }
          onAction={() => {
            router.replace('/(app)/(tabs)/trainings');
          }}
          title="אי אפשר לערוך כרגע"
          variant="warning"
        />
      </AppScreen>
    );
  }

  const training = detailsQuery.data;

  return (
    <AppScreen>
      <PageHeader
        eyebrow="אימונים"
        title={`עריכת ${training.title}`}
        subtitle="עדכון פרטי האימון, היישובים המשתתפים והסטטוס התפעולי."
      />

      {mutation.error ? (
        <StateCard
          description={mutation.error.message}
          title="לא ניתן לשמור את השינויים"
          variant="warning"
        />
      ) : null}

      <AppCard title="עדכון אימון" description="השינויים נשמרים ישירות ב-Supabase ומשפיעים על הדשבורד והדירוגים.">
        <TrainingForm
          initialValues={getTrainingFormValues(training)}
          instructorOptions={
            canChooseInstructor
              ? (profilesQuery.data ?? []).map((profile) => ({
                  full_name: profile.full_name,
                  id: profile.id,
                }))
              : training.instructor
                ? [
                    {
                      full_name: training.instructor.full_name,
                      id: training.instructor.id,
                    },
                  ]
                : []
          }
          isSubmitting={mutation.isPending}
          onSubmit={async (values) => {
            await mutation.mutateAsync({
              settlementIds: values.settlement_ids,
              trainingId: training.id,
              values: toTrainingUpdateInput(values),
            });
            router.replace(`/trainings/${training.id}` as never);
          }}
          settlementOptions={(settlementsQuery.data ?? []).map((settlement) => ({
            area: settlement.area,
            id: settlement.id,
            name: settlement.name,
            total_squad_members: settlement.total_squad_members,
          }))}
          submitLabel="שמירת שינויים"
        />
      </AppCard>

      <AppButton
        fullWidth={false}
        href={{
          params: { trainingId: training.id },
          pathname: '/(app)/trainings/[trainingId]',
        }}
        label="ביטול וחזרה"
        variant="ghost"
      />
    </AppScreen>
  );
}
