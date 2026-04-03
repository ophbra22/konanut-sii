import { AppCard } from '@/src/components/ui/app-card';
import { AppButton } from '@/src/components/ui/app-button';
import { AppScreen } from '@/src/components/ui/app-screen';
import { PageHeader } from '@/src/components/ui/page-header';

export default function SettlementRankingsScreen() {
  return (
    <AppScreen>
      <PageHeader
        eyebrow="דירוג יישובים"
        title="דירוגי כוננות"
        subtitle="המסך יאגד בהמשך דירוג מבצעי לכל יישוב, בהתאם לעיקרון שבו היישוב הוא יחידת הכוננות המרכזית."
      />

      <AppCard
        title="מה יופיע כאן"
        description="טבלאות דירוג, מדדי מוכנות, השוואה בין יישובים ומגמות לאורך זמן."
      />

      <AppCard
        title="שלב נוכחי"
        description="המסך מוכן כמעטפת UI וניווט בלבד, בלי חיבור עדיין למודלי דירוג ונתונים אמיתיים."
      >
        <AppButton href="/settlements" label="חזרה למסך היישובים" variant="secondary" />
      </AppCard>
    </AppScreen>
  );
}
