import type { ReactNode } from 'react';

import { ScreenHeader } from '@/src/components/ui/screen-header';

type OpsListHeaderProps = {
  actions?: ReactNode;
  subtitle?: string;
  title: string;
};

export function OpsListHeader({
  actions,
  subtitle,
  title,
}: OpsListHeaderProps) {
  return <ScreenHeader actions={actions} subtitle={subtitle} title={title} />;
}
