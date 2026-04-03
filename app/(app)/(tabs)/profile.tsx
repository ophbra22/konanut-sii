import { StyleSheet, View } from 'react-native';

import { StateCard } from '@/src/components/feedback/state-card';
import { AppBadge } from '@/src/components/ui/app-badge';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { AppRevealView } from '@/src/components/ui/app-reveal-view';
import { AppScreen } from '@/src/components/ui/app-screen';
import { DataRow } from '@/src/components/ui/data-row';
import { MetricCard } from '@/src/components/ui/metric-card';
import { PageHeader } from '@/src/components/ui/page-header';
import { getRoleLabel } from '@/src/features/auth/lib/permissions';
import { useAuthStore } from '@/src/stores/auth-store';

export default function ProfileScreen() {
  const profile = useAuthStore((state) => state.profile);
  const role = useAuthStore((state) => state.role);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <AppScreen>
      <PageHeader
        eyebrow="פרופיל"
        title="חשבון משתמש"
        subtitle="פרטי חשבון, הרשאה ופעולות מערכת."
      />

      {!profile ? (
        <StateCard
          description="לא הצלחנו לטעון את פרטי המשתמש המחובר."
          title="פרופיל לא זמין"
          variant="warning"
        />
      ) : (
        <>
          <AppRevealView delay={30}>
            <View style={styles.metricsGrid}>
              <MetricCard label="סטטוס" tone="accent" value="מחובר" />
              <MetricCard label="הרשאה" value={getRoleLabel(role)} />
              <MetricCard
                label="יישובים מקושרים"
                tone={profile.linkedSettlementIds.length ? 'accent' : 'warning'}
                value={String(profile.linkedSettlementIds.length)}
              />
            </View>
          </AppRevealView>

          <AppRevealView delay={60}>
            <AppCard
              description="זהות המשתמש הפעיל במערכת."
              title={profile.full_name}
            >
              <View style={styles.badges}>
                <AppBadge label={getRoleLabel(role)} size="sm" tone="info" />
                <AppBadge label={profile.is_active ? 'פעיל' : 'לא פעיל'} size="sm" tone="neutral" />
              </View>
              <DataRow label="אימייל" value={profile.email?.trim() || 'לא הוגדר'} />
              <DataRow label="טלפון" value={profile.phone?.trim() || 'לא הוגדר'} />
            </AppCard>
          </AppRevealView>

          <AppRevealView delay={90}>
            <AppCard description="פעולות חשבון זמינות במכשיר המחובר." title="פעולות">
              <View style={styles.actions}>
                <AppButton
                  fullWidth={false}
                  label="רענון פרופיל"
                  onPress={() => {
                    void refreshProfile();
                  }}
                  style={styles.actionButton}
                  variant="secondary"
                />
                <AppButton
                  fullWidth={false}
                  label="יציאה מהמערכת"
                  onPress={() => {
                    void signOut();
                  }}
                  style={styles.actionButton}
                  variant="danger"
                />
              </View>
            </AppCard>
          </AppRevealView>
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  badges: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
});
