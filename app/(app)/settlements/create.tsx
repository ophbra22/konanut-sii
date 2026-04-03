import { useRouter } from 'expo-router';

import { StateCard } from '@/src/components/feedback/state-card';
import { AppCard } from '@/src/components/ui/app-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppScreen } from '@/src/components/ui/app-screen';
import { PageHeader } from '@/src/components/ui/page-header';
import { SettlementForm } from '@/src/features/settlements/components/settlement-form';
import { useCreateSettlementMutation } from '@/src/features/settlements/hooks/use-settlement-mutations';
import { isSuperAdmin } from '@/src/features/auth/lib/permissions';
import { toSettlementInsertInput } from '@/src/features/settlements/lib/settlement-form-utils';
import { useAuthStore } from '@/src/stores/auth-store';

export default function CreateSettlementScreen() {
  const role = useAuthStore((state) => state.role);
  const router = useRouter();
  const mutation = useCreateSettlementMutation();

  if (!isSuperAdmin(role)) {
    return (
      <AppScreen>
        <PageHeader
          eyebrow="ניהול יישובים"
          title="יצירת יישוב"
          subtitle="המסך זמין רק למנהלי מערכת."
        />
        <StateCard
          actionLabel="חזרה לרשימת היישובים"
          description="לחשבון המחובר אין הרשאה ליצור יישובים חדשים."
          onAction={() => {
            router.replace('/(app)/(tabs)/settlements');
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
        eyebrow="ניהול יישובים"
        title="יצירת יישוב חדש"
        subtitle="היישוב הוא יחידת הכוננות המרכזית במערכת, ולכן כל הרשומות המבצעיות והדירוגיות נשענות עליו."
      />

      {mutation.error ? (
        <StateCard
          description={mutation.error.message}
          title="לא ניתן ליצור את היישוב"
          variant="warning"
        />
      ) : null}

      <AppCard
        description="מלאו את פרטי היישוב, הרכז והסטטוס המבצעי הראשוני."
        title="פרטי יישוב"
      >
        <SettlementForm
          isSubmitting={mutation.isPending}
          onSubmit={async (values) => {
            const created = await mutation.mutateAsync(toSettlementInsertInput(values));
            router.replace(`/settlements/${created.id}` as never);
          }}
          submitLabel="שמירת יישוב"
        />
      </AppCard>

      <AppButton
        fullWidth={false}
        href="/(app)/(tabs)/settlements"
        label="ביטול וחזרה"
        variant="ghost"
      />
    </AppScreen>
  );
}
