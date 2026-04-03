import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type AppRevealViewProps = {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

export function AppRevealView({
  children,
  delay = 0,
  style,
}: AppRevealViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        delay,
        duration: 220,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        delay,
        duration: 240,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [delay, opacity, translateY]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
