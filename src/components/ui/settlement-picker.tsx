import { Check, ChevronDown, Search, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppButton } from '@/src/components/ui/app-button';
import { rtlRow, rtlRowReverse } from '@/src/lib/rtl';
import { createThemedStyles, theme, type AppTheme } from '@/src/theme';

export type SettlementPickerOption = {
  area?: string | null;
  id: string;
  name: string;
  regional_council?: string | null;
};

type SettlementPickerProps = {
  disabled?: boolean;
  emptyMessage?: string;
  errorMessage?: string;
  helperText?: string;
  label?: string;
  multiple?: boolean;
  onChange: (settlementIds: string[]) => void;
  placeholder?: string;
  selectedSettlementIds: string[];
  settlements: SettlementPickerOption[];
};

function normalizeSearchValue(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase('he-IL');
}

function normalizeSearchLoose(value: string) {
  return normalizeSearchValue(value).replace(/\s/g, '');
}

function getSettlementMeta(settlement: SettlementPickerOption) {
  return [settlement.area, settlement.regional_council]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' • ');
}

export function SettlementPicker({
  disabled = false,
  emptyMessage = 'לא נמצאו יישובים',
  errorMessage,
  helperText,
  label,
  multiple = false,
  onChange,
  placeholder = 'בחר יישוב',
  selectedSettlementIds,
  settlements,
}: SettlementPickerProps) {
  const { height } = useWindowDimensions();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [draftSelectedIds, setDraftSelectedIds] = useState<string[]>(selectedSettlementIds);
  const selectedIdSet = useMemo(
    () => new Set(selectedSettlementIds),
    [selectedSettlementIds]
  );
  const draftSelectedIdSet = useMemo(
    () => new Set(draftSelectedIds),
    [draftSelectedIds]
  );
  const selectedSettlementNames = useMemo(() => {
    const settlementById = new Map(
      settlements.map((settlement) => [settlement.id, settlement.name])
    );

    return selectedSettlementIds
      .map((settlementId) => settlementById.get(settlementId))
      .filter((name): name is string => Boolean(name));
  }, [selectedSettlementIds, settlements]);
  const filteredSettlements = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(query);
    const looseQuery = normalizeSearchLoose(query);

    if (!normalizedQuery) {
      return settlements;
    }

    return settlements.filter((settlement) => {
      const normalizedName = normalizeSearchValue(settlement.name);
      const looseName = normalizeSearchLoose(settlement.name);

      return normalizedName.includes(normalizedQuery) || looseName.includes(looseQuery);
    });
  }, [query, settlements]);

  useEffect(() => {
    if (isOpen) {
      setDraftSelectedIds(selectedSettlementIds);
      setQuery('');
    }
  }, [isOpen, selectedSettlementIds]);

  const selectedCount = selectedSettlementIds.length;
  const draftSelectedCount = draftSelectedIds.length;
  const summaryText = selectedCount
    ? multiple
      ? `נבחרו ${selectedCount} יישובים`
      : selectedSettlementNames[0] ?? placeholder
    : placeholder;
  const listMaxHeight = Math.min(420, Math.max(280, height * 0.58));

  function closePicker() {
    setIsOpen(false);
    setQuery('');
  }

  function toggleDraftSettlement(settlementId: string) {
    setDraftSelectedIds((currentIds) =>
      currentIds.includes(settlementId)
        ? currentIds.filter((id) => id !== settlementId)
        : [...currentIds, settlementId]
    );
  }

  function handleSelectSettlement(settlementId: string) {
    if (multiple) {
      toggleDraftSettlement(settlementId);
      return;
    }

    onChange([settlementId]);
    closePicker();
  }

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}

      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => {
          setIsOpen(true);
        }}
        style={({ pressed }) => [
          styles.trigger,
          errorMessage ? styles.triggerError : null,
          disabled ? styles.triggerDisabled : null,
          pressed && !disabled ? styles.triggerPressed : null,
        ]}
      >
        <ChevronDown color={theme.colors.textMuted} size={18} strokeWidth={2.1} />
        <View style={styles.triggerTextWrap}>
          <Text
            numberOfLines={1}
            style={[
              styles.triggerText,
              selectedCount ? styles.triggerTextSelected : null,
            ]}
          >
            {summaryText}
          </Text>
          {selectedCount && multiple ? (
            <Text style={styles.triggerMeta}>
              {selectedSettlementNames.slice(0, 2).join(', ')}
              {selectedCount > 2 ? ` ועוד ${selectedCount - 2}` : ''}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Modal
        animationType="fade"
        onRequestClose={closePicker}
        transparent
        visible={isOpen}
      >
        <View style={styles.modalBackdrop}>
          <Pressable onPress={closePicker} style={StyleSheet.absoluteFill} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Pressable
                accessibilityRole="button"
                onPress={closePicker}
                style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}
              >
                <X color={theme.colors.textMuted} size={18} strokeWidth={2.2} />
              </Pressable>
              <View style={styles.sheetTitleWrap}>
                <Text style={styles.sheetTitle}>
                  {multiple ? 'בחירת יישובים' : 'בחירת יישוב'}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {multiple ? `${draftSelectedCount} נבחרו` : 'לחיצה על יישוב תבחר ותסגור'}
                </Text>
              </View>
            </View>

            <View style={styles.searchBox}>
              <Search color={theme.colors.textMuted} size={17} strokeWidth={2.1} />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                cursorColor={theme.colors.info}
                onChangeText={setQuery}
                placeholder="חפש יישוב..."
                placeholderTextColor={theme.colors.textMuted}
                selectionColor={theme.colors.info}
                style={styles.searchInput}
                value={query}
              />
            </View>

            <FlatList
              data={filteredSettlements}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>{emptyMessage}</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = multiple
                  ? draftSelectedIdSet.has(item.id)
                  : selectedIdSet.has(item.id);
                const meta = getSettlementMeta(item);

                return (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      handleSelectSettlement(item.id);
                    }}
                    style={({ pressed }) => [
                      styles.optionRow,
                      isSelected ? styles.optionRowSelected : null,
                      pressed ? styles.optionRowPressed : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.checkBox,
                        isSelected ? styles.checkBoxSelected : null,
                      ]}
                    >
                      {isSelected ? (
                        <Check color={theme.colors.inverseText} size={15} strokeWidth={2.5} />
                      ) : null}
                    </View>
                    <View style={styles.optionTextWrap}>
                      <Text style={styles.optionTitle}>{item.name}</Text>
                      {meta ? <Text style={styles.optionMeta}>{meta}</Text> : null}
                    </View>
                  </Pressable>
                );
              }}
              style={[styles.list, { maxHeight: listMaxHeight }]}
            />

            {multiple ? (
              <View style={styles.sheetActions}>
                <AppButton
                  fullWidth={false}
                  label="נקה בחירה"
                  onPress={() => {
                    setDraftSelectedIds([]);
                  }}
                  style={styles.sheetActionButton}
                  variant="ghost"
                />
                <AppButton
                  fullWidth={false}
                  label="אישור בחירה"
                  onPress={() => {
                    onChange(draftSelectedIds);
                    closePicker();
                  }}
                  style={styles.sheetActionButton}
                  variant="secondary"
                />
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = createThemedStyles((theme: AppTheme) => ({
  checkBox: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.border,
    borderRadius: 9,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkBoxSelected: {
    backgroundColor: theme.colors.info,
    borderColor: theme.colors.info,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  error: {
    ...theme.typography.caption,
    color: theme.colors.danger,
    textAlign: 'right',
  },
  helper: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    textAlign: 'right',
  },
  list: {
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: theme.colors.modalBackdrop,
    flex: 1,
    justifyContent: 'flex-end',
    padding: theme.spacing.md,
  },
  optionMeta: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  optionRow: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderBottomColor: theme.colors.borderSoft,
    borderBottomWidth: 1,
    ...rtlRow,
    gap: theme.spacing.sm,
    minHeight: 58,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  optionRowPressed: {
    opacity: 0.82,
  },
  optionRowSelected: {
    backgroundColor: theme.colors.surfaceInfo,
  },
  optionTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '800',
    textAlign: 'right',
  },
  pressed: {
    opacity: 0.78,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    ...rtlRowReverse,
    gap: theme.spacing.sm,
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
  },
  searchInput: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sheet: {
    ...theme.elevation.card,
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: theme.spacing.md,
    maxWidth: 620,
    padding: theme.spacing.md,
    width: '100%',
  },
  sheetActionButton: {
    flex: 1,
  },
  sheetActions: {
    ...rtlRow,
    gap: theme.spacing.sm,
  },
  sheetHeader: {
    alignItems: 'flex-start',
    ...rtlRow,
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  sheetSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  sheetTitle: {
    ...theme.typography.cardTitle,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  sheetTitleWrap: {
    alignItems: 'flex-end',
    flex: 1,
  },
  trigger: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    ...rtlRow,
    gap: theme.spacing.sm,
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  triggerDisabled: {
    opacity: 0.58,
  },
  triggerError: {
    borderColor: theme.colors.danger,
  },
  triggerMeta: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  triggerPressed: {
    opacity: 0.84,
  },
  triggerText: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    fontWeight: '700',
    textAlign: 'right',
  },
  triggerTextSelected: {
    color: theme.colors.textPrimary,
  },
  triggerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  wrapper: {
    gap: theme.spacing.xs,
  },
}));
