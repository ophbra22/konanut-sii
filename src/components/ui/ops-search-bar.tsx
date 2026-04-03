import type { TextInputProps } from 'react-native';

import { SearchBar } from '@/src/components/ui/search-bar';

type OpsSearchBarProps = TextInputProps & {
  placeholder: string;
};

export function OpsSearchBar({
  placeholder,
  ...props
}: OpsSearchBarProps) {
  return <SearchBar placeholder={placeholder} {...props} />;
}
