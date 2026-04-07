import { useRouter } from 'expo-router';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppCard } from '@/src/components/ui/app-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppScreen } from '@/src/components/ui/app-screen';
import { PageHeader } from '@/src/components/ui/page-header';
import { useActiveProfilesQuery } from '@/src/features/auth/hooks/use-active-profiles-query';
import {
  canCreateTrainings,
  isSuperAdmin,
} from '@/src/features/auth/lib/permissions';
import { useSettlementsQuery } from '@/src/features/settlements/hooks/use-settlements-query';
import { TrainingForm } from '@/src/features/trainings/components/training-form';
import { useCreateTrainingMutation } from '@/src/features/trainings/hooks/use-training-mutations';
import { toTrainingInsertInput } from '@/src/features/trainings/lib/training-form-utils';
import { useAuthStore } from '@/src/stores/auth-store';

export default function CreateTrainingScreen() {
  const profile = useAuthStore((state) => state.profile);
  const role = useAuthStore((state) => state.role);
  const router = useRouter();
  const mutation = useCreateTrainingMutation();
  const settlementsQuery = useSettlementsQuery();
  const shouldLoadProfiles = isSuperAdmin(role);
  const profilesQuery = useActiveProfilesQuery(shouldLoadProfiles);

  if (!canCreateTrainings(role)) {
    return (
      <AppScreen>
        <PageHeader
          eyebrow="אימונים"
          title="יצירת אימון"
          subtitle="המסך זמין למנהלי מערכת ולמדריכים בלבד."
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

  if (settlementsQuery.isLoading || (shouldLoadProfiles && profilesQuery.isLoading)) {
    return <AppLoader label="מכין את טופס האימון..." />;
  }

  if (
    settlementsQuery.error ||
    (shouldLoadProfiles && profilesQuery.error) ||
    (!shouldLoadProfiles && !profile)
  ) {
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
            (!profile ? 'לא הצלחנו לזהות את פרופיל המדריך המחובר.' : null) ??
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
        subtitle={
          isSuperAdmin(role)
            ? 'האימון יכול להיות משויך למספר יישובים, והמדריך הוא משתמש מערכת קיים.'
            : 'כמדריך, האימון החדש יישמר תחת המשתמש המחובר ויישויך ליישובים שתבחר.'
        }
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
          allowEmptyInstructor={isSuperAdmin(role)}
          initialValues={
            isSuperAdmin(role) || !profile
              ? undefined
              : {
                  instructor_id: profile.id,
                }
          }
          instructorOptions={
            isSuperAdmin(role)
              ? (profilesQuery.data ?? []).map((profileItem) => ({
                  full_name: profileItem.full_name,
                  id: profileItem.id,
                }))
              : profile
                ? [
                    {
                      full_name: profile.full_name,
                      id: profile.id,
                    },
                  ]
                : []
          }
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
            total_squad_members: settlement.total_squad_members,
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
