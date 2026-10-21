import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/Icon';
import { Mark, Wordmark } from '@/components/Logo';
import { Button, Card, Chips, FadeIn, Field, Pill, T } from '@/components/ui';
import { BRAND } from '@/config/app';
import { tierAllows } from '@/config/plans';
import { getWorkout, Setting } from '@/data/workouts';
import { dailyTarget } from '@/lib/nutrition';
import { Activity, BodyProfile, Sex, useProgress } from '@/lib/progress';
import { notificationPermission } from '@/lib/reminders';
import { useSubscription } from '@/lib/subscription';
import { generatePlan, Goal, Level, planForTier } from '@/lib/training';
import { colors, fonts, radius, space } from '@/theme/tokens';

// Bienvenida de VYTRON: unas preguntas, el plan a medida y, al final, la invitación a desbloquearlo.

type Step = 'welcome' | 'goal' | 'level' | 'days' | 'setting' | 'body' | 'reminder' | 'building' | 'plan';
const STEPS: Step[] = ['welcome', 'goal', 'level', 'days', 'setting', 'body', 'reminder', 'building', 'plan'];
const QUESTIONS: Step[] = STEPS.filter((s) => s !== 'welcome' && s !== 'building' && s !== 'plan');

const ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const GOALS: { value: Goal; title: string; text: string; icon: IconName }[] = [
  { value: 'musculo', title: 'GANAR MÚSCULO', text: 'Más volumen y definición', icon: 'train' },
  { value: 'grasa', title: 'PERDER GRASA', text: 'Quemar más y mantener el músculo', icon: 'flame' },
  { value: 'fuerza', title: 'GANAR FUERZA', text: 'Levantar más en los básicos', icon: 'trophy' },
  { value: 'salud', title: 'ESTAR EN FORMA', text: 'Moverme mejor y sentirme bien', icon: 'heart' },
];
const LEVELS: { value: Level; title: string; text: string }[] = [
  { value: 'principiante', title: 'EMPIEZO AHORA', text: 'Menos de 6 meses entrenando' },
  { value: 'intermedio', title: 'INTERMEDIO', text: 'Entre 6 meses y 2 años' },
  { value: 'avanzado', title: 'AVANZADO', text: 'Más de 2 años con constancia' },
];
const SETTINGS: { value: Setting; title: string; text: string }[] = [
  { value: 'Gimnasio', title: 'GIMNASIO', text: 'Barras, máquinas y mancuernas' },
  { value: 'Mancuernas', title: 'EN CASA CON MANCUERNAS', text: 'Un par de mancuernas y poco espacio' },
  { value: 'Sin material', title: 'SIN MATERIAL', text: 'Solo con tu peso corporal' },
];
const TIMES = [7, 13, 18, 20];

