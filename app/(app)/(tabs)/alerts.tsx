import { FeatureShellScreen } from '@/src/features/shell/feature-shell-screen';

export default function AlertsScreen() {
  return (
    <FeatureShellScreen
      eyebrow="התראות"
      title="מרכז התראות"
      subtitle="תשתית להצגת עדכונים דחופים, חריגות כשירות, תזכורות ותנועת מערכת חשובה."
      metrics={[
        { label: 'דחיפות', value: 'גבוהה', tone: 'danger' },
        { label: 'קטלוג', value: 'מוכן', tone: 'accent' },
        { label: 'Push', value: 'בהמשך', tone: 'warning' },
      ]}
      checklist={[
        'התראות מבצעיות ועדכוני מערכת.',
        'מצב קריאה, סינון לפי עדיפות ויישוב.',
        'הרחבה עתידית להתראות דחיפה במכשיר.'
      ]}
    />
  );
}
