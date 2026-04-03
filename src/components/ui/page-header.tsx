import { ScreenHeader } from '@/src/components/ui/screen-header';

type PageHeaderProps = {
  eyebrow: string;
  subtitle: string;
  title: string;
};

export function PageHeader({ eyebrow, subtitle, title }: PageHeaderProps) {
  return <ScreenHeader eyebrow={eyebrow} subtitle={subtitle} title={title} />;
}
