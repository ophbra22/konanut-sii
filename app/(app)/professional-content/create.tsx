import { useRouter } from 'expo-router';

import { StateCard } from '@/src/components/feedback/state-card';
import { AppCard } from '@/src/components/ui/app-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppScreen } from '@/src/components/ui/app-screen';
import { PageHeader } from '@/src/components/ui/page-header';
import { canManageProfessionalContent } from '@/src/features/auth/lib/permissions';
import { ProfessionalContentForm } from '@/src/features/professional-content/components/professional-content-form';
import { useCreateProfessionalContentMutation } from '@/src/features/professional-content/hooks/use-professional-content-mutations';
import { toProfessionalContentInsertInput } from '@/src/features/professional-content/lib/professional-content-form-utils';
import { useAuthStore } from '@/src/stores/auth-store';

export default function CreateProfessionalContentScreen() {
  const role = useAuthStore((state) => state.role);
  const router = useRouter();
  const mutation = useCreateProfessionalContentMutation();

  if (!canManageProfessionalContent(role)) {
    return (
      <AppScreen>
        <PageHeader
          eyebrow="תוכן מקצועי"
          title="יצירת פריט תוכן"
          subtitle="המסך זמין למנהלי מערכת ולמדריכים בלבד."
        />
        <StateCard
          actionLabel="חזרה לספרייה"
          description="לחשבון המחובר אין הרשאה ליצור תוכן מקצועי חדש."
          onAction={() => {
            router.replace('/(app)/(tabs)/professional-content');
          }}
          title="אין הרשאה לפעולה"
          variant="warning"
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <PageHeader
        eyebrow="תוכן מקצועי"
        title="הוספת תוכן מקצועי"
        subtitle="הוספת סרטון, מצגת או מסמך מקצועי לספריית הידע המבצעית."
      />

      {mutation.error ? (
        <StateCard
          description={mutation.error.message}
          title="לא ניתן ליצור את פריט התוכן"
          variant="warning"
        />
      ) : null}

      <AppCard
        description="מלאו כותרת, סוג תוכן וקישור זמין לכלל המשתמשים."
        title="פרטי תוכן"
      >
        <ProfessionalContentForm
          isSubmitting={mutation.isPending}
          onSubmit={async (values) => {
            await mutation.mutateAsync(toProfessionalContentInsertInput(values));
            router.replace('/(app)/(tabs)/professional-content');
          }}
          submitLabel="שמירת תוכן"
        />
      </AppCard>

      <AppButton
        fullWidth={false}
        href="/(app)/(tabs)/professional-content"
        label="ביטול וחזרה"
        variant="ghost"
      />
    </AppScreen>
  );
}
