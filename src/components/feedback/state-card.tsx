import { AppButton } from '@/src/components/ui/app-button';
import { AppCard } from '@/src/components/ui/app-card';

type StateCardVariant = 'accent' | 'default' | 'warning';

type StateCardProps = {
  actionLabel?: string;
  description: string;
  onAction?: () => void;
  title: string;
  variant?: StateCardVariant;
};

export function StateCard({
  actionLabel,
  description,
  onAction,
  title,
  variant = 'default',
}: StateCardProps) {
  return (
    <AppCard description={description} title={title} variant={variant}>
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
    </AppCard>
  );
}
