import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gate } from '@/components/Gate';
import { Icon } from '@/components/Icon';
import { Button, Card, Screen, T } from '@/components/ui';
import { tierAllows } from '@/config/plans';
import { getWorkout } from '@/data/workouts';
import { LoggedSet, useProgress } from '@/lib/progress';
import { useSubscription } from '@/lib/subscription';
import { colors, fonts, radius, space } from '@/theme/tokens';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function WorkoutSession() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = getWorkout(String(id));
  const { tier, hasAccess } = useSubscription();
  const { logSession } = useProgress();
  const insets = useSafeAreaInsets();

  const [done, setDone] = useState<Record<string, boolean[]>>({});
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [elapsed, setElapsed] = useState(0);
  const [rest, setRest] = useState(0);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
      setRest((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const totals = useMemo(() => {
    if (!workout) return { all: 0, completed: 0 };
    const all = workout.exercises.reduce((a, e) => a + e.sets, 0);
    const completed = Object.values(done).reduce((a, arr) => a + arr.filter(Boolean).length, 0);
    return { all, completed };
  }, [done, workout]);

  if (!workout) {
    return (
      <Screen>
        <T.H1>RUTINA NO ENCONTRADA</T.H1>
        <Button title="VOLVER" onPress={() => router.back()} style={{ marginTop: space.xl }} />
      </Screen>
    );
  }

  const canUse = tierAllows(tier, workout.tier);
  const tracksPR = hasAccess('personalRecords');

  const toggle = (exId: string, i: number, sets: number, restSec: number) => {
    const arr = [...(done[exId] ?? Array(sets).fill(false))];
    arr[i] = !arr[i];
    if (arr[i]) setRest(restSec);
    setDone({ ...done, [exId]: arr });
  };

  const finish = async () => {
    if (totals.completed === 0) {
      Alert.alert('Sin series completadas', 'Marca al menos una serie para guardar la sesión.');
      return;
    }
    const sets: LoggedSet[] = [];
    for (const ex of workout.exercises) {
      const kg = tracksPR ? parseFloat((weights[ex.id] ?? '').replace(',', '.')) : NaN;
      (done[ex.id] ?? []).forEach((d) => d && sets.push({ exerciseId: ex.id, weightKg: Number.isFinite(kg) && kg > 0 ? kg : undefined }));
    }
    await logSession({ workoutId: workout.id, minutes: Math.max(1, Math.round(elapsed / 60)), sets });
    Alert.alert('Sesión guardada', `${totals.completed} series en ${mmss(elapsed)}. Buen trabajo.`);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <Screen>
        <View style={styles.top}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Cerrar">
            <Icon name="close" color={colors.muted} />
          </Pressable>
          <Text style={styles.timer}>{mmss(elapsed)}</Text>
        </View>
        <T.Hero style={{ marginTop: space.lg }}>{workout.name}</T.Hero>
        <T.Small>{workout.focus} · {totals.completed}/{totals.all} series</T.Small>
        <View style={styles.bar}><View style={[styles.barFill, { width: `${(totals.completed / totals.all) * 100}%` as `${number}%` }]} /></View>

        {!canUse ? (
          <View style={{ marginTop: space.xl }}>
            <Gate feature={workout.tier === 'premium' ? 'customPlanning' : 'allRoutines'} title="Rutina bloqueada" description="Esta rutina forma parte de un plan superior.">
              <View />
            </Gate>
          </View>
        ) : (
          workout.exercises.map((ex, n) => {
            const arr = done[ex.id] ?? Array(ex.sets).fill(false);
            return (
              <Card key={ex.id} style={{ marginTop: space.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
                  <Text style={styles.num}>{String(n + 1).padStart(2, '0')}</Text>
                  <View style={{ flex: 1 }}>
                    <T.H2>{ex.name}</T.H2>
                    <T.Small>{ex.sets} × {ex.reps} · descanso {ex.restSec}s</T.Small>
                    <T.Small style={{ color: colors.white, marginTop: 4 }}>{ex.cue}</T.Small>
                  </View>
                </View>
                <View style={styles.sets}>
                  {arr.map((on, i) => (
                    <Pressable key={i} onPress={() => toggle(ex.id, i, ex.sets, ex.restSec)} style={[styles.set, on && styles.setOn]} accessibilityLabel={`Serie ${i + 1}`}>
                      {on ? <Icon name="check" size={18} color={colors.neonInk} /> : <Text style={styles.setText}>{i + 1}</Text>}
                    </Pressable>
                  ))}
                  {ex.tracksWeight && tracksPR && (
                    <TextInput
                      value={weights[ex.id] ?? ''}
                      onChangeText={(v) => setWeights((w) => ({ ...w, [ex.id]: v }))}
                      placeholder="kg"
                      placeholderTextColor={colors.muted}
                      keyboardType="decimal-pad"
                      style={styles.kg}
                    />
                  )}
                </View>
              </Card>
            );
          })
        )}
        <View style={{ height: 110 }} />
      </Screen>

      {canUse && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
          {rest > 0 && (
            <Pressable onPress={() => setRest(0)} style={styles.rest}>
              <T.Label>DESCANSO</T.Label>
              <Text style={styles.restTime}>{mmss(rest)}</Text>
              <T.Small>Saltar</T.Small>
            </Pressable>
          )}
          <Button title="FINALIZAR ENTRENAMIENTO" icon="check" onPress={finish} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timer: { fontFamily: fonts.display, fontSize: 22, color: colors.neon, letterSpacing: 1 },
  bar: { height: 4, backgroundColor: colors.card, borderRadius: 2, marginTop: space.md, overflow: 'hidden' },
  barFill: { height: 4, backgroundColor: colors.neon },
  num: { fontFamily: fonts.display, fontSize: 22, color: colors.muted, width: 30 },
  sets: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.lg, alignItems: 'center' },
  set: { width: 44, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center' },
  setOn: { backgroundColor: colors.neon, borderColor: colors.neon },
  setText: { fontFamily: fonts.semibold, color: colors.white },
  kg: { marginLeft: 'auto', width: 76, height: 44, borderRadius: radius.sm, backgroundColor: colors.graphite, color: colors.white, textAlign: 'center', fontFamily: fonts.semibold, borderWidth: 1, borderColor: colors.line },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, paddingTop: space.md, backgroundColor: 'rgba(10,10,11,0.96)', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, gap: space.sm },
  rest: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: space.lg, paddingVertical: space.sm },
  restTime: { fontFamily: fonts.display, fontSize: 26, color: colors.white },
});
