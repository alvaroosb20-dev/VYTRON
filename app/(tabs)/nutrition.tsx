import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ProgressRing } from '@/components/charts';
import { LockedCard } from '@/components/Gate';
import { Icon } from '@/components/Icon';
import { Button, Card, FadeIn, Screen, SectionTitle, T } from '@/components/ui';
import { dailyTarget, dayTotals, FoodEntry, Meal, MEAL_LABEL, useNutrition } from '@/lib/nutrition';
import { useProgress } from '@/lib/progress';
import { useSubscription } from '@/lib/subscription';
import { colors, fonts, space } from '@/theme/tokens';

const MEALS: Meal[] = ['desayuno', 'comida', 'snack', 'cena'];

export default function Nutrition() {
  const { hasAccess } = useSubscription();
  const { body } = useProgress();
  const { entries, remove } = useNutrition();
  const [offset, setOffset] = useState(0); // días hacia atrás

  if (!hasAccess('nutrition')) return <NutritionLocked />;

  const day = new Date();
  day.setDate(day.getDate() - offset);
  const totals = dayTotals(entries, day);
  const target = dailyTarget(body);
  const label = offset === 0 ? 'HOY' : offset === 1 ? 'AYER' : day.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' }).toUpperCase();

  return (
    <Screen>
      <View style={styles.header}>
        <T.H1>NUTRICIÓN</T.H1>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Pressable onPress={() => setOffset(offset + 1)} hitSlop={10} accessibilityLabel="Día anterior">
            <View style={{ transform: [{ rotate: '180deg' }] }}><Icon name="chevron" color={colors.muted} /></View>
          </Pressable>
          <T.Label style={{ color: colors.white }}>{label}</T.Label>
          <Pressable onPress={() => setOffset(Math.max(0, offset - 1))} hitSlop={10} disabled={offset === 0} accessibilityLabel="Día siguiente">
            <Icon name="chevron" color={offset === 0 ? colors.line : colors.muted} />
          </Pressable>
        </View>
      </View>

      <FadeIn>
        <Card style={{ marginTop: space.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xl }}>
            <ProgressRing value={target ? totals.kcal / target.kcal : 0}>
              <T.Stat style={{ fontSize: 28 }}>{totals.kcal}</T.Stat>
              <T.Small>kcal</T.Small>
            </ProgressRing>
            <View style={{ flex: 1, gap: space.sm }}>
              {target ? (
                <>
                  <T.H2>{totals.kcal <= target.kcal ? `QUEDAN ${target.kcal - totals.kcal}` : `+${totals.kcal - target.kcal} SOBRE`} KCAL</T.H2>
                  <Macro label="Proteína" value={totals.protein} target={target.protein} />
                  <Macro label="Carbohidratos" value={totals.carbs} target={target.carbs} />
                  <Macro label="Grasas" value={totals.fat} target={target.fat} />
                </>
              ) : (
                <Pressable onPress={() => router.push('/body')}>
                  <T.H2 style={{ fontSize: 19 }}>CALCULA TU OBJETIVO</T.H2>
                  <T.Small>Añade edad, altura, peso y actividad para estimar tus calorías diarias.</T.Small>
                  <T.Small style={{ color: colors.neon, marginTop: 6, fontFamily: fonts.semibold }}>Completar datos  →</T.Small>
                </Pressable>
              )}
            </View>
          </View>
        </Card>
      </FadeIn>

      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
        <Button title="ESCANEAR COMIDA" icon="camera" onPress={() => router.push('/food-scan')} style={{ flex: 1 }} />
        <Button title="" icon="plus" variant="secondary" onPress={() => router.push({ pathname: '/food-scan', params: { mode: 'manual' } })} style={{ width: 56, paddingHorizontal: 0 }} />
      </View>

      {MEALS.map((m) => {
        const list = totals.list.filter((e) => e.meal === m);
        if (!list.length) return null;
        return (
          <View key={m}>
            <SectionTitle title={`${MEAL_LABEL[m].toUpperCase()} · ${Math.round(list.reduce((a, e) => a + e.kcal, 0))} KCAL`} />
            <Card style={{ paddingVertical: space.xs }}>
              {list.map((e, i) => <EntryRow key={e.id} e={e} line={i > 0} onDelete={() => remove(e.id)} />)}
            </Card>
          </View>
        );
      })}

      {totals.list.length === 0 && (
        <Card style={{ marginTop: space.xl }}>
          <T.H2>SIN REGISTROS {offset === 0 ? 'HOY' : 'ESTE DÍA'}</T.H2>
          <T.Small style={{ marginTop: 4 }}>Haz una foto a tu plato: la app identifica los alimentos y estima calorías y macros. Puedes corregirlo antes de guardar.</T.Small>
        </Card>
      )}

      <SectionTitle title="RECETAS" action="Ver todas" onAction={() => router.push('/recipes')} />
      <Card onPress={() => router.push('/recipes')} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Icon name="book" color={colors.neon} />
        <View style={{ flex: 1 }}>
          <T.Body style={{ fontFamily: fonts.semibold }}>Recetas para entrenar</T.Body>
          <T.Small>Desayunos, comidas, cenas y post-entreno</T.Small>
        </View>
        <Icon name="chevron" size={18} color={colors.muted} />
      </Card>

      <T.Small style={{ marginTop: space.xl, textAlign: 'center' }}>
        Las calorías del escáner y el objetivo diario son estimaciones orientativas. No sustituyen el consejo de un profesional sanitario.
      </T.Small>
    </Screen>
  );
}

