import { useFocusEffect } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import { Icon } from '@/components/Icon';
import { MuscleMap } from '@/components/MuscleMap';
import { T } from '@/components/ui';
import { DEMOS, FOCUS_BY_MUSCLE, VIEW_LABEL } from '@/data/demos';
import type { ExerciseInfo } from '@/data/exercises';
import { EXERCISE_MEDIA } from '@/data/media';
import { cycleMs, Demo, draw, frameBox, groundLine, keyframeMs, sample, Shape } from '@/lib/demoEngine';
import { colors, fonts, radius, space } from '@/theme/tokens';

/** Dibuja un instante de la demostración vectorial. */
const DemoSvg = memo(function DemoSvg({ demo, ms, focus, width, height }: { demo: Demo; ms: number; focus: ExerciseInfo['muscle']; width: number; height: number }) {
  const box = frameBox(demo);
  const shapes: Shape[] = useMemo(() => {
    const { joints } = sample(demo, ms);
    const list = draw(demo, joints, demo.focus ?? FOCUS_BY_MUSCLE[focus] ?? []);
    const g = groundLine(demo, box);
    return g ? [g, ...list] : list;
  }, [demo, ms, focus, box]);
  return (
    <Svg width={width} height={height} viewBox={box.join(' ')}>
      {shapes.map((s, i) =>
        s.t === 'line' ? <Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.c} strokeWidth={s.w} strokeLinecap="round" />
        : s.t === 'circle' ? <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} stroke={s.stroke} strokeWidth={s.sw} />
        : <Rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} fill={s.fill} stroke={s.stroke} strokeWidth={s.sw} />,
      )}
    </Svg>
  );
});

/** Miniatura fija (posición final del movimiento) para listas: no anima ni descarga nada. */
export const DemoThumb = memo(function DemoThumb({ exercise, size = 64 }: { exercise: ExerciseInfo; size?: number }) {
  const demo = DEMOS[exercise.id];
  const h = (size * 5) / 6;
  if (!demo) return <View style={[styles.thumb, { width: size, height: h }]}><MuscleMap primary={exercise.muscle} height={h - 6} compact /></View>;
  return (
    <View style={[styles.thumb, { width: size, height: h }]}>
      <DemoSvg demo={demo} ms={keyframeMs(demo, 1)} focus={exercise.muscle} width={size} height={h} />
    </View>
  );
});

/**
 * Demostración animada de un ejercicio, en bucle, con controles de reproducción.
 * Prioridad: vídeo/GIF con licencia (src/data/media.ts) → animación vectorial propia
 * (src/data/demos.ts) → aviso de «demostración en preparación» con el mapa muscular.
 */
