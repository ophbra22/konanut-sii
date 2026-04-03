import {
  StatusBadge,
  type StatusBadgeSize,
  type StatusBadgeTone,
} from '@/src/components/ui/status-badge';

type AppBadgeProps = {
  label: string;
  size?: StatusBadgeSize;
  tone?: StatusBadgeTone;
};

export function AppBadge({
  label,
  size = 'md',
  tone = 'neutral',
}: AppBadgeProps) {
  return <StatusBadge label={label} size={size} tone={tone} />;
}
