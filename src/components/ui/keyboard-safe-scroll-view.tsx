import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type PropsWithChildren,
  type RefObject,
} from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
  type TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type KeyboardSafeVisibilityOptions = {
  extraOffset?: number;
  topOffset?: number;
};

type KeyboardSafeContextValue = {
  ensureVisible: (
    inputRef: RefObject<TextInput | null>,
    options?: KeyboardSafeVisibilityOptions
  ) => void;
};

const KeyboardSafeContext = createContext<KeyboardSafeContextValue | null>(null);

type PendingRequest = {
  inputRef: RefObject<TextInput | null>;
  options?: KeyboardSafeVisibilityOptions;
};

type KeyboardSafeScrollViewProps = PropsWithChildren<
  ScrollViewProps & {
    keyboardExtraPadding?: number;
  }
>;

export function useKeyboardSafeFocus() {
  return useContext(KeyboardSafeContext);
}

export function KeyboardSafeScrollView({
  automaticallyAdjustKeyboardInsets = Platform.OS === 'ios',
  children,
  contentContainerStyle,
  keyboardDismissMode = Platform.OS === 'ios' ? 'interactive' : 'on-drag',
  keyboardExtraPadding = 40,
  keyboardShouldPersistTaps = 'handled',
  onScroll,
  scrollEventThrottle = 16,
  ...props
}: KeyboardSafeScrollViewProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);
  const keyboardHeightRef = useRef(0);
  const pendingRequestRef = useRef<PendingRequest | null>(null);
  const timeoutHandlesRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearScheduledChecks = useCallback(() => {
    timeoutHandlesRef.current.forEach((handle) => {
      clearTimeout(handle);
    });
    timeoutHandlesRef.current = [];
  }, []);

  const runVisibilityCheck = useCallback(() => {
    const pendingRequest = pendingRequestRef.current;
    const input = pendingRequest?.inputRef.current;

    if (!input || !scrollRef.current) {
      return;
    }

    input.measureInWindow((_, y, __, height) => {
      if (!height) {
        return;
      }

      const windowHeight = Dimensions.get('window').height;
      const topOffset = pendingRequest?.options?.topOffset ?? 24;
      const extraOffset = pendingRequest?.options?.extraOffset ?? 28;
      const visibleTop = insets.top + topOffset;
      const visibleBottom =
        windowHeight - Math.max(keyboardHeightRef.current, 0) - extraOffset;
      const fieldBottom = y + height;
      const fieldTop = y;
      const currentOffset = scrollOffsetRef.current;

      let nextOffset = currentOffset;

      if (fieldBottom > visibleBottom) {
        nextOffset += fieldBottom - visibleBottom;
      } else if (fieldTop < visibleTop) {
        nextOffset = Math.max(0, currentOffset - (visibleTop - fieldTop));
      }

      if (Math.abs(nextOffset - currentOffset) <= 2) {
        return;
      }

      scrollRef.current?.scrollTo({ animated: true, y: nextOffset });
      scrollOffsetRef.current = nextOffset;
    });
  }, [insets.top]);

  const scheduleVisibilityCheck = useCallback(() => {
    clearScheduledChecks();

    const delays = Platform.OS === 'ios' ? [0, 120, 260] : [80, 200, 360];

    delays.forEach((delay) => {
      const handle = setTimeout(() => {
        runVisibilityCheck();
      }, delay);

      timeoutHandlesRef.current.push(handle);
    });
  }, [clearScheduledChecks, runVisibilityCheck]);

  const ensureVisible = useCallback(
    (
      inputRef: RefObject<TextInput | null>,
      options?: KeyboardSafeVisibilityOptions
    ) => {
      pendingRequestRef.current = { inputRef, options };
      scheduleVisibilityCheck();
    },
    [scheduleVisibilityCheck]
  );

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      keyboardHeightRef.current = event.endCoordinates.height;
      scheduleVisibilityCheck();
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      keyboardHeightRef.current = 0;
      clearScheduledChecks();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      clearScheduledChecks();
    };
  }, [clearScheduledChecks, scheduleVisibilityCheck]);

  const flattenedContentStyle = StyleSheet.flatten(contentContainerStyle) ?? {};
  const basePaddingBottom =
    typeof flattenedContentStyle.paddingBottom === 'number'
      ? flattenedContentStyle.paddingBottom
      : 0;

  const resolvedContentContainerStyle = useMemo(
    () => [
      contentContainerStyle,
      {
        paddingBottom:
          basePaddingBottom + insets.bottom + keyboardExtraPadding,
      },
    ],
    [
      basePaddingBottom,
      contentContainerStyle,
      insets.bottom,
      keyboardExtraPadding,
    ]
  );

  const contextValue = useMemo<KeyboardSafeContextValue>(
    () => ({
      ensureVisible,
    }),
    [ensureVisible]
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
      onScroll?.(event);
    },
    [onScroll]
  );

  return (
    <KeyboardSafeContext.Provider value={contextValue}>
      <ScrollView
        ref={scrollRef}
        automaticallyAdjustKeyboardInsets={automaticallyAdjustKeyboardInsets}
        contentContainerStyle={resolvedContentContainerStyle}
        keyboardDismissMode={keyboardDismissMode}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        showsVerticalScrollIndicator={false}
        {...props}
      >
        {children}
      </ScrollView>
    </KeyboardSafeContext.Provider>
  );
}
