import { StyleSheet, View } from 'react-native';

import { AppBadge } from '@/src/components/ui/app-badge';
import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';
import { DataRow } from '@/src/components/ui/data-row';
import { getHalfYearLabel } from '@/src/lib/date-utils';
import { theme } from '@/src/theme';
import type { SettlementRankingListItem } from '@/src/features/rankings/api/rankings-service';
import { getRankingTone } from '@/src/features/rankings/lib/ranking-presenters';

type SettlementRankingCardProps = {
  ranking: SettlementRankingListItem;
};

export function SettlementRankingCard({
  ranking,
}: SettlementRankingCardProps) {
  return (
    <AppCard
      description={`${ranking.area} • ${getHalfYearLabel(ranking.halfYearPeriod)}`}
      style={styles.card}
      title={ranking.settlementName}
    >
      <View style={styles.badges}>
        <AppBadge label={`ציון ${ranking.finalScore}`} tone="accent" />
        <AppBadge
          label={ranking.rankingLevel}
          tone={getRankingTone(ranking.rankingLevel)}
        />
      </View>

      <DataRow
        label="מועצה אזורית"
        value={ranking.regionalCouncil?.trim() || 'לא הוגדרה'}
      />
      <DataRow label="מטווח" value={ranking.shootingCompleted ? 'כן' : 'לא'} />
      <DataRow label="הגנת יישוב" value={ranking.defenseCompleted ? 'כן' : 'לא'} />
      <DataRow
        label="ממוצע משוב"
        value={ranking.averageRating === null ? 'ללא משוב' : String(ranking.averageRating)}
      />
      <DataRow label="ניקוד אימונים" value={String(ranking.trainingScore)} />
      <DataRow label="ניקוד משובים" value={String(ranking.feedbackScore)} />

      <AppButton
        fullWidth={false}
        href={`/settlements/${ranking.settlementId}`}
        label="מעבר ליישוב"
        variant="secondary"
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  card: {
    padding: theme.spacing.md,
  },
});
