import { FeatureShellScreen } from '@/src/features/shell/feature-shell-screen';

export default function CalendarScreen() {
  return (
    <FeatureShellScreen
      eyebrow="יומן"
      title="יומן מבצעי"
      subtitle="מסך מתוזמן לאירועים, אימונים, משימות ופעילויות שוטפות של היישובים."
      metrics={[
        { label: 'תצוגת חודש', value: 'בהמשך', tone: 'default' },
        { label: 'תזכורות', value: 'מוכן', tone: 'accent' },
        { label: 'אירועים מבצעיים', value: 'בהקמה', tone: 'warning' },
      ]}
      checklist={[
        'יומן אירועים מרכזי עם סינון לפי יישוב וסוג פעילות.',
        'אירועים מתוכננים, תזכורות ומועדי אימון.',
        'אינטגרציה עתידית להתראות ומעקב ביצוע.'
      ]}
    />
  );
}
