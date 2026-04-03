import { FeatureShellScreen } from '@/src/features/shell/feature-shell-screen';

export default function DashboardScreen() {
  return (
    <FeatureShellScreen
      eyebrow="חמ״ל דיגיטלי"
      title="לוח בקרה"
      subtitle="מרכז שליטה ראשי למצב כשירות, תמונת מצב מהירה וכניסה למסכים המבצעיים."
      metrics={[
        { label: 'מצב שלד', value: 'פעיל', tone: 'accent' },
        { label: 'נתונים חיים', value: 'מוכן', tone: 'default' },
        { label: 'שכבות מבצעיות', value: 'בהקמה', tone: 'warning' },
      ]}
      checklist={[
        'סטטוס מהיר של יישובים ויחידות כוננות.',
        'תצוגת משימות פתוחות, אימונים קרובים והתראות פעילות.',
        'גישה מיידית למסכים הקריטיים תחת מעטפת אחת.'
      ]}
    />
  );
}
