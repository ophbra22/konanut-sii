import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { AppLoader } from '@/src/components/feedback/app-loader';
import { StateCard } from '@/src/components/feedback/state-card';
import { AppCard } from '@/src/components/ui/app-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppScreen } from '@/src/components/ui/app-screen';
import { PageHeader } from '@/src/components/ui/page-header';
import { canManageProfessionalContent } from '@/src/features/auth/lib/permissions';
import { ProfessionalContentForm } from '@/src/features/professional-content/components/professional-content-form';
import {
  useDeleteProfessionalContentMutation,
  useUpdateProfessionalContentMutation,
} from '@/src/features/professional-content/hooks/use-professional-content-mutations';
import { useProfessionalContentDetailsQuery } from '@/src/features/professional-content/hooks/use-professional-content-query';
import {
  getProfessionalContentFormValues,
  toProfessionalContentUpdateInput,
} from '@/src/features/professional-content/lib/professional-content-form-utils';
import { useAuthStore } from '@/src/stores/auth-store';

export default function EditProfessionalContentScreen() {
  const { contentId } = useLocalSearchParams<{ contentId: string }>();
  const role = useAuthStore((state) => state.role);
  const router = useRouter();
  const updateMutation = useUpdateProfessionalContentMutation();
  const deleteMutation = useDeleteProfessionalContentMutation();
  const { data, error, isLoading } = useProfessionalContentDetailsQuery(
    contentId,
    true
  );

  if (isLoading) {
    return <AppLoader label="טוען את פרטי התוכן לעריכה..." />;
  }

  if (!canManageProfessionalContent(role)) {
    return (
      <AppScreen>
        <PageHeader
          eyebrow="תוכן מקצועי"
          title="עריכת פריט תוכן"
          subtitle="המסך זמין למנהלי מערכת ולמדריכים בלבד."
        />
        <StateCard
          actionLabel="חזרה לספרייה"
          description="לחשבון המחובר אין הרשאה לערוך תוכן מקצועי."
          onAction={() => {
            router.replace('/(app)/(tabs)/professional-content');
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
          eyebrow="תוכן מקצועי"
          title="עריכת פריט תוכן"
          subtitle="לא הצלחנו לטעון את הנתונים לעריכה."
        />
        <StateCard
          actionLabel="חזרה לספרייה"
          description={error?.message ?? 'לא נמצא פריט תוכן לעריכה.'}
          onAction={() => {
            router.replace('/(app)/(tabs)/professional-content');
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
        eyebrow="תוכן מקצועי"
        title={`עריכת ${data.title}`}
        subtitle="עדכון פרטי התוכן, הקישור והזמינות למשתמשים."
      />

      {updateMutation.error ? (
        <StateCard
          description={updateMutation.error.message}
          title="לא ניתן לשמור את השינויים"
          variant="warning"
        />
      ) : null}

      {deleteMutation.error ? (
        <StateCard
          description={deleteMutation.error.message}
          title="לא ניתן למחוק את פריט התוכן"
          variant="warning"
        />
      ) : null}

      <AppCard
        description="אפשר לעדכן את התוכן, להוציא אותו מפעילות או למחוק לצמיתות."
        title="עדכון תוכן"
      >
        <ProfessionalContentForm
          initialValues={getProfessionalContentFormValues(data)}
          isSubmitting={updateMutation.isPending}
          onSubmit={async (values) => {
            await updateMutation.mutateAsync({
              contentId: data.id,
              values: toProfessionalContentUpdateInput(values),
            });
            router.replace('/(app)/(tabs)/professional-content');
          }}
          submitLabel="שמירת שינויים"
        />
      </AppCard>

      <AppButton
        disabled={deleteMutation.isPending}
        label="מחיקת פריט תוכן"
        onPress={() => {
          Alert.alert(
            'מחיקת פריט תוכן',
            `האם למחוק את "${data.title}" לצמיתות?`,
            [
              {
                style: 'cancel',
                text: 'ביטול',
              },
              {
                style: 'destructive',
                text: 'מחיקה',
                onPress: () => {
                  deleteMutation.mutate(data.id, {
                    onSuccess: () => {
                      router.replace('/(app)/(tabs)/professional-content');
                    },
                  });
                },
              },
            ]
          );
        }}
        variant="danger"
      />

      <AppButton
        fullWidth={false}
        href="/(app)/(tabs)/professional-content"
        label="ביטול וחזרה"
        variant="ghost"
      />
    </AppScreen>
  );
}
