import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { LockedCard } from '@/components/Gate';
import { Icon } from '@/components/Icon';
import { Button, Card, Chips, Field, Screen, SectionTitle, T, TopBar } from '@/components/ui';
import { tierAllows } from '@/config/plans';
import { EXERCISES, getExercise, Muscle, MUSCLES } from '@/data/exercises';
import { estimateMinutes, Setting, WorkoutItem } from '@/data/workouts';
import { useProgress } from '@/lib/progress';
import { useSubscription } from '@/lib/subscription';
import { colors, fonts, radius, space } from '@/theme/tokens';

export default function RoutineBuilder() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { tier, hasAccess } = useSubscription();
  const { customWorkouts, saveCustomWorkout, deleteCustomWorkout } = useProgress();
  const existing = id ? customWorkouts.find((w) => w.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [setting, setSetting] = useState<Setting>(existing?.setting ?? 'Gimnasio');
  const [items, setItems] = useState<WorkoutItem[]>(existing?.items ?? []);
  const [picking, setPicking] = useState(false);
  const [muscle, setMuscle] = useState<Muscle>('Pecho');

  const close = () => router.back();
  if (!hasAccess('customRoutines')) {
    return (
      <Screen>
        <TopBar onClose={close} />
        <LockedCard required="pro" title="Crea tus rutinas" description="Elige ejercicios, series y descansos a tu medida." />
      </Screen>
    );
  }

  const update = (i: number, p: Partial<WorkoutItem>) => setItems(items.map((it, j) => (j === i ? { ...it, ...p } : it)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };

  const save = async () => {
    if (!name.trim()) return Alert.alert('Falta el nombre', 'Ponle un nombre a tu rutina.');
    if (!items.length) return Alert.alert('Sin ejercicios', 'Añade al menos un ejercicio.');
    await saveCustomWorkout({
      id: existing?.id ?? `custom-${Date.now()}`,
      name: name.trim().toUpperCase(),
      focus: [...new Set(items.map((it) => getExercise(it.exerciseId)?.muscle))].filter(Boolean).slice(0, 3).join(', '),
      level: 'Intermedio',
      minutes: estimateMinutes(items),
      tier: 'free',
      setting,
      items,
      custom: true,
    });
    close();
  };

  const remove = () =>
    Alert.alert('Eliminar rutina', 'Se quitará también de tu planificación semanal.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteCustomWorkout(existing!.id); close(); } },
    ]);

  if (picking) {
    const options = EXERCISES.filter((e) => e.muscle === muscle && tierAllows(tier, e.tier));
    return (
      <Screen>
        <TopBar title="AÑADIR EJERCICIO" onClose={() => setPicking(false)} />
        <Chips options={MUSCLES.map((m) => ({ value: m, label: m }))} value={muscle} onChange={setMuscle} />
        <View style={{ gap: space.sm, marginTop: space.lg }}>
          {options.map((e) => (
            <Card key={e.id} onPress={() => { setItems([...items, { exerciseId: e.id, sets: 3, reps: '8-12', restSec: 90 }]); setPicking(false); }} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <View style={{ flex: 1 }}>
                <T.Body>{e.name}</T.Body>
                <T.Small>{e.equipment}</T.Small>
              </View>
              <Icon name="plus" color={colors.neon} />
            </Card>
          ))}
          {!options.length && <T.Small>No hay ejercicios de este grupo en tu plan.</T.Small>}
        </View>
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <Screen>
        <TopBar title={existing ? 'EDITAR RUTINA' : 'NUEVA RUTINA'} onClose={close} />
        <Field label="NOMBRE" value={name} onChangeText={setName} placeholder="Ej.: Pecho y espalda" maxLength={32} />
        <T.Label style={{ marginTop: space.lg, marginBottom: space.sm }}>DÓNDE ENTRENAS</T.Label>
        <Chips options={(['Gimnasio', 'Mancuernas', 'Sin material'] as Setting[]).map((s) => ({ value: s, label: s }))} value={setting} onChange={setSetting} />

        <SectionTitle title={`EJERCICIOS · ~${estimateMinutes(items)} MIN`} />
        <View style={{ gap: space.sm }}>
          {items.map((it, i) => (
            <Card key={`${it.exerciseId}-${i}`}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <T.Body style={{ flex: 1, fontFamily: fonts.semibold }}>{getExercise(it.exerciseId)?.name}</T.Body>
                <Pressable onPress={() => move(i, -1)} hitSlop={8} accessibilityLabel="Subir"><View style={{ transform: [{ rotate: '-90deg' }] }}><Icon name="chevron" size={18} color={colors.muted} /></View></Pressable>
                <Pressable onPress={() => move(i, 1)} hitSlop={8} accessibilityLabel="Bajar"><View style={{ transform: [{ rotate: '90deg' }] }}><Icon name="chevron" size={18} color={colors.muted} /></View></Pressable>
                <Pressable onPress={() => setItems(items.filter((_, j) => j !== i))} hitSlop={8} accessibilityLabel="Quitar"><Icon name="trash" size={18} color={colors.muted} /></Pressable>
              </View>
              <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
                <Mini label="SERIES" value={String(it.sets)} onChange={(v) => update(i, { sets: Math.max(1, Math.min(10, parseInt(v, 10) || 1)) })} />
                <Mini label="REPS" value={it.reps} onChange={(v) => update(i, { reps: v.slice(0, 8) || '10' })} text />
                <Mini label="DESCANSO (S)" value={String(it.restSec)} onChange={(v) => update(i, { restSec: Math.max(0, Math.min(600, parseInt(v, 10) || 0)) })} />
              </View>
            </Card>
          ))}
          <Card onPress={() => setPicking(true)} style={styles.add}>
            <Icon name="plus" color={colors.neon} />
            <T.Body>Añadir ejercicio</T.Body>
          </Card>
        </View>
        {existing && <Button title="Eliminar rutina" variant="ghost" onPress={remove} style={{ marginTop: space.lg }} />}
        <View style={{ height: 120 }} />
      </Screen>
      <View style={styles.footer}>
        <Button title="GUARDAR RUTINA" icon="check" onPress={save} />
      </View>
    </View>
  );
}

function Mini({ label, value, onChange, text }: { label: string; value: string; onChange: (v: string) => void; text?: boolean }) {
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <T.Label style={{ fontSize: 10 }}>{label}</T.Label>
      <TextInput value={value} onChangeText={onChange} keyboardType={text ? 'default' : 'number-pad'} style={styles.mini} selectTextOnFocus />
    </View>
  );
}

const styles = StyleSheet.create({
  add: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line, backgroundColor: 'transparent' },
  mini: { height: 44, borderRadius: radius.sm, backgroundColor: colors.graphite, borderWidth: 1, borderColor: colors.line, color: colors.white, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 16 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: space.lg, paddingBottom: space.xxl, backgroundColor: 'rgba(10,10,11,0.97)', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
