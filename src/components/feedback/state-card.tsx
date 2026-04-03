import { EmptyState } from '@/src/components/ui/empty-state';

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
    <EmptyState
      actionLabel={actionLabel}
      description={description}
      onAction={onAction}
      title={title}
      tone={variant}
    />
  );
}