export function ExerciseDemo({ exercise }: { exercise: ExerciseInfo }) {
  const demo = DEMOS[exercise.id];
  const media = EXERCISE_MEDIA[exercise.id];
  const [width, setWidth] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [slow, setSlow] = useState(false);
  const [ms, setMs] = useState(0);
  const [mediaState, setMediaState] = useState<'loading' | 'ready' | 'error'>('loading');
  const focused = useRef(true);
  const active = useRef(AppState.currentState === 'active');
  const clock = useRef({ ms: 0, last: 0 });
  const total = demo ? cycleMs(demo) : 1;

  // Respeta «Reducir movimiento»: empieza en pausa.
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((r) => { if (r) setPlaying(false); }).catch(() => {});
  }, []);

  // Solo anima con la pantalla visible y la app en primer plano.
  useFocusEffect(useCallback(() => { focused.current = true; return () => { focused.current = false; }; }, []));
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { active.current = s === 'active'; });
    return () => sub.remove();
  }, []);

  const showVector = !!demo && (!media || mediaState !== 'ready');
  useEffect(() => {
    if (!demo || !playing || !showVector) return;
    let raf = 0;
    clock.current.last = 0;
    const tick = (now: number) => {
      const c = clock.current;
      if (c.last && focused.current && active.current) c.ms = (c.ms + (now - c.last) * (slow ? 0.5 : 1)) % total;
      // ~30 fps: suficiente para un movimiento fluido y ahorra batería.
      if (!c.last || now - c.last >= 30) { c.last = now; setMs(c.ms); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [demo, playing, slow, total, showVector]);

  const restart = () => { clock.current.ms = 0; setMs(0); setPlaying(true); };
  const height = width ? (width * 5) / 6 : 0;

  if (!demo && !media) {
    return (
      <View style={[styles.stage, styles.empty]}>
        <MuscleMap primary={exercise.muscle} secondary={exercise.secondary} height={150} />
        <T.Small style={{ textAlign: 'center', marginTop: space.md }}>Demostración en preparación. Mientras tanto, sigue los pasos de abajo.</T.Small>
      </View>
    );
  }

  return (
    <View>
      <View
        style={styles.stage}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Demostración animada: ${exercise.name}`}
      >
        {width > 0 && showVector && demo ? <DemoSvg demo={demo} ms={ms} focus={exercise.muscle} width={width} height={height} /> : null}
        {width > 0 && media && mediaState !== 'error' ? (
          <Image
            source={{ uri: media.uri }}
            style={[StyleSheet.absoluteFill, { opacity: mediaState === 'ready' ? 1 : 0 }]}
            resizeMode="contain"
            onLoad={() => setMediaState('ready')}
            onError={() => setMediaState('error')}
          />
        ) : null}
        {width > 0 && !demo && media && mediaState === 'loading' ? <View style={[StyleSheet.absoluteFill, styles.center]}><T.Small>Cargando demostración…</T.Small></View> : null}
        <View style={styles.badge}>
          <T.Label style={styles.badgeText}>
            {media && mediaState === 'ready' ? 'VÍDEO' : `ANIMACIÓN · ${(demo?.caption ?? VIEW_LABEL[demo?.view ?? 'side']).toUpperCase()}`}
          </T.Label>
        </View>
      </View>

      {showVector && demo ? (
        <>
          <View style={styles.track}><View style={[styles.fill, { width: `${(ms / total) * 100}%` }]} /></View>
          <View style={styles.controls}>
            <Ctrl icon={playing ? 'pause' : 'play'} label={playing ? 'Pausa' : 'Reproducir'} onPress={() => setPlaying((p) => !p)} primary />
            <Ctrl icon="refresh" label="Repetir" onPress={restart} />
            <Ctrl text={slow ? '0,5×' : '1×'} label={slow ? 'Velocidad lenta' : 'Velocidad normal'} onPress={() => setSlow((s) => !s)} />
            <T.Small style={{ flex: 1, textAlign: 'right' }}>{(total / 1000).toFixed(1).replace('.', ',')} s por repetición</T.Small>
          </View>
        </>
      ) : null}

      {media && mediaState === 'error' ? (
        <T.Small style={{ marginTop: 6, color: colors.danger }}>No se pudo cargar el vídeo; se muestra la animación de VYTRON.</T.Small>
      ) : media && mediaState === 'ready' ? (
        <T.Small style={{ marginTop: 6 }} onPress={media.link ? () => Linking.openURL(media.link!) : undefined}>Vídeo: {media.author} · {media.license}</T.Small>
      ) : null}
    </View>
  );
}

function Ctrl({ icon, text, label, onPress, primary }: { icon?: 'play' | 'pause' | 'refresh'; text?: string; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.ctrl, primary && styles.ctrlPrimary, pressed && { opacity: 0.7 }]}
    >
      {icon ? <Icon name={icon} size={18} color={primary ? colors.neonInk : colors.white} fill={icon === 'play'} /> : <T.Label style={{ color: colors.white, letterSpacing: 0.5, fontFamily: fonts.semibold }}>{text}</T.Label>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: { width: '100%', aspectRatio: 6 / 5, borderRadius: radius.lg, backgroundColor: colors.graphite, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  empty: { alignItems: 'center', justifyContent: 'center', padding: space.lg },
  center: { alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: space.md, left: space.md, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: 'rgba(10,10,11,0.72)' },
  badgeText: { fontSize: 10, color: colors.neon },
  track: { height: 3, borderRadius: 2, backgroundColor: colors.line, marginTop: space.md, overflow: 'hidden' },
  fill: { height: 3, backgroundColor: colors.neon },
  controls: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
  ctrl: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  ctrlPrimary: { backgroundColor: colors.neon },
  thumb: { borderRadius: radius.sm, backgroundColor: colors.graphite, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