const BODY_GOAL: Record<Goal, BodyProfile['goal']> = { grasa: 'perder', musculo: 'ganar', fuerza: 'mantener', salud: 'mantener' };
const activityFor = (days: number): Activity => (days <= 2 ? 1.375 : days <= 4 ? 1.55 : 1.725);
const num = (s: string) => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { tier } = useSubscription();
  const { completeOnboarding, setReminders } = useProgress();

  const [step, setStep] = useState<Step>('welcome');
  const [goal, setGoal] = useState<Goal>();
  const [level, setLevel] = useState<Level>();
  const [days, setDays] = useState(3);
  const [setting, setSetting] = useState<Setting>();
  const [sex, setSex] = useState<Sex>();
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [hour, setHour] = useState(19);
  const [remind, setRemind] = useState(false);
  const [saving, setSaving] = useState(false);

  const idx = STEPS.indexOf(step);
  const next = () => setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]);
  const back = () => setStep(STEPS[Math.max(idx - 1, 0)]);
  const pick = <V,>(set: (v: V) => void) => (v: V) => {
    set(v);
    setTimeout(next, 180);
  };

  const body: BodyProfile = {
    sex,
    age: num(age),
    heightCm: num(height),
    weightKg: num(weight),
    activity: activityFor(days),
    goal: goal ? BODY_GOAL[goal] : undefined,
  };
  const target = dailyTarget(body);
  const fullPlan = useMemo(() => (goal && setting ? generatePlan(goal, days, setting) : []), [goal, days, setting]);

  const finish = async (thenPaywall: boolean) => {
    if (!goal || !level || !setting) return;
    setSaving(true);
    await completeOnboarding({ goal, level, days, setting }, planForTier(goal, days, setting, tier), body);
    if (remind) await setReminders({ enabled: true, hour, minute: 0 });
    router.replace('/');
    if (thenPaywall) setTimeout(() => router.push({ pathname: '/paywall', params: { from: 'onboarding' } }), 350);
  };

  const qIndex = (QUESTIONS as readonly Step[]).indexOf(step);
  const showChrome = qIndex >= 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.black }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, paddingTop: insets.top + space.md }}>
        {showChrome && (
          <View style={styles.chrome}>
            <Pressable onPress={back} hitSlop={12} accessibilityLabel="Atrás" style={{ transform: [{ rotate: '180deg' }] }}>
              <Icon name="chevron" color={colors.muted} />
            </Pressable>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${Math.round(((qIndex + 1) / QUESTIONS.length) * 100)}%` as `${number}%` }]} />
            </View>
            <Text style={styles.count}>{qIndex + 1}/{QUESTIONS.length}</Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step === 'welcome' && <Welcome />}

          {step === 'goal' && (
            <Question title="¿CUÁL ES TU OBJETIVO?" hint="Diseñamos tu semana alrededor de él.">
              {GOALS.map((g) => (
                <Option key={g.value} icon={g.icon} title={g.title} text={g.text} selected={goal === g.value} onPress={() => pick(setGoal)(g.value)} />
              ))}
            </Question>
          )}

          {step === 'level' && (
            <Question title="¿CUÁNTA EXPERIENCIA TIENES?" hint="Así elegimos el volumen y la dificultad.">
              {LEVELS.map((l) => (
                <Option key={l.value} title={l.title} text={l.text} selected={level === l.value} onPress={() => pick(setLevel)(l.value)} />
              ))}
            </Question>
          )}

          {step === 'days' && (
            <Question title="¿CUÁNTOS DÍAS PUEDES ENTRENAR?" hint="Sé realista: la constancia gana a la intensidad.">
              <View style={styles.daysRow}>
                {[2, 3, 4, 5, 6].map((d) => (
                  <Pressable key={d} onPress={() => setDays(d)} style={[styles.dayBtn, days === d && styles.dayOn]} accessibilityState={{ selected: days === d }}>
                    <Text style={[styles.dayNum, days === d && { color: colors.neonInk }]}>{d}</Text>
                  </Pressable>
                ))}
              </View>
              <T.Small style={{ textAlign: 'center', marginTop: space.md }}>
                {days <= 3 ? 'Ideal para crear el hábito.' : days <= 4 ? 'El punto óptimo para progresar.' : 'Para quien ya tiene rutina.'}
              </T.Small>
            </Question>
          )}

          {step === 'setting' && (
            <Question title="¿DÓNDE VAS A ENTRENAR?" hint="Solo verás ejercicios que puedes hacer.">
              {SETTINGS.map((s) => (
                <Option key={s.value} title={s.title} text={s.text} selected={setting === s.value} onPress={() => pick(setSetting)(s.value)} />
              ))}
            </Question>
          )}

          {step === 'body' && (
            <Question title="CALCULEMOS TUS CALORÍAS" hint="Opcional. Con estos datos estimamos tu objetivo diario; puedes cambiarlos cuando quieras.">
              <Chips<Sex> value={sex} onChange={setSex} options={[{ value: 'hombre', label: 'Hombre' }, { value: 'mujer', label: 'Mujer' }]} />
              <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
                <Field label="EDAD" value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="28" maxLength={2} />
                <Field label="ALTURA (CM)" value={height} onChangeText={setHeight} keyboardType="number-pad" placeholder="175" maxLength={3} />
                <Field label="PESO (KG)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="72" maxLength={5} />
              </View>
            </Question>
          )}

          {step === 'reminder' && (
            <Question title="¿A QUÉ HORA TE AVISAMOS?" hint="Un aviso solo los días que toca entrenar. Quien recibe recordatorios cumple más semanas.">
              <View style={styles.daysRow}>
                {TIMES.map((h) => (
                  <Pressable key={h} onPress={() => setHour(h)} style={[styles.dayBtn, hour === h && styles.dayOn]} accessibilityState={{ selected: hour === h }}>
                    <Text style={[styles.timeText, hour === h && { color: colors.neonInk }]}>{String(h).padStart(2, '0')}:00</Text>
                  </Pressable>
                ))}
              </View>
              <Card style={{ marginTop: space.xl, flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
                <Icon name="calendar" color={colors.neon} />
                <T.Small style={{ flex: 1, color: colors.white }}>“Hoy toca tu entrenamiento. 45 min. Empieza cuando quieras.”</T.Small>
              </Card>
            </Question>
          )}

          {step === 'building' && <Building hasBody={!!target} onDone={next} />}

          {step === 'plan' && goal && setting && (
            <FadeIn>
              <Pill text="TU PLAN ESTÁ LISTO" tone="neon" />
              <T.Hero style={{ marginTop: space.md }}>{GOALS.find((g) => g.value === goal)!.title}{'\n'}EN {days} DÍAS</T.Hero>
              <View style={styles.stats}>
                <Stat value={`${days}`} unit="sesiones/sem" />
                <Stat value={`${fullPlan.reduce((a, id) => a + (id ? getWorkout(id)?.minutes ?? 0 : 0), 0)}`} unit="min/sem" />
                {target && <Stat value={target.kcal.toLocaleString('es-ES')} unit="kcal/día" />}
              </View>
              <Card style={{ marginTop: space.lg, paddingVertical: space.sm }}>
                {ORDER.map((d, i) => {
                  const w = fullPlan[d] ? getWorkout(fullPlan[d]!) : undefined;
                  const locked = w && !tierAllows(tier, w.tier);
                  return (
                    <View key={d} style={[styles.planRow, i > 0 && styles.planRowLine]}>
                      <T.Body style={{ width: 44, color: colors.neon }}>{DAY[d]}</T.Body>
                      <T.Body style={{ flex: 1, color: w ? colors.white : colors.muted }}>{w ? w.name : 'Descanso'}</T.Body>
                      {locked ? <Icon name="lock" size={16} color={colors.neon} /> : w ? <T.Small>{w.minutes} min</T.Small> : null}
                    </View>
                  );
                })}
              </Card>
              {target && (
                <T.Small style={{ marginTop: space.md }}>
                  Objetivo estimado: {target.kcal} kcal · {target.protein} g de proteína al día. Es una estimación, no un consejo médico.
                </T.Small>
              )}
              {fullPlan.some((id) => id && !tierAllows(tier, getWorkout(id)?.tier ?? 'free')) && (
                <T.Small style={{ marginTop: space.md }}>
                  Las rutinas con candado forman parte de PRO y PREMIUM. Con la versión gratuita las cambiamos por rutinas equivalentes gratuitas.
                </T.Small>
              )}
            </FadeIn>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
          {step === 'welcome' && <Button title="CREAR MI PLAN" icon="play" onPress={next} />}
          {(step === 'days' || step === 'body') && <Button title="CONTINUAR" onPress={next} />}
          {step === 'reminder' && (
            <>
              <Button
                title="ACTIVAR RECORDATORIOS"
                onPress={async () => {
                  setRemind(await notificationPermission(true));
                  next();
                }}
              />
              <Button title="Ahora no" variant="ghost" onPress={next} />
            </>
          )}
          {step === 'plan' &&
            (tier === 'premium' ? (
              <Button title="EMPEZAR" icon="play" onPress={() => finish(false)} loading={saving} />
            ) : (
              <>
                <Button title="DESBLOQUEAR MI PLAN" onPress={() => finish(true)} loading={saving} />
                <Button title="Empezar con la versión gratuita" variant="ghost" onPress={() => finish(false)} disabled={saving} />
              </>
            ))}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function Welcome() {
  return (
    <FadeIn style={{ paddingTop: space.xxl }}>
      <Mark size={72} />
      <View style={{ marginTop: space.xl }}>
        <Wordmark height={30} />
      </View>
      <T.Hero style={{ marginTop: space.xxl, fontSize: 52, lineHeight: 52 }}>{BRAND.slogan.split(' ').join('\n')}</T.Hero>
      <T.Body style={{ marginTop: space.xl, color: colors.muted }}>
        Responde 6 preguntas y te damos tu plan de entrenamiento y tu objetivo de calorías. Menos de un minuto.
      </T.Body>
    </FadeIn>
  );
}

function Question({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <FadeIn>
      <T.H1>{title}</T.H1>
      <T.Small style={{ marginTop: space.sm, marginBottom: space.xl }}>{hint}</T.Small>
      <View style={{ gap: space.md }}>{children}</View>
    </FadeIn>
  );
}

function Option({ title, text, icon, selected, onPress }: { title: string; text: string; icon?: IconName; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} style={({ pressed }) => [styles.option, selected && styles.optionOn, pressed && { transform: [{ scale: 0.99 }] }]}>
      {icon && (
        <View style={[styles.optionIcon, selected && { backgroundColor: colors.neon }]}>
          <Icon name={icon} size={20} color={selected ? colors.neonInk : colors.neon} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        <T.Small>{text}</T.Small>
      </View>
      {selected && <Icon name="check" size={20} color={colors.neon} />}
    </Pressable>
  );
}

function Stat({ value, unit }: { value: string; unit: string }) {
  return (
    <View style={{ flex: 1 }}>
      <T.Stat>{value}</T.Stat>
      <T.Small>{unit}</T.Small>
    </View>
  );
}

function Building({ hasBody, onDone }: { hasBody: boolean; onDone: () => void }) {
  const lines = ['Analizando tu objetivo', 'Eligiendo rutinas para tu material', 'Repartiendo los días de descanso', hasBody ? 'Calculando tus calorías' : 'Ajustando el volumen semanal'];
  const v = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 2400, useNativeDriver: false }).start();
    const timers = lines.map((_, i) => setTimeout(() => setShown(i + 1), 450 + i * 520));
    const done = setTimeout(onDone, 2700);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={{ paddingTop: space.xxl * 2 }}>
      <Mark size={56} />
      <T.H1 style={{ marginTop: space.xl }}>CREANDO TU PLAN</T.H1>
      <View style={[styles.bar, { marginTop: space.xl, flex: 0, height: 8 }]}>
        <Animated.View style={[styles.barFill, { width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
      <View style={{ marginTop: space.xl, gap: space.md }}>
        {lines.slice(0, shown).map((l) => (
          <FadeIn key={l} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
            <Icon name="check" size={18} color={colors.neon} />
            <T.Body>{l}</T.Body>
          </FadeIn>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chrome: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, marginBottom: space.lg },
  bar: { flex: 1, height: 6, borderRadius: radius.pill, backgroundColor: colors.card, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.neon, borderRadius: radius.pill },
  count: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted, width: 32, textAlign: 'right' },
  body: { paddingHorizontal: space.lg, paddingBottom: space.xxl, flexGrow: 1 },
  footer: { paddingHorizontal: space.lg, paddingTop: space.md, gap: space.xs },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 2, borderColor: 'transparent' },
  optionOn: { borderColor: colors.neon, backgroundColor: colors.graphite },
  optionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(183,255,54,0.12)', alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontFamily: fonts.displayBold, fontSize: 20, letterSpacing: 0.8, color: colors.white },
  daysRow: { flexDirection: 'row', gap: space.sm },
  dayBtn: { flex: 1, aspectRatio: 0.9, borderRadius: radius.md, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  dayOn: { backgroundColor: colors.neon, borderColor: colors.neon },
  dayNum: { fontFamily: fonts.display, fontSize: 36, color: colors.white },
  timeText: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.white },
  stats: { flexDirection: 'row', marginTop: space.xl, gap: space.md },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 12 },
  planRowLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
