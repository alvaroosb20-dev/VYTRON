import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { LockedCard } from '@/components/Gate';
import { Icon } from '@/components/Icon';
import { Button, Card, Chips, Field, Screen, T, TopBar } from '@/components/ui';
import { scanFood, ScannedItem, ScanResult } from '@/lib/foodScan';
import { saveFood } from '@/lib/health';
import { Meal, MEAL_LABEL, mealForNow, useNutrition } from '@/lib/nutrition';
import { useProgress } from '@/lib/progress';
import { useSubscription } from '@/lib/subscription';
import { colors, radius, space } from '@/theme/tokens';

type Editable = ScannedItem & { keep: boolean };
const MEAL_OPTIONS = (Object.keys(MEAL_LABEL) as Meal[]).map((m) => ({ value: m, label: MEAL_LABEL[m] }));
const num = (v: string) => {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export default function FoodScan() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { hasAccess, getAppUserId } = useSubscription();
  const { settings } = useProgress();
  const { add } = useNutrition();

  const [meal, setMeal] = useState<Meal>(mealForNow());
  const [photo, setPhoto] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<ScanResult>();
  const [items, setItems] = useState<Editable[]>([]);
  const [manual, setManual] = useState(mode === 'manual');
  const [form, setForm] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '' });

  const close = () => router.back();
  if (!hasAccess('nutrition')) {
    return (
      <Screen>
        <TopBar onClose={close} />
        <LockedCard required="premium" title="Escáner de comidas" description="Haz una foto y obtén calorías y macros estimados." />
      </Screen>
    );
  }

  const syncHealth = settings.healthSync && hasAccess('healthNutrition');

  const pick = async (source: 'camera' | 'library') => {
    setError(undefined);
    const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso necesario', source === 'camera' ? 'Activa el acceso a la cámara en Ajustes para escanear tus comidas.' : 'Activa el acceso a tus fotos en Ajustes.');
      return;
    }
    const res = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (res.canceled || !res.assets?.[0]) return;
    await analyze(res.assets[0].uri);
  };

  const analyze = async (uri: string) => {
    setBusy(true);
    setResult(undefined);
    try {
      // Reducimos la imagen: menos datos, análisis más rápido y la misma información útil.
      const img = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1024 } }], {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      });
      // Copia persistente para mostrar la miniatura en el diario.
      const dest = `${FileSystem.documentDirectory}food-${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: img.uri, to: dest });
      setPhoto(dest);
      const userId = await getAppUserId();
      if (!userId) throw new Error('No se pudo verificar tu suscripción. Comprueba tu conexión.');
      const r = await scanFood(img.base64!, userId);
      if (!r.items.length) throw new Error('No hemos reconocido comida en la foto. Prueba con otra o añádela manualmente.');
      setResult(r);
      setItems(r.items.map((it) => ({ ...it, keep: true })));
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo analizar la foto.');
    } finally {
      setBusy(false);
    }
  };

  const kept = items.filter((i) => i.keep);
  const total = Math.round(kept.reduce((a, i) => a + i.kcal, 0));

  const saveScan = async () => {
    for (const it of kept) {
      const entry = await add({ meal, name: it.name, kcal: it.kcal, proteinG: it.proteinG, carbsG: it.carbsG, fatG: it.fatG, source: 'foto', photoUri: photo });
      if (syncHealth) saveFood({ ...it, meal, date: entry.date });
    }
    close();
  };

  const saveManual = async () => {
    if (!form.name.trim() || !num(form.kcal)) {
      Alert.alert('Faltan datos', 'Escribe al menos el nombre y las calorías.');
      return;
    }
    const entry = await add({
      meal,
      name: form.name.trim(),
      kcal: num(form.kcal),
      proteinG: form.protein ? num(form.protein) : undefined,
      carbsG: form.carbs ? num(form.carbs) : undefined,
      fatG: form.fat ? num(form.fat) : undefined,
      source: 'manual',
    });
    if (syncHealth) saveFood({ name: entry.name, kcal: entry.kcal, proteinG: entry.proteinG, carbsG: entry.carbsG, fatG: entry.fatG, meal, date: entry.date });
    close();
  };

  const update = (idx: number, patch: Partial<Editable>) => setItems((list) => list.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <Screen>
        <TopBar title={manual ? 'AÑADIR COMIDA' : 'ESCÁNER DE COMIDAS'} onClose={close} />

        <T.Label>MOMENTO</T.Label>
        <View style={{ marginTop: space.sm, marginBottom: space.xl }}>
          <Chips options={MEAL_OPTIONS} value={meal} onChange={setMeal} />
        </View>

        {manual ? (
          <View style={{ gap: space.md }}>
            <Field label="ALIMENTO O PLATO" value={form.name} onChangeText={(name) => setForm({ ...form, name })} placeholder="Ej.: Tortilla de patatas" />
            <Field label="CALORÍAS (KCAL)" value={form.kcal} onChangeText={(kcal) => setForm({ ...form, kcal })} keyboardType="decimal-pad" placeholder="0" />
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Field label="PROTEÍNA (G)" value={form.protein} onChangeText={(protein) => setForm({ ...form, protein })} keyboardType="decimal-pad" />
              <Field label="CARBOS (G)" value={form.carbs} onChangeText={(carbs) => setForm({ ...form, carbs })} keyboardType="decimal-pad" />
              <Field label="GRASAS (G)" value={form.fat} onChangeText={(fat) => setForm({ ...form, fat })} keyboardType="decimal-pad" />
            </View>
            <Button title="GUARDAR" icon="check" onPress={saveManual} style={{ marginTop: space.md }} />
            {hasAccess('foodScan') && <Button title="Prefiero escanear una foto" variant="ghost" onPress={() => setManual(false)} />}
          </View>
        ) : !hasAccess('foodScan') ? (
          <LockedCard required="premium" title="Escáner de comidas" description="Haz una foto y obtén calorías y macros estimados." />
        ) : (
          <>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photo} />
            ) : (
              <View style={styles.drop}>
                <Icon name="camera" size={34} color={colors.neon} />
                <T.H2 style={{ textAlign: 'center' }}>HAZ UNA FOTO A TU PLATO</T.H2>
                <T.Small style={{ textAlign: 'center' }}>Desde arriba, con buena luz y todo el plato a la vista. La IA estima los alimentos, las cantidades y las calorías.</T.Small>
              </View>
            )}

            {busy && (
              <Card style={styles.busy}>
                <ActivityIndicator color={colors.neon} />
                <T.Body>Analizando tu plato…</T.Body>
              </Card>
            )}

            {error && !busy && (
              <Card style={{ marginTop: space.md, borderWidth: 1, borderColor: colors.danger }}>
                <T.Body>{error}</T.Body>
              </Card>
            )}

            {result && !busy && (
              <View style={{ marginTop: space.lg, gap: space.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <View>
                    <T.Label>ESTIMACIÓN · CONFIANZA {result.confidence.toUpperCase()}</T.Label>
                    <T.Stat>{total} <T.Small>kcal</T.Small></T.Stat>
                  </View>
                  <T.Small>Toca para corregir</T.Small>
                </View>
                {items.map((it, idx) => (
                  <Card key={idx} style={[styles.item, !it.keep && { opacity: 0.45 }]}>
                    <Pressable onPress={() => update(idx, { keep: !it.keep })} style={[styles.check, it.keep && styles.checkOn]} accessibilityLabel={it.keep ? 'Quitar' : 'Incluir'}>
                      {it.keep && <Icon name="check" size={14} color={colors.neonInk} />}
                    </Pressable>
                    <View style={{ flex: 1, gap: space.sm }}>
                      <Field label="ALIMENTO" value={it.name} onChangeText={(name) => update(idx, { name })} />
                      <View style={{ flexDirection: 'row', gap: space.sm }}>
                        <Field label="GRAMOS" value={String(Math.round(it.grams))} keyboardType="decimal-pad"
                          onChangeText={(v) => {
                            // Al cambiar la cantidad se escalan calorías y macros en proporción.
                            const g = num(v);
                            const f = it.grams ? g / it.grams : 1;
                            update(idx, { grams: g, kcal: it.kcal * f, proteinG: it.proteinG * f, carbsG: it.carbsG * f, fatG: it.fatG * f });
                          }} />
                        <Field label="KCAL" value={String(Math.round(it.kcal))} keyboardType="decimal-pad" onChangeText={(v) => update(idx, { kcal: num(v) })} />
                      </View>
                      <T.Small>P {Math.round(it.proteinG)} g · C {Math.round(it.carbsG)} g · G {Math.round(it.fatG)} g</T.Small>
                    </View>
                  </Card>
                ))}
                {result.notes ? <T.Small>{result.notes}</T.Small> : null}
                <T.Small>Las calorías son una estimación a partir de la foto. Revísalas si conoces las cantidades exactas.</T.Small>
              </View>
            )}
            <View style={{ height: 160 }} />
          </>
        )}
      </Screen>

      {!manual && hasAccess('foodScan') && (
        <View style={styles.footer}>
          {result && !busy ? (
            <>
              <Button title={`GUARDAR · ${total} KCAL`} icon="check" onPress={saveScan} disabled={!kept.length} />
              <Button title="Hacer otra foto" variant="ghost" onPress={() => pick('camera')} />
            </>
          ) : (
            <>
              <Button title="HACER FOTO" icon="camera" onPress={() => pick('camera')} disabled={busy} />
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.xl }}>
                <Button title="Elegir de la galería" variant="ghost" onPress={() => pick('library')} disabled={busy} style={{ flex: 1 }} />
                <Button title="Añadir a mano" variant="ghost" onPress={() => setManual(true)} disabled={busy} style={{ flex: 1 }} />
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  drop: { aspectRatio: 1, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.xl },
  photo: { width: '100%', aspectRatio: 1, borderRadius: radius.lg },
  busy: { marginTop: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md },
  item: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  check: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  checkOn: { backgroundColor: colors.neon, borderColor: colors.neon },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: space.lg, paddingBottom: space.xxl, backgroundColor: 'rgba(10,10,11,0.97)', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, gap: 4 },
});

