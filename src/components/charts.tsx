import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts, radius } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Anillo de progreso animado (0-1). */
export function ProgressRing({ value, size = 112, stroke = 10, children }: { value: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: Math.max(0, Math.min(1, value)), duration: 700, useNativeDriver: false }).start();
  }, [value, anim]);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.line} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.neon}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={anim.interpolate({ inputRange: [0, 1], outputRange: [c, 0] })}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** Días de la semana: verde = entrenado, contorno = hoy. */
export function WeekStrip({ trained }: { trained: boolean[] }) {
  const today = (new Date().getDay() + 6) % 7;
  return (
    <View style={styles.week}>
      {DAYS.map((d, i) => (
        <View key={d} style={{ alignItems: 'center', gap: 6 }}>
          <View style={[styles.dot, trained[i] && styles.dotOn, i === today && !trained[i] && styles.dotToday]} />
          <Text style={[styles.day, i === today && { color: colors.white }]}>{d}</Text>
        </View>
      ))}
    </View>
  );
}

/** Barras de sesiones por semana; la última (actual) en verde. */
export function WeekBars({ data, goal }: { data: { label: string; value: number }[]; goal: number }) {
  const max = Math.max(goal, ...data.map((d) => d.value), 1);
  const H = 120;
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: false }).start();
  }, [anim]);
  return (
    <View>
      <View style={{ height: H, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <View style={[styles.goalLine, { bottom: (goal / max) * H }]} />
        {data.map((d, i) => {
          const last = i === data.length - 1;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: H }}>
              <Animated.View
                style={{
                  width: '100%',
                  borderRadius: 6,
                  backgroundColor: last ? colors.neon : d.value >= goal ? '#5E7A2A' : '#3A3A40',
                  height: anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(4, (d.value / max) * H)] }),
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        {data.map((d, i) => (
          <Text key={i} style={[styles.day, { flex: 1, textAlign: 'center', fontSize: 10 }]}>{d.label}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  dot: { width: 30, height: 30, borderRadius: radius.pill, backgroundColor: colors.graphite, borderWidth: 1, borderColor: colors.line },
  dotOn: { backgroundColor: colors.neon, borderColor: colors.neon },
  dotToday: { borderColor: colors.white },
  day: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderStyle: Platform.OS === 'web' ? 'dashed' : 'solid',
    borderTopWidth: 1,
    borderColor: 'rgba(183,255,54,0.35)',
  },
});
