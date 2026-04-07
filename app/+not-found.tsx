import { AppCard } from '@/src/components/ui/app-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppScreen } from '@/src/components/ui/app-screen';
import { PageHeader } from '@/src/components/ui/page-header';

export default function NotFoundScreen() {
  return (
    <AppScreen>
      <PageHeader
        eyebrow="ניווט"
        title="המסך הזה לא זמין"
        subtitle="כנראה שהקישור אינו תקין, פג תוקף או שאינו זמין לחשבון הנוכחי."
      />

      <AppCard
        title="מה אפשר לעשות עכשיו"
        description="אפשר לחזור למסך הראשי ולהמשיך משם לעמוד המתאים."
      >
        <AppButton href="/" label="חזרה למסך הראשי" />
      </AppCard>
    </AppScreen>
  );
}
