import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AdSlot, Gate } from '@/components/Gate';
import { Icon, IconName } from '@/components/Icon';
import { Card, Chips, FadeIn, Pill, Screen, SectionTitle, T } from '@/components/ui';
import { FEATURE_TIER, tierAllows } from '@/config/plans';
import { PROGRAMS } from '@/data/programs';
import { getWorkout, Setting, totalSets, Workout, WORKOUTS } from '@/data/workouts';
import { useProgress } from '@/lib/progress';
import { useSubscription } from '@/lib/subscription';
import { colors, fonts, radius, space } from '@/theme/tokens';

const WEEK = [
  { d: 1, n: 'LUN' }, { d: 2, n: 'MAR' }, { d: 3, n: 'MIÉ' }, { d: 4, n: 'JUE' },
  { d: 5, n: 'VIE' }, { d: 6, n: 'SÁB' }, { d: 0, n: 'DOM' },
];

export default function Train() {
  const { tier } = useSubscription();
  const { settings, setDayPlan, customWorkouts } = useProgress();
  const [filter, setFilter] = useState<Setting | 'Todas'>('Todas');

  const available = [...WORKOUTS, ...customWorkouts].filter((w) => tierAllows(tier, w.tier));
  const cycleDay = (d: number) => {
    const options = [null, ...available.map((w) => w.id)];
    const i = options.indexOf(settings.weekPlan[d] ?? null);
    setDayPlan(d, options[(i + 1) % options.length]);
  };

  const list = WORKOUTS.filter((w) => filter === 'Todas' || w.setting === filter);

  return (
    <Screen>
      <T.H1>ENTRENAR</T.H1>
      <T.Small style={{ marginTop: 4 }}>Sigue un programa, planifica tu semana o elige una rutina.</T.Small>

      <SectionTitle title="PROGRAMAS" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingRight: space.lg }} style={{ marginHorizontal: -space.lg, paddingLeft: space.lg }}>
        {PROGRAMS.map((p) => {
          const locked = !tierAllows(tier, p.tier);
          const active = settings.activeProgram?.id === p.id;
          return (
            <Card key={p.id} onPress={() => router.push(`/program/${p.id}`)} style={[styles.program, active && styles.programActive]}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {active ? <Pill text="ACTIVO" tone="neon" /> : <Pill text={p.goal.toUpperCase()} />}
                {p.tier !== 'free' && <Pill text={p.tier.toUpperCase()} tone="neon" />}
              </View>
              <T.H2 style={{ marginTop: space.md }}>{p.name}</T.H2>
              <T.Small>{p.weeks} semanas · {p.daysPerWeek} días/semana</T.Small>
              <View style={{ flex: 1 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md }}>
                {locked && <Icon name="lock" size={14} color={colors.muted} />}
                <Text style={styles.more}>{locked ? 'Ver qué incluye' : 'Ver programa'}  →</Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>

      <SectionTitle title="PLANIFICACIÓN SEMANAL" action={tierAllows(tier, 'premium') ? 'Generar plan' : undefined} onAction={() => router.push('/plan-generator')} />
      <Gate feature="weeklyPlanning" title="Planifica tu semana" description="Asigna rutinas a cada día y la app te las propone en Inicio.">
        <Card style={{ paddingVertical: space.sm }}>
          {WEEK.map(({ d, n }, i) => {
            const w = settings.weekPlan[d] ? getWorkout(settings.weekPlan[d]!, customWorkouts) : undefined;
            return (
              <Pressable key={d} onPress={() => cycleDay(d)} style={[styles.planRow, i > 0 && styles.line]} accessibilityHint="Cambia la rutina de este día">
                <Text style={styles.day}>{n}</Text>
                <T.Body style={{ flex: 1, color: w ? colors.white : colors.muted }} numberOfLines={1}>{w ? w.name : 'Descanso'}</T.Body>
                <T.Small>Cambiar</T.Small>
              </Pressable>
            );
          })}
        </Card>
      </Gate>

      <SectionTitle title="MIS RUTINAS" action={tierAllows(tier, FEATURE_TIER.customRoutines) ? 'Crear' : undefined} onAction={() => router.push('/routine-builder')} />
      <Gate feature="customRoutines" title="Crea tus rutinas" description="Elige ejercicios, series, repeticiones y descansos a tu medida.">
        {customWorkouts.length === 0 ? (
          <Card onPress={() => router.push('/routine-builder')} style={styles.empty}>
            <Icon name="plus" color={colors.neon} />
            <T.Body>Crea tu primera rutina</T.Body>
          </Card>
        ) : (
          customWorkouts.map((w) => <WorkoutCard key={w.id} w={w} locked={false} onEdit={() => router.push({ pathname: '/routine-builder', params: { id: w.id } })} />)
        )}
      </Gate>

      <SectionTitle title="RUTINAS" />
      <Chips
        value={filter}
        onChange={setFilter}
        options={[{ value: 'Todas', label: 'Todas' }, { value: 'Gimnasio', label: 'Gimnasio' }, { value: 'Mancuernas', label: 'Mancuernas' }, { value: 'Sin material', label: 'Sin material' }]}
      />
      <View style={{ height: space.md }} />
      {list.map((w, i) => (
        <FadeIn key={w.id} delay={i * 30}>
          <WorkoutCard w={w} locked={!tierAllows(tier, w.tier)} />
        </FadeIn>
      ))}

      <SectionTitle title="HERRAMIENTAS" />
      <View style={{ gap: space.sm }}>
        <Tool icon="book" title="Biblioteca de ejercicios" desc="Técnica paso a paso y errores comunes" onPress={() => router.push('/library')} />
        <Tool icon="scale" title="Calculadora de discos" desc="Qué discos poner en cada lado" badge={tierAllows(tier, 'pro') ? undefined : 'PRO'} onPress={() => router.push('/plates')} />
        <Tool icon="target" title="Plan personalizado" desc="Según tu objetivo, días y material" badge={tierAllows(tier, 'premium') ? undefined : 'PREMIUM'} onPress={() => router.push('/plan-generator')} />
      </View>

      <AdSlot />
    </Screen>
  );
}

function WorkoutCard({ w, locked, onEdit }: { w: Workout; locked: boolean; onEdit?: () => void }) {
  return (
    <Card onPress={() => router.push(locked ? '/paywall' : `/workout/${w.id}`)} style={[{ marginBottom: space.md }, locked ? { opacity: 0.7 } : {}]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            <Pill text={w.custom ? 'PROPIA' : w.level.toUpperCase()} />
            {w.tier !== 'free' && <Pill text={w.tier.toUpperCase()} tone="neon" />}
          </View>
          <T.H2>{w.name}</T.H2>
          <T.Small>{w.focus} · {w.minutes} min · {totalSets(w)} series</T.Small>
          {onEdit && (
            <Pressable onPress={onEdit} hitSlop={8} style={{ marginTop: 8 }}>
              <Text style={styles.more}>Editar</Text>
            </Pressable>
          )}
        </View>
        <View style={[styles.go, locked && { backgroundColor: colors.graphite }]}>
          <Icon name={locked ? 'lock' : 'play'} size={18} color={locked ? colors.muted : colors.neonInk} fill={!locked} />
        </View>
      </View>
    </Card>
  );
}

function Tool({ icon, title, desc, badge, onPress }: { icon: IconName; title: string; desc: string; badge?: string; onPress: () => void }) {
  return (
    <Card onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <View style={styles.toolIcon}><Icon name={icon} size={20} color={colors.neon} /></View>
      <View style={{ flex: 1 }}>
        <T.Body style={{ fontFamily: fonts.semibold }}>{title}</T.Body>
        <T.Small>{desc}</T.Small>
      </View>
      {badge ? <Pill text={badge} tone="neon" /> : <Icon name="chevron" size={18} color={colors.muted} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  program: { width: 230, minHeight: 170, backgroundColor: colors.graphite, borderWidth: 1, borderColor: colors.line },
  programActive: { borderColor: colors.neon },
  more: { fontFamily: fonts.semibold, fontSize: 13, color: colors.neon },
  planRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: space.md },
  line: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  day: { width: 40, fontFamily: fonts.display, fontSize: 16, color: colors.neon },
  go: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.neon, alignItems: 'center', justifyContent: 'center' },
  empty: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line, backgroundColor: 'transparent' },
  toolIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(183,255,54,0.1)', alignItems: 'center', justifyContent: 'center' },
});
