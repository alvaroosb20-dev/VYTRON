import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { BRAND } from '@/config/app';
import { colors, fonts, radius } from '@/theme/tokens';
import { Icon } from './Icon';
import { Wordmark } from './Logo';

export const SPLASH_BG = '#080808';

type Props = {
  /** La sesión y los datos locales ya se han comprobado. */
  ready: boolean;
  /** Algo falló al arrancar: se muestra con opción de reintentar. */
  error: string | null;
  onRetry: () => void;
  /** Se llama cuando la animación de salida ha terminado. */
  onFinish: () => void;
};

const useNative = Platform.OS !== 'web';
const MIN_VISIBLE_MS = 1500; // nunca más corto: la animación se ve completa
const LOGO_W = 220;

/**
 * Pantalla de carga de VYTRON. Se muestra una vez por apertura de la app.
 * La línea de carga refleja el arranque real: avanza hasta ~70 % mientras se comprueba
 * la sesión y solo se completa cuando todo está listo. Si algo falla, se detiene y
 * ofrece reintentar: nunca se queda cargando indefinidamente.
 */
export function Splash({ ready, error, onRetry, onFinish }: Props) {
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const startedAt = useRef(Date.now());
  const finishing = useRef(false);

  const logo = useRef(new Animated.Value(0)).current; // opacidad + escala
  const glow = useRef(new Animated.Value(0)).current;
  const line = useRef(new Animated.Value(0)).current; // 0..1 (no nativo: anima el ancho)
  const tagline = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false));
  }, []);

  // Entrada.
  useEffect(() => {
    if (reduceMotion === null) return;
    if (reduceMotion) {
      Animated.parallel([
        Animated.timing(logo, { toValue: 1, duration: 250, useNativeDriver: useNative }),
        Animated.timing(tagline, { toValue: 1, duration: 250, useNativeDriver: useNative }),
        Animated.timing(line, { toValue: 0.7, duration: 400, useNativeDriver: false }),
      ]).start();
      return;
    }
    Animated.parallel([
      Animated.timing(logo, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: useNative }),
      Animated.sequence([
        Animated.delay(250),
        Animated.timing(glow, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: useNative }),
        Animated.timing(glow, { toValue: 0.45, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: useNative }),
      ]),
      Animated.sequence([
        Animated.delay(350),
        Animated.timing(tagline, { toValue: 1, duration: 450, useNativeDriver: useNative }),
      ]),
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(line, { toValue: 0.7, duration: 1000, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      ]),
    ]).start();
  }, [reduceMotion, logo, glow, line, tagline]);

  // Salida: solo cuando el arranque ha terminado de verdad.
  useEffect(() => {
    if (!ready || error || reduceMotion === null || finishing.current) return;
    finishing.current = true;
    const wait = Math.max(0, (reduceMotion ? 500 : MIN_VISIBLE_MS) - (Date.now() - startedAt.current));
    const t = setTimeout(() => {
      Animated.sequence([
        Animated.timing(line, { toValue: 1, duration: reduceMotion ? 150 : 320, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(exit, { toValue: 0, duration: reduceMotion ? 150 : 380, easing: Easing.in(Easing.quad), useNativeDriver: false }),
      ]).start(() => onFinish());
    }, wait);
    return () => clearTimeout(t);
  }, [ready, error, reduceMotion, line, exit, onFinish]);

  const scale = reduceMotion ? 1 : logo.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  const lineWidth = line.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, { opacity: exit }]}
      pointerEvents="auto"
      accessible
      accessibilityLabel={error ? `VYTRON. ${error}` : 'VYTRON. Cargando'}
    >
      <View style={styles.center}>
        {!reduceMotion && (
          <Animated.View style={[styles.glow, { opacity: glow }]} pointerEvents="none">
            <Svg width={LOGO_W * 1.9} height={LOGO_W}>
              <Defs>
                <RadialGradient id="g" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0" stopColor={colors.neon} stopOpacity={0.32} />
                  <Stop offset="0.55" stopColor={colors.neon} stopOpacity={0.08} />
                  <Stop offset="1" stopColor={colors.neon} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Ellipse cx={(LOGO_W * 1.9) / 2} cy={LOGO_W / 2} rx={(LOGO_W * 1.9) / 2} ry={LOGO_W / 2} fill="url(#g)" />
            </Svg>
          </Animated.View>
        )}

        <Animated.View style={{ opacity: logo, transform: [{ scale }] }}>
          <Wordmark height={LOGO_W * (116 / 558.66)} />
        </Animated.View>

        <Animated.Text style={[styles.tagline, { opacity: tagline }]}>{BRAND.slogan}</Animated.Text>

        <View style={styles.track} accessibilityRole="progressbar">
          <Animated.View style={[styles.fill, { width: lineWidth }, error ? { backgroundColor: colors.muted } : null]} />
        </View>

        {error && (
          <View style={styles.error}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="alert" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
            <Pressable onPress={onRetry} style={({ pressed }) => [styles.retry, pressed && { opacity: 0.8 }]} accessibilityRole="button">
              <Icon name="refresh" size={16} color={colors.neonInk} />
              <Text style={styles.retryText}>REINTENTAR</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: SPLASH_BG, zIndex: 100, elevation: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  glow: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  tagline: { marginTop: 18, fontFamily: fonts.displayBold, fontSize: 13, letterSpacing: 4, color: colors.muted },
  track: { marginTop: 36, width: LOGO_W * 0.8, height: 3, borderRadius: 2, backgroundColor: '#1C1C1F', overflow: 'hidden' },
  fill: { height: 3, borderRadius: 2, backgroundColor: colors.neon },
  error: { marginTop: 28, alignItems: 'center', gap: 16 },
  errorText: { fontFamily: fonts.medium, fontSize: 14, color: colors.white },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.neon, paddingHorizontal: 22, height: 48, borderRadius: radius.md },
  retryText: { fontFamily: fonts.display, fontSize: 17, letterSpacing: 1.2, color: colors.neonInk },
});
