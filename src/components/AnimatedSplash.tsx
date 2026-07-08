import * as SplashScreen from 'expo-splash-screen';
import { ReactElement, useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

/**
 * Terracotta-wash launch screen that "builds" the DuneStack mark:
 * the three stones settle into place bottom-to-top, then the wordmark
 * rises in. It renders on top of the app and fades out once the intro
 * has played, revealing the UI underneath.
 *
 * The native (static) splash configured in app.json uses the same
 * terracotta background, so the hand-off to this animated overlay is
 * seamless — the user only ever sees one continuous terracotta screen.
 */

const SPLASH_BG = '#B4744A';

// Stones, ordered bottom (widest, most shadowed) to top (smallest, brightest).
const STONES = [
  { width: 128, height: 46, color: '#E6D6C0' },
  { width: 96, height: 40, color: '#F1E7D7' },
  { width: 62, height: 34, color: '#FAF3E9' },
] as const;

type AnimatedSplashProps = {
  readonly onFinish: () => void;
};

export function AnimatedSplash({ onFinish }: AnimatedSplashProps): ReactElement {
  // One driver per stone (drop + fade), plus the wordmark and the whole overlay.
  const stoneAnims = useRef(STONES.map(() => new Animated.Value(0))).current;
  const wordmark = useRef(new Animated.Value(0)).current;
  const overlay = useRef(new Animated.Value(1)).current;

  // Reveal this overlay by hiding the native splash once we've mounted.
  const handleLayout = useCallback((): void => {
    void SplashScreen.hideAsync();
  }, []);

  useEffect((): void => {
    const stones = stoneAnims.map((value): Animated.CompositeAnimation =>
      Animated.spring(value, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    );

    Animated.sequence([
      // Bottom-to-top stacking, each stone settling after the previous.
      Animated.stagger(190, stones),
      Animated.timing(wordmark, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Hold the finished mark, then fade the whole screen away.
      Animated.delay(650),
      Animated.timing(overlay, {
        toValue: 0,
        duration: 420,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start((): void => {
      onFinish();
    });
  }, [onFinish, overlay, stoneAnims, wordmark]);

  return (
    <Animated.View
      style={[styles.fill, { opacity: overlay }]}
      onLayout={handleLayout}
      pointerEvents="none"
    >
      <View style={styles.center}>
        <View style={styles.tile}>
          <Text style={styles.note}>stacks in ↑</Text>
          <View style={styles.stones}>
            {STONES.map((stone, index) => {
              const anim = stoneAnims[index];
              return (
                <Animated.View
                  key={index}
                  style={{
                    width: stone.width,
                    height: stone.height,
                    borderRadius: stone.height / 2,
                    backgroundColor: stone.color,
                    marginTop: index === 0 ? 0 : -stone.height * 0.28,
                    opacity: anim,
                    transform: [
                      {
                        translateY: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [22, 0],
                        }),
                      },
                      {
                        scale: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.82, 1],
                        }),
                      },
                    ],
                  }}
                />
              );
            })}
          </View>
        </View>

        <Animated.Text
          style={[
            styles.wordmark,
            {
              opacity: wordmark,
              transform: [
                {
                  translateY: wordmark.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            },
          ]}
        >
          DuneStack
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: SPLASH_BG,
    justifyContent: 'center',
    zIndex: 100,
  },
  note: {
    color: 'rgba(250, 243, 233, 0.85)',
    fontSize: 15,
    fontStyle: 'italic',
    position: 'absolute',
    right: 18,
    top: 26,
  },
  stones: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tile: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 52,
    height: 200,
    justifyContent: 'center',
    width: 200,
  },
  wordmark: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginTop: 30,
  },
});
