import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LockedCard } from '@/components/Gate';
import { Icon } from '@/components/Icon';
import { Button, Card, Screen, T } from '@/components/ui';
import { tierAllows } from '@/config/plans';
import { getExercise } from '@/data/exercises';
import { getWorkout, totalSets } from '@/data/workouts';
import { newlyUnlocked } from '@/lib/achievements';
import { saveStrengthWorkout } from '@/lib/health';
import { LoggedSet, useProgress } from '@/lib/progress';
import { useSubscription } from '@/lib/subscription';
import { estimate1RM, suggestNext, topReps } from '@/lib/training';
import { colors, fonts, radius, space } from '@/theme/tokens';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
type SetState = { done: boolean; reps: string; kg: string };

export default function WorkoutSession() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tier, hasAccess } = useSubscription();
  const { logSession, sessions, customWorkouts, settings } = useProgress();
  const workout = getWorkout(String(id), customWorkouts);
  const insets = useSafeAreaInsets();

  const [state, setState] = useState<Record<string, SetState[]>>({});
  const [elapsed, setElapsed] = useState(0);
  const [rest, setRest] = useState(0);
  const [saving, setSaving] = useState(false);
  const startedAt = useRef(new Date());

  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current.getTime()) / 1000));
      setRest((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const counts = useMemo(() => {
    const all = workout ? totalSets(workout) : 0;
    const completed = Object.values(state).reduce((a, arr) => a + arr.filter((s) => s.done).length, 0);
    return { all, completed };
  }, [state, workout]);

  if (!workout) {
    return (
      <Screen>
        <T.H1>RUTINA NO ENCONTRADA</T.H1>
        <Button title="VOLVER" onPress={() => router.back()} style={{ marginTop: space.xl }} />
      </Screen>
    );
  }

  const canUse = tierAllows(tier, workout.tier);
  const tracksLoad = hasAccess('personalRecords');
  const autoProg = hasAccess('autoProgression');

  const getSets = (exId: string, n: number, reps: string) =>
    state[exId] ?? Array.from({ length: n }, () => ({ done: false, reps: String(topReps(reps) ?? ''), kg: '' }));

  const patch = (exId: string, n: number, reps: string, i: number, p: Partial<SetState>, restSec?: number) => {
    const arr = getSets(exId, n, reps).map((s) => ({ ...s }));
    // Al escribir el peso de la primera serie, se copia a las siguientes que estén vacías.
    if (p.kg !== undefined && i === 0) arr.forEach((s, j) => j > 0 && !s.kg && !s.done && (s.kg = p.kg!));
    arr[i] = { ...arr[i], ...p };
    if (p.done && restSec) setRest(restSec);
    setState({ ...state, [exId]: arr });
  };

  const finish = () => {
    if (counts.completed === 0) {
      Alert.alert('Sin series completadas', 'Marca al menos una serie para guardar la sesión.');
      return;
    }
    const doSave = async () => {
      setSaving(true);
      const sets: LoggedSet[] = [];
      for (const it of workout.items) {
        for (const s of state[it.exerciseId] ?? []) {
          if (!s.done) continue;
          const reps = parseInt(s.reps, 10);
          const kg = parseFloat(s.kg.replace(',', '.'));
          sets.push({
            exerciseId: it.exerciseId,
            reps: Number.isFinite(reps) && reps > 0 ? reps : undefined,
            weightKg: tracksLoad && Number.isFinite(kg) && kg > 0 ? kg : undefined,
          });
        }
      }
      const end = new Date();
      const before = sessions;
      const saved = await logSession({ workoutId: workout.id, workoutName: workout.name, minutes: Math.max(1, Math.round(elapsed / 60)), sets });
      const unlocked = newlyUnlocked(before, [saved, ...before], settings.weeklyGoal);
      let healthNote = '';
      if (settings.healthSync && hasAccess('healthSync')) {
        healthNote = (await saveStrengthWorkout(startedAt.current, end)) ? ' Guardado también en Apple Salud.' : '';
      }
      setSaving(false);
      const badges = unlocked.length ? `\n\n🏆 ${unlocked.length === 1 ? 'Logro desbloqueado' : 'Logros desbloqueados'}: ${unlocked.map((a) => a.title).join(', ')}` : '';
      Alert.alert(unlocked.length ? '¡NUEVO LOGRO!' : 'Sesión guardada', `${counts.completed} series en ${mmss(elapsed)}.${healthNote}${badges}`);
      router.back();
    };
    if (counts.completed < counts.all) {
      Alert.alert('¿Terminar ya?', `Has completado ${counts.completed} de ${counts.all} series. Se guardará lo que has hecho.`, [
        { text: 'Seguir entrenando', style: 'cancel' },
        { text: 'Guardar', onPress: doSave },
      ]);
    } else doSave();
  };

  const exit = () => {
    if (counts.completed === 0) return router.back();
    Alert.alert('¿Salir sin guardar?', 'Perderás las series de esta sesión.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <Screen>
        <View style={styles.top}>
          <Pressable onPress={exit} hitSlop={12} accessibilityLabel="Cerrar">
            <Icon name="close" color={colors.muted} />
          </Pressable>
          <Text style={styles.timer}>{mmss(elapsed)}</Text>
        </View>
        <T.Hero style={{ marginTop: space.lg }}>{workout.name}</T.Hero>
        <T.Small>{workout.focus} · {counts.completed}/{counts.all} series</T.Small>
        <View style={styles.bar}><View style={[styles.barFill, { width: `${(counts.completed / Math.max(1, counts.all)) * 100}%` as `${number}%` }]} /></View>

        {!canUse ? (
          <View style={{ marginTop: space.xl }}>
            <LockedCard required={workout.tier} title="Rutina bloqueada" description="Esta rutina forma parte de un plan superior." />
          </View>
        ) : (
          workout.items.map((it, n) => {
            const e = getExercise(it.exerciseId);
            const sets = getSets(it.exerciseId, it.sets, it.reps);
            const weighted = !!e?.weighted && tracksLoad;
            const suggestion = autoProg && e?.weighted ? suggestNext(it.exerciseId, it, sessions) : undefined;
            const best = sets.reduce((m, s) => Math.max(m, s.done ? estimate1RM(parseFloat(s.kg.replace(',', '.')), parseInt(s.reps, 10)) ?? 0 : 0), 0);
            return (
              <Card key={it.exerciseId + n} style={{ marginTop: space.md }}>
                <Pressable onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: it.exerciseId, sets: String(it.sets), reps: it.reps, rest: String(it.restSec), from: workout.name } })} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
                  <Text style={styles.num}>{String(n + 1).padStart(2, '0')}</Text>
                  <View style={{ flex: 1 }}>
                    <T.H2>{e?.name ?? it.exerciseId}</T.H2>
                    <T.Small>{it.sets} × {it.reps} · descanso {it.restSec}s · {e?.muscle}</T.Small>
                    {e && <T.Small style={{ color: colors.white, marginTop: 4 }}>{e.cue}</T.Small>}
                  </View>
                  <Icon name="book" size={18} color={colors.muted} />
                </Pressable>

                {suggestion && (
                  <View style={styles.suggest}>
                    <Icon name="spark" size={16} color={colors.neon} />
                    <T.Small style={{ flex: 1, color: colors.white }}>
                      Hoy: <Text style={{ color: colors.neon, fontFamily: fonts.semibold }}>{String(suggestion.weightKg).replace('.', ',')} kg</Text>. {suggestion.reason}
                    </T.Small>
                  </View>
                )}

                <View style={styles.head}>
                  <Text style={[styles.headText, { width: 44 }]}>SERIE</Text>
                  {weighted && <Text style={[styles.headText, { flex: 1 }]}>KG</Text>}
                  <Text style={[styles.headText, { flex: 1 }]}>REPS</Text>
                  <View style={{ width: 44 }} />
                </View>
                {sets.map((s, i) => (
                  <View key={i} style={[styles.setRow, s.done && styles.setRowDone]}>
                    <Text style={[styles.setNum, { width: 44 }]}>{i + 1}</Text>
                    {weighted && (
                      <TextInput
                        value={s.kg}
                        onChangeText={(v) => patch(it.exerciseId, it.sets, it.reps, i, { kg: v })}
                        placeholder={suggestion ? String(suggestion.weightKg) : '—'}
                        placeholderTextColor={colors.muted}
                        keyboardType="decimal-pad"
                        style={styles.input}
                        accessibilityLabel={`Peso serie ${i + 1}`}
                      />
                    )}
                    <TextInput
                      value={s.reps}
                      onChangeText={(v) => patch(it.exerciseId, it.sets, it.reps, i, { reps: v.replace(/\D/g, '') })}
                      placeholder={it.reps}
                      placeholderTextColor={colors.muted}
                      keyboardType="number-pad"
                      style={styles.input}
                      accessibilityLabel={`Repeticiones serie ${i + 1}`}
                    />
                    <Pressable
                      onPress={() => patch(it.exerciseId, it.sets, it.reps, i, { done: !s.done }, it.restSec)}
                      style={[styles.check, s.done && styles.checkOn]}
                      accessibilityLabel={`Completar serie ${i + 1}`}
                    >
                      <Icon name="check" size={18} color={s.done ? colors.neonInk : colors.muted} />
                    </Pressable>
                  </View>
                ))}
                {best > 0 && <T.Small style={{ marginTop: space.sm }}>1RM estimado hoy: {String(best).replace('.', ',')} kg</T.Small>}
              </Card>
            );
          })
        )}
        {!tracksLoad && canUse && (
          <Card onPress={() => router.push('/paywall')} style={{ marginTop: space.md, backgroundColor: colors.graphite }}>
            <T.Small>Con <Text style={{ color: colors.neon }}>PRO</Text> registras el peso de cada serie, ves tus marcas y tu 1RM estimado.</T.Small>
          </Card>
        )}
        <View style={{ height: 120 }} />
      </Screen>

      {canUse && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
          {rest > 0 && (
            <Pressable onPress={() => setRest(0)} style={styles.rest}>
              <T.Label>DESCANSO</T.Label>
              <Text style={styles.restTime}>{mmss(rest)}</Text>
              <View style={{ flexDirection: 'row', gap: space.md }}>
                <Pressable onPress={() => setRest(rest + 15)} hitSlop={8}><T.Small style={{ color: colors.white }}>+15 s</T.Small></Pressable>
                <T.Small>Saltar</T.Small>
              </View>
            </Pressable>
          )}
          <Button title="FINALIZAR ENTRENAMIENTO" icon="check" onPress={finish} loading={saving} />
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
  suggest: { flexDirection: 'row', gap: space.sm, alignItems: 'center', marginTop: space.md, padding: space.sm, borderRadius: radius.sm, backgroundColor: 'rgba(183,255,54,0.08)' },
  head: { flexDirection: 'row', gap: space.sm, marginTop: space.lg, marginBottom: 4 },
  headText: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 1, color: colors.muted, textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 4, borderRadius: radius.sm },
  setRowDone: { backgroundColor: 'rgba(183,255,54,0.06)' },
  setNum: { fontFamily: fonts.display, fontSize: 18, color: colors.white, textAlign: 'center' },
  input: { flex: 1, height: 44, borderRadius: radius.sm, backgroundColor: colors.graphite, color: colors.white, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 16, borderWidth: 1, borderColor: colors.line },
  check: { width: 44, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.neon, borderColor: colors.neon },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, paddingTop: space.md, backgroundColor: 'rgba(10,10,11,0.96)', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, gap: space.sm },
  rest: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: space.lg, paddingVertical: space.sm },
  restTime: { fontFamily: fonts.display, fontSize: 26, color: colors.white },
});
