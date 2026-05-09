import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Star,
  Target,
  XCircle,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { SettlementRankingListItem } from '@/src/features/rankings/api/rankings-service';
import { formatDisplayDate } from '@/src/lib/date-utils';
import { rtlRow, rtlRowReverse } from '@/src/lib/rtl';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

type SettlementRankingCardProps = {
  ranking: SettlementRankingListItem;
  rankNumber: number;
};

function getScoreTone(score: number) {
  if (score >= 85) {
    return 'success' as const;
  }

  if (score >= 70) {
    return 'info' as const;
  }

  if (score >= 55) {
    return 'warning' as const;
  }

  return 'danger' as const;
}

function formatFeedback(value: number | null) {
  return value === null ? 'ללא דירוג' : `${value}/5`;
}

function formatDateOrMissing(value: string | null) {
  return value ? formatDisplayDate(value) : 'לא בוצע';
}

function StatusPill({
  completed,
  label,
  value,
}: {
  completed: boolean;
  label: string;
  value: string;
}) {
  const Icon = completed ? CheckCircle2 : XCircle;

  return (
    <View style={[styles.statusPill, completed ? styles.statusDone : styles.statusMissing]}>
      <Icon color={completed ? theme.colors.success : theme.colors.danger} size={14} />
      <View style={styles.statusTextWrap}>
        <Text style={styles.statusLabel}>{label}</Text>
        <Text style={[styles.statusValue, completed ? styles.positive : styles.negative]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function ScorePart({
  icon,
  label,
  score,
  total,
}: {
  icon: 'defense' | 'feedback' | 'range';
  label: string;
  score: number;
  total: number;
}) {
  const Icon = icon === 'range' ? Target : icon === 'defense' ? ShieldCheck : Star;

  return (
    <View style={styles.scorePart}>
      <View style={styles.scorePartHeader}>
        <Icon color={theme.colors.textSecondary} size={14} />
        <Text style={styles.scorePartLabel}>{label}</Text>
      </View>
      <Text style={styles.scorePartValue}>
        {Math.round(score)}/{total}
      </Text>
    </View>
  );
}

function TrainingEvidenceRow({
  date,
  feedbackRating,
  title,
  type,
}: {
  date: string;
  feedbackRating: number | null;
  title: string;
  type: string;
}) {
  return (
    <View style={styles.evidenceRow}>
      <View style={styles.evidenceMain}>
        <Text numberOfLines={1} style={styles.evidenceTitle}>
          {title}
        </Text>
        <Text style={styles.evidenceMeta}>
          {type} • {formatDisplayDate(date)}
        </Text>
      </View>
      <Text style={styles.evidenceRating}>{formatFeedback(feedbackRating)}</Text>
    </View>
  );
}

export function SettlementRankingCard({
  ranking,
  rankNumber,
}: SettlementRankingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const scoreTone = getScoreTone(ranking.finalScore);
  const subtitle = [ranking.councilName?.trim(), ranking.area?.trim()]
    .filter(Boolean)
    .join(' • ');
  const otherFeedbackTrainings = ranking.feedbackTrainings.filter(
    (training) =>
      training.id !== ranking.selectedRangeTraining?.id &&
      training.id !== ranking.selectedDefenseTraining?.id
  );
  const ExpandIcon = expanded ? ChevronUp : ChevronDown;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        setExpanded((current) => !current);
      }}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.rank}>#{rankNumber}</Text>
            <Text numberOfLines={1} style={styles.title}>
              {ranking.settlementName}
            </Text>
          </View>
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle || 'מועצה ופלגה לא הוגדרו'}
          </Text>
        </View>

        <View style={[styles.scoreBadge, scoreToneStyles[scoreTone]]}>
          <Text style={[styles.scoreValue, scoreTextToneStyles[scoreTone]]}>
            {ranking.finalScore}
          </Text>
          <Text style={[styles.scoreCaption, scoreTextToneStyles[scoreTone]]}>
            {ranking.rankingLevel}
          </Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <StatusPill
          completed={ranking.shootingCompleted}
          label="מטווח חציון"
          value={ranking.shootingCompleted ? 'בוצע' : 'חסר'}
        />
        <StatusPill
          completed={ranking.defenseCompleted}
          label="הגנת יישוב"
          value={ranking.defenseCompleted ? 'בוצע' : 'חסר'}
        />
        <StatusPill
          completed={ranking.averageRating !== null}
          label="משוב מדריך"
          value={formatFeedback(ranking.averageRating)}
        />
      </View>

      <View style={styles.breakdown}>
        <ScorePart icon="range" label="מטווח" score={ranking.rangeScore} total={40} />
        <ScorePart icon="defense" label="הגנת יישוב" score={ranking.defenseScore} total={30} />
        <ScorePart icon="feedback" label="משוב" score={ranking.feedbackScore} total={30} />
      </View>

      <View style={styles.bottomRow}>
        <Text numberOfLines={1} style={styles.bottomText}>
          פלגה: {ranking.area?.trim() || 'לא הוגדרה'}
        </Text>
        <Text numberOfLines={1} style={styles.bottomText}>
          מטווח: {formatDateOrMissing(ranking.lastRangeTrainingDate)}
        </Text>
        <Text numberOfLines={1} style={styles.bottomText}>
          הגנה: {formatDateOrMissing(ranking.lastDefenseTrainingDate)}
        </Text>
      </View>

      <View style={styles.expandHint}>
        <ExpandIcon color={theme.colors.textMuted} size={16} />
        <Text style={styles.expandText}>{expanded ? 'סגירת פירוט' : 'פירוט חישוב'}</Text>
      </View>

      {expanded ? (
        <View style={styles.expanded}>
          <Text style={styles.explanation}>
            הציון מחושב לפי ביצוע מטווח בתקופה הנבחרת, ביצוע הגנת יישוב בשנה
            הקלנדרית ומשוב מדריך. נוכחות אינה חלק מהציון.
          </Text>

          <View style={styles.evidenceSection}>
            <Text style={styles.evidenceSectionTitle}>אימון מטווח שנכנס לחישוב</Text>
            {ranking.selectedRangeTraining ? (
              <TrainingEvidenceRow {...ranking.selectedRangeTraining} />
            ) : (
              <Text style={styles.missingText}>לא בוצע</Text>
            )}
          </View>

          <View style={styles.evidenceSection}>
            <Text style={styles.evidenceSectionTitle}>אימון הגנת יישוב שנכנס לחישוב</Text>
            {ranking.selectedDefenseTraining ? (
              <TrainingEvidenceRow {...ranking.selectedDefenseTraining} />
            ) : (
              <Text style={styles.missingText}>לא בוצע</Text>
            )}
          </View>

          <View style={styles.evidenceSection}>
            <Text style={styles.evidenceSectionTitle}>אימונים נוספים שנכנסו למשוב</Text>
            {otherFeedbackTrainings.length ? (
              otherFeedbackTrainings.map((training) => (
                <TrainingEvidenceRow key={training.id} {...training} />
              ))
            ) : (
              <Text style={styles.missingText}>אין אימונים נוספים עם דירוג מדריך</Text>
            )}
          </View>

          {ranking.scoreCap !== null ? (
            <Text style={styles.capText}>תקרת ציון הופעלה: עד {ranking.scoreCap}</Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  bottomRow: {
    ...rtlRow,
    borderTopColor: theme.colors.separator,
    borderTopWidth: 1,
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 10,
  },
  bottomText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    maxWidth: '100%',
    textAlign: 'right',
  },
  breakdown: {
    ...rtlRow,
    gap: 8,
  },
  capText: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    textAlign: 'right',
  },
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.cardOutlineStrong,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 12,
    ...theme.elevation.card,
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.992 }],
  },
  evidenceMain: {
    flex: 1,
    gap: 2,
  },
  evidenceMeta: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  evidenceRating: {
    ...theme.typography.badge,
    color: theme.colors.textPrimary,
    flexShrink: 0,
    textAlign: 'left',
  },
  evidenceRow: {
    ...rtlRow,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.borderSoft,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  evidenceSection: {
    gap: 7,
  },
  evidenceSectionTitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '800',
    textAlign: 'right',
  },
  evidenceTitle: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    fontWeight: '800',
    textAlign: 'right',
  },
  expanded: {
    borderTopColor: theme.colors.separator,
    borderTopWidth: 1,
    gap: 12,
    paddingTop: 12,
  },
  expandHint: {
    ...rtlRowReverse,
    alignSelf: 'center',
    gap: 4,
  },
  expandText: {
    ...theme.typography.badge,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  explanation: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  missingText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  nameRow: {
    ...rtlRow,
    alignItems: 'center',
    gap: 7,
  },
  negative: {
    color: theme.colors.danger,
  },
  positive: {
    color: theme.colors.success,
  },
  rank: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    flexShrink: 0,
    fontWeight: '900',
    textAlign: 'right',
  },
  scoreBadge: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
    justifyContent: 'center',
    minHeight: 58,
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  scoreCaption: {
    ...theme.typography.badge,
    marginTop: 2,
    textAlign: 'center',
  },
  scorePart: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    minHeight: 58,
    padding: 8,
  },
  scorePartHeader: {
    ...rtlRow,
    alignItems: 'center',
    gap: 5,
  },
  scorePartLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  scorePartValue: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 30,
    textAlign: 'center',
  },
  statusDone: {
    backgroundColor: theme.colors.successSurface,
    borderColor: theme.colors.accentBorder,
  },
  statusLabel: {
    ...theme.typography.badge,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  statusMissing: {
    backgroundColor: theme.colors.dangerSurface,
    borderColor: theme.colors.dangerBorder,
  },
  statusPill: {
    ...rtlRow,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  statusRow: {
    ...rtlRow,
    flexWrap: 'wrap',
    gap: 7,
  },
  statusTextWrap: {
    flex: 1,
    gap: 2,
  },
  statusValue: {
    ...theme.typography.caption,
    fontWeight: '900',
    textAlign: 'right',
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  title: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  titleBlock: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  topRow: {
    ...rtlRow,
    alignItems: 'center',
    gap: 10,
  },
}));

const scoreToneStyles = createThemedStyles((theme: AppTheme) => ({
  danger: {
    backgroundColor: theme.colors.dangerSurface,
    borderColor: theme.colors.dangerBorder,
  },
  info: {
    backgroundColor: theme.colors.infoSurface,
    borderColor: theme.colors.infoBorder,
  },
  success: {
    backgroundColor: theme.colors.successSurface,
    borderColor: theme.colors.accentBorder,
  },
  warning: {
    backgroundColor: theme.colors.warningSurface,
    borderColor: theme.colors.warningBorder,
  },
}));

const scoreTextToneStyles = createThemedStyles((theme: AppTheme) => ({
  danger: {
    color: theme.colors.danger,
  },
  info: {
    color: theme.colors.info,
  },
  success: {
    color: theme.colors.success,
  },
  warning: {
    color: theme.colors.warning,
  },
}));
