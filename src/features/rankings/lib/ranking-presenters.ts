import type { RankingLevel } from '@/src/features/rankings/utils/ranking-calculator';

type BadgeTone = 'accent' | 'danger' | 'neutral' | 'teal' | 'warning';

export function getRankingTone(level: RankingLevel): BadgeTone {
  switch (level) {
    case 'מצטיין':
      return 'accent';
    case 'טוב':
      return 'teal';
    case 'תקין':
      return 'warning';
    case 'דורש שיפור':
      return 'danger';
    default:
      return 'danger';
  }
}
