import type { RankingLevel } from '@/src/features/rankings/utils/ranking-calculator';

type BadgeTone = 'accent' | 'danger' | 'neutral' | 'teal' | 'warning';

export function getRankingTone(level: RankingLevel): BadgeTone {
  switch (level) {
    case 'כשיר מאוד':
      return 'accent';
    case 'כשיר':
      return 'teal';
    case 'במעקב':
      return 'warning';
    default:
      return 'danger';
  }
}
