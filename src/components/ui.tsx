import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, space, type } from '@/theme/tokens';
import { Icon, IconName } from './Icon';

export const T = {
  Hero: (p: React.ComponentProps<typeof Text>) => <Text {...p} style={[type.hero, p.style]} />,
  H1: (p: React.ComponentProps<typeof Text>) => <Text {...p} style={[type.h1, p.style]} />,
  H2: (p: React.ComponentProps<typeof Text>) => <Text {...p} style={[type.h2, p.style]} />,
  Label: (p: React.ComponentProps<typeof Text>) => <Text {...p} style={[type.label, p.style]} />,
  Body: (p: React.ComponentProps<typeof Text>) => <Text {...p} style={[type.body, p.style]} />,
  Small: (p: React.ComponentProps<typeof Text>) => <Text {...p} style={[type.small, p.style]} />,
  Stat: (p: React.ComponentProps<typeof Text>) => <Text {...p} style={[type.stat, p.style]} />,
};

/** Pantalla con fondo negro, márgenes seguros y scroll. */
export function Screen({ children, scroll = true, padTop = true }: { children: React.ReactNode; scroll?: boolean; padTop?: boolean }) {
  const insets = useSafeAreaInsets();
  const style = { paddingTop: padTop ? insets.top + space.md : space.md, paddingHorizontal: space.lg, paddingBottom: space.xxl };
  if (!scroll) return <View style={[styles.screen, style]}>{children}</View>;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={style} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

/** Aparición sutil (opacidad + desplazamiento corto). */
export function FadeIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: ViewStyle }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 380, delay, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [v, delay]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[]; onPress?: () => void }) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}>
      {children}
    </Pressable>
  );
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

/** Botón grande. Primary = verde neón, reservado para la acción principal. */
export function Button({ title, onPress, variant = 'primary', icon, disabled, loading, style, textStyle }: ButtonProps) {
  const primary = variant === 'primary';
  const fg = primary ? colors.neonInk : variant === 'secondary' ? colors.white : colors.muted;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        primary && styles.btnPrimary,
        variant === 'secondary' && styles.btnSecondary,
        variant === 'ghost' && styles.btnGhost,
        (disabled || loading) && { opacity: 0.45 },
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={18} color={fg} fill={icon === 'play'} />}
          <Text style={[styles.btnText, { color: fg }, variant === 'ghost' && { fontSize: 15 }, textStyle]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Pill({ text, tone = 'muted' }: { text: string; tone?: 'muted' | 'neon' }) {
  const neon = tone === 'neon';
  return (
    <View style={[styles.pill, neon && { backgroundColor: 'rgba(183,255,54,0.12)', borderColor: 'rgba(183,255,54,0.35)' }]}>
      <Text style={[styles.pillText, neon && { color: colors.neon }]}>{text}</Text>
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.section}>
      <T.Label>{title}</T.Label>
      {action && (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.neon }}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg },
  btn: {
    minHeight: 56,
    borderRadius: radius.md,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  btnPrimary: { backgroundColor: colors.neon },
  btnSecondary: { backgroundColor: colors.graphite, borderWidth: 1, borderColor: colors.line },
  btnGhost: { minHeight: 44, backgroundColor: 'transparent' },
  btnText: { fontFamily: fonts.display, fontSize: 19, letterSpacing: 1.2 },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pillText: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1, color: colors.muted },
  section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.xl, marginBottom: space.md },
});