function Macro({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = Math.min(1, target ? value / target : 0);
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <T.Small>{label}</T.Small>
        <T.Small style={{ color: colors.white }}>{value}/{target} g</T.Small>
      </View>
      <View style={styles.track}><View style={[styles.fill, { width: `${pct * 100}%` as `${number}%` }]} /></View>
    </View>
  );
}

function EntryRow({ e, line, onDelete }: { e: FoodEntry; line: boolean; onDelete: () => void }) {
  return (
    <View style={[styles.entry, line && styles.line]}>
      {e.photoUri ? <Image source={{ uri: e.photoUri }} style={styles.thumb} /> : <View style={[styles.thumb, styles.thumbEmpty]}><Icon name="food" size={16} color={colors.muted} /></View>}
      <View style={{ flex: 1 }}>
        <T.Body numberOfLines={1}>{e.name}</T.Body>
        <T.Small>
          {e.proteinG != null ? `P ${Math.round(e.proteinG)} · C ${Math.round(e.carbsG ?? 0)} · G ${Math.round(e.fatG ?? 0)}` : 'Sin macros'}
          {e.source === 'foto' ? ' · estimado' : ''}
        </T.Small>
      </View>
      <T.H2 style={{ fontSize: 18 }}>{Math.round(e.kcal)}</T.H2>
      <Pressable onPress={onDelete} hitSlop={10} accessibilityLabel={`Eliminar ${e.name}`}>
        <Icon name="trash" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );
}

function NutritionLocked() {
  return (
    <Screen>
      <T.H1>NUTRICIÓN</T.H1>
      <T.Small style={{ marginTop: 4 }}>Entrena y come con un plan. Todo en VYTRON.</T.Small>
      <View style={{ gap: space.md, marginTop: space.xl }}>
        {[
          ['camera', 'Escáner de comidas', 'Haz una foto a tu plato y obtén una estimación de calorías y macros en segundos.'],
          ['target', 'Objetivo diario', 'Calculado con tus datos y tu objetivo: perder grasa, mantener o ganar músculo.'],
          ['book', 'Recetas para entrenar', 'Platos sencillos para cada momento del día.'],
          ['heart', 'Apple Salud', 'Envía tus comidas a Salud para tenerlo todo junto.'],
        ].map(([icon, title, desc]) => (
          <Card key={title} style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
            <View style={styles.featureIcon}><Icon name={icon as any} color={colors.neon} /></View>
            <View style={{ flex: 1 }}>
              <T.H2 style={{ fontSize: 19 }}>{title.toUpperCase()}</T.H2>
              <T.Small>{desc}</T.Small>
            </View>
          </Card>
        ))}
        <LockedCard required="premium" title="Nutrición Premium" description="Incluida en el plan Premium." />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  track: { height: 5, backgroundColor: colors.graphite, borderRadius: 3, marginTop: 4, overflow: 'hidden' },
  fill: { height: 5, backgroundColor: colors.neon },
  entry: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  line: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  thumb: { width: 44, height: 44, borderRadius: 10 },
  thumbEmpty: { backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center' },
  featureIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(183,255,54,0.1)', alignItems: 'center', justifyContent: 'center' },
});
