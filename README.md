# VYTRON

**TRAIN. EVOLVE. DOMINATE.**

App de entrenamiento y nutrición para Android e iPhone. Expo (React Native) + TypeScript + expo-router, suscripciones con RevenueCat, backend en Supabase y conexión con Apple Salud.

## Arrancar

```bash
npm install
npx expo install --fix      # alinea versiones con el SDK de Expo instalado
cp .env.example .env        # claves públicas de RevenueCat y Supabase, URLs legales
npx expo start              # web y Expo Go (sin compras, sin Salud, sin cámara nativa completa)
npx expo run:ios            # build de desarrollo: compras, Apple Salud y cámara
npx expo run:android
```

Compras, Apple Salud y el escáner necesitan un *development build* (`expo-dev-client`). En Expo Go la app funciona en modo Free.

## Qué incluye

| | Free | Pro | Premium |
|---|---|---|---|
| Rutinas | 5 | 14 | 16 |
| Ejercicios con técnica paso a paso | 18 | 41 | 48 |
| Programas por semanas | Inicio en 4 semanas | + 5×5, Push/Pull/Legs, Torso/Pierna | + Recomposición 12 semanas |
| Registro de series, repeticiones y peso | Series y reps | ✓ con peso | ✓ |
| Marcas personales y 1RM estimado (Epley) | | ✓ | ✓ |
| Series por grupo muscular, 8 semanas de histórico | | ✓ | ✓ |
| Planificación semanal y rutinas propias | | ✓ | ✓ |
| Calculadora de discos, registro de peso corporal | | ✓ | ✓ |
| Apple Salud: pasos, energía, peso y entrenamientos | | ✓ | ✓ |
| Escáner de comidas con IA (foto → calorías y macros estimados) | | | ✓ |
| Diario de nutrición con objetivo diario (Mifflin-St Jeor) | | | ✓ |
| Recetas, plan personalizado, progresión automática de cargas | | | ✓ |
| Informes mensuales comparados | | | ✓ |
| Envío de comidas a Apple Salud | | | ✓ |
| Anuncios | Discretos | No | No |

Todo el bloqueo sale de `FEATURE_TIER` en `src/config/plans.ts`.

## Estructura

```
app/
  (tabs)/                Inicio · Entrenar · Nutrición · Progreso · Perfil
  workout/[id].tsx       Sesión: series, reps, kg, descanso, 1RM, sugerencia de carga
  exercise/[id].tsx      Técnica y tu historial en el ejercicio
  program/[id].tsx       Programas por semanas
  library.tsx            Biblioteca con buscador y filtro por músculo
  routine-builder.tsx    Crear y editar rutinas propias
  plan-generator.tsx     Plan según objetivo, días y material
  plates.tsx             Calculadora de discos
  body.tsx               Datos corporales y objetivo calórico
  food-scan.tsx          Escáner de comidas y registro manual
  recipes.tsx            Recetas
  paywall.tsx            Planes y comparación
src/
  data/                  Ejercicios, rutinas, programas y recetas
  lib/subscription.tsx   Estado de suscripción verificado (RevenueCat)
  lib/progress.tsx       Sesiones, plan, rutinas propias, peso (dispositivo)
  lib/nutrition.tsx      Diario de comidas y objetivo diario
  lib/training.ts        1RM, progresión, discos, volumen, generador de plan
  lib/health.ts          Apple Salud (HealthKit)
  lib/foodScan.ts        Cliente del escáner
supabase/
  functions/food-scan/   Edge Function: verifica Premium y analiza la foto con IA
  migrations/            Tabla de límite diario de escaneos
```

## Suscripciones (RevenueCat)

1. Crea los productos mensuales en App Store Connect y Google Play Console.
2. En RevenueCat: entitlements `pro` y `premium`, offering actual con los paquetes `pro_monthly` y `premium_monthly`.
3. Claves públicas del SDK en `.env`.

Reglas: el nivel sale **solo** de los entitlements activos que devuelve RevenueCat; los precios mostrados son los de la tienda (los de `plans.ts` son de referencia y desactivan la compra si la tienda no responde); restaurar y gestionar están en el paywall y en Perfil; los anuncios solo pueden aparecer en Free y nunca mientras se verifica.

## Escáner de comidas

La foto se reduce a 1024 px y se envía a la Edge Function `food-scan`, que:

1. comprueba en la API de RevenueCat que el usuario tiene `premium` activo;
2. aplica un límite diario por usuario (30 por defecto);
3. pide a Claude una estimación en JSON y la sanea antes de devolverla.

El usuario revisa y corrige alimentos, gramos y calorías antes de guardar. La app indica siempre que son estimaciones.

```bash
supabase link --project-ref TU_PROYECTO
supabase db push
supabase secrets set ANTHROPIC_API_KEY=... REVENUECAT_SECRET_KEY=...
supabase functions deploy food-scan
```

Las claves secretas nunca van en la app.

## Apple Salud

`react-native-health` con su plugin de Expo (permisos y textos en `app.json`). El usuario lo activa en Perfil. Lee pasos, energía activa y peso; guarda entrenamientos de fuerza (sin calorías inventadas), peso corporal y, en Premium, calorías y macros de las comidas. En Android no se muestra.

## Marca

Paleta: `#0A0A0B` · `#171719` · `#242428` · `#B7FF36` · `#F5F5F5` · `#A0A0A8`. Tipografías Barlow Condensed e Inter (SIL OFL). Logotipos en `assets/brand/`; para regenerarlos, `npm run brand`.

## Pendiente

- Prompt maestro de desarrollo (cuentas de usuario y sincronización en la nube).
- SDK de anuncios y consentimiento RGPD.
- Fotografías con licencia para rutinas y ejercicios.
- URLs reales de términos y privacidad; política de privacidad que mencione Salud, cámara y el análisis de fotos.
- Identificadores definitivos de la app (`com.vytron.app` es provisional).
- Marca: `vytron.com` no disponible (16/10/2026); nombres parecidos en fitness (VYTRIX, VYRON Coach, VRTO). Búsqueda formal en EUIPO/OEPM antes de lanzar.
