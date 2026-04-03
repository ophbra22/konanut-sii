import { FeatureShellScreen } from '@/src/features/shell/feature-shell-screen';
import { useAuthStore } from '@/src/stores/auth-store';

export default function ProfileScreen() {
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <FeatureShellScreen
      eyebrow="פרופיל"
      title="חשבון משתמש"
      subtitle="מעטפת התחלתית לפרטי המשתמש, הרשאות, העדפות ופעולות חשבון."
      metrics={[
        { label: 'Auth', value: 'מחובר', tone: 'accent' },
        { label: 'הרשאות', value: 'בהמשך', tone: 'default' },
        { label: 'ניהול חשבון', value: 'מוכן', tone: 'warning' },
      ]}
      checklist={[
        'פרטי משתמש והרשאות מערכת.',
        'העדפות התראות ותצוגה.',
        'פעולות אבטחה ויציאה מהמערכת.'
      ]}
      actions={[
        {
          label: 'יציאה מהמערכת',
          description: 'הזרימה מחוברת ל־Supabase Auth דרך Zustand store.',
          onPress: () => {
            void signOut();
          },
          variant: 'secondary',
        },
      ]}
    />
  );
}
