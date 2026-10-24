import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DemoThumb } from '@/components/ExerciseDemo';
import { Icon } from '@/components/Icon';
import { Card, Chips, Field, Pill, T, TopBar } from '@/components/ui';
import { tierAllows } from '@/config/plans';
import { EXERCISES, ExerciseInfo, Muscle, MUSCLES } from '@/data/exercises';
import { useSubscription } from '@/lib/subscription';
import { colors, space } from '@/theme/tokens';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default function Library() {
  const { tier } = useSubscription();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState<Muscle | 'Todos'>('Todos');

  const list = useMemo(
    () => EXERCISES.filter((e) => (muscle === 'Todos' || e.muscle === muscle) && norm(`${e.name} ${e.equipment}`).includes(norm(q))),
    [q, muscle],
  );

  const renderItem = useCallback(({ item: e }: { item: ExerciseInfo }) => {
    const locked = !tierAllows(tier, e.tier);
    return (
      <Card onPress={() => router.push(`/exercise/${e.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm, marginBottom: space.sm }}>
        <DemoThumb exercise={e} size={72} />
        <View style={{ flex: 1 }}>
          <T.Body>{e.name}</T.Body>
          <T.Small>{e.muscle} · {e.equipment}</T.Small>
        </View>
        {locked ? <Pill text={e.tier.toUpperCase()} tone="neon" /> : <Icon name="chevron" size={18} color={colors.muted} />}
      </Card>
    );
  }, [tier]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <FlatList
        data={list}
        keyExtractor={(e) => e.id}
        renderItem={renderItem}
        // Solo se dibujan las filas visibles (y unas pocas más): la lista no carga todo de golpe.
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + space.md, paddingHorizontal: space.lg, paddingBottom: space.xxl + insets.bottom }}
        ListHeaderComponent={
          <View>
            <TopBar title="BIBLIOTECA" onClose={() => router.back()} />
            <T.H1>EJERCICIOS</T.H1>
            <T.Small style={{ marginTop: 4, marginBottom: space.lg }}>{EXERCISES.length} ejercicios con demostración animada y técnica paso a paso.</T.Small>
            <Field label="BUSCAR" value={q} onChangeText={setQ} placeholder="Sentadilla, remo, polea…" />
            <View style={{ marginVertical: space.lg }}>
              <Chips options={[{ value: 'Todos' as const, label: 'Todos' }, ...MUSCLES.map((m) => ({ value: m, label: m }))]} value={muscle} onChange={setMuscle} />
            </View>
          </View>
        }
        ListEmptyComponent={<T.Small>No hay ejercicios con ese nombre.</T.Small>}
      />
    </View>
  );
}
