import type { FlexStyle, TextStyle, ViewStyle } from 'react-native';

/**
 * The product is Hebrew-first, so layout direction is controlled by the app.
 */
export const IS_RTL = true;
export const IS_APP_RTL = IS_RTL;

export const rtlRow = {
  flexDirection: 'row-reverse',
} satisfies Pick<FlexStyle, 'flexDirection'>;

export const rtlRowReverse = {
  flexDirection: 'row',
} satisfies Pick<FlexStyle, 'flexDirection'>;

export const rtlText = {
  textAlign: 'right',
  writingDirection: 'rtl',
} satisfies Pick<TextStyle, 'textAlign' | 'writingDirection'>;

export const rtlInput = {
  textAlign: 'right',
  writingDirection: 'rtl',
} satisfies Pick<TextStyle, 'textAlign' | 'writingDirection'>;

export const rtlTextAlign: TextStyle['textAlign'] = rtlText.textAlign;
export const rtlTextAlignReverse: TextStyle['textAlign'] = rtlText.textAlign;
export const rtlWritingDirection: TextStyle['writingDirection'] = rtlText.writingDirection;

export function rtlMargin(start: number, end = 0): Pick<ViewStyle, 'marginStart' | 'marginEnd'> {
  return {
    marginEnd: IS_RTL ? start : end,
    marginStart: IS_RTL ? end : start,
  };
}

export function rtlPadding(start: number, end = 0): Pick<ViewStyle, 'paddingStart' | 'paddingEnd'> {
  return {
    paddingEnd: IS_RTL ? start : end,
    paddingStart: IS_RTL ? end : start,
  };
}
