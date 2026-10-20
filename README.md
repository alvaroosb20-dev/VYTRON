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

## Conversión y retención

- **Bienvenida (`app/onboarding.tsx`)**: 6 preguntas (objetivo, experiencia, días, material, datos corporales y hora de aviso), animación de "creando tu plan" y plan semanal con calorías estimadas. Termina en el paywall (`/paywall?from=onboarding`) o en la versión gratuita, que recibe el mismo plan con rutinas gratuitas equivalentes (`planForTier`). Quien ya tenía sesiones guardadas no la ve.
- **Paywall**: selector anual/mensual con el ahorro real calculado con los precios de la tienda, prueba gratuita solo si la tienda la ofrece y el usuario es elegible, línea de tiempo de la prueba y aviso local dos días antes de que termine.
- **Retención**: recordatorios locales solo los días con entrenamiento a la hora elegida (se reprograman al cambiar el plan o guardar una sesión; si ya entrenaste hoy no avisa), aviso de racha el domingo si la semana no está cumplida, y 10 logros en Progreso que se anuncian al terminar un entrenamiento.

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
  onboarding.tsx         Bienvenida: preguntas, plan a medida y paso al paywall
  paywall.tsx            Planes, anual/mensual, prueba gratuita y comparación
src/
  data/                  Ejercicios, rutinas, programas y recetas
  lib/subscription.tsx   Estado de suscripción verificado (RevenueCat)
  lib/progress.tsx       Sesiones, plan, rutinas propias, peso (dispositivo)
  lib/nutrition.tsx      Diario de comidas y objetivo diario
  lib/training.ts        1RM, progresión, discos, volumen, generador de plan
  lib/health.ts          Apple Salud (HealthKit)
  lib/foodScan.ts        Cliente del escáner
  lib/reminders.ts       Recordatorios locales (expo-notifications)
  lib/achievements.ts    Logros calculados a partir de las sesiones
supabase/
  functions/food-scan/   Edge Function: verifica Premium y analiza la foto con IA
  migrations/            Tabla de límite diario de escaneos
```

## Suscripciones (RevenueCat)

1. Crea los productos mensuales y anuales en App Store Connect y Google Play Console. Recomendado: prueba gratuita de 7 días en los anuales (oferta de introducción en Apple, fase gratuita en la oferta base de Google Play).
2. En RevenueCat: entitlements `pro` y `premium`, offering actual con los paquetes `pro_monthly`, `premium_monthly`, `pro_annual` y `premium_annual`. Si no hay paquetes anuales, el paywall muestra solo el mensual.
3. Claves públicas del SDK en `.env`.

La app nunca anuncia una prueba que la tienda no ofrezca: los días salen del producto (`introPrice` en iOS, `freePhase` en Android) y en iOS se comprueba la elegibilidad.

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

## Cuentas y sincronización

La cuenta es opcional (email y contraseña con Supabase Auth). Sin cuenta, todo se guarda en el teléfono.

- `user_data`: una fila por usuario con el progreso y el diario de comidas en JSON, protegida con RLS (cada usuario solo ve la suya). Migración en `supabase/migrations/20261020000000_user_data.sql`.
- `src/lib/cloudSync.tsx` sincroniza al iniciar sesión, al volver a la app y 2,5 s después de cada cambio. La fusión (`src/lib/syncMerge.ts`) une sesiones, rutinas, pesos y comidas por id, respeta lo borrado en cualquier dispositivo y, en ajustes, gana la copia más reciente. Las fotos de comida no se suben.
- Si en el teléfono había datos de otra cuenta, no se mezclan.
- La suscripción se liga a la cuenta (`Purchases.logIn`): al iniciar sesión en otro teléfono se recupera el plan.
- Borrar cuenta: Perfil › Cuenta › Eliminar cuenta llama a la función `delete-account`, que borra el usuario y, en cascada, sus datos (obligatorio en App Store y Google Play).
- Recuperar contraseña: el email lleva a `/nueva-contrasena` en la web; la confirmación de cuenta, a `/cuenta-confirmada`.

Puesta en marcha:

```bash
supabase link --project-ref TU_PROYECTO
supabase db push
supabase functions deploy delete-account
supabase functions deploy food-scan
```

En Supabase › Authentication › URL Configuration: Site URL `https://vytron-eta.vercel.app` y añade `https://vytron-eta.vercel.app/**` a Redirect URLs. En Vercel añade `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` para que funcione la página de nueva contraseña.

## Anuncios y consentimiento (RGPD)

Google AdMob con `react-native-google-mobile-ads`, solo en Free:

1. Al abrir la app en Free se muestra el formulario de consentimiento de Google (UMP, certificado IAB TCF v2.2). En iPhone incluye el aviso de seguimiento (ATT) si lo activas en AdMob › Privacidad y mensajes.
2. Solo si el SDK permite pedir anuncios se inicializa AdMob (`delayAppMeasurementInit` evita medir antes).
3. Perfil › Privacidad de anuncios permite cambiar la decisión cuando la ley lo exige.
4. Con Pro o Premium verificados no se carga el SDK ni se pide consentimiento.

Configuración: crea la app y un bloque de banner en AdMob y define `ADMOB_IOS_APP_ID`, `ADMOB_ANDROID_APP_ID`, `EXPO_PUBLIC_ADMOB_BANNER_IOS` y `EXPO_PUBLIC_ADMOB_BANNER_ANDROID` (`app.config.js` las inyecta). En desarrollo se usan los IDs de prueba de Google; en producción, sin IDs reales no se muestra ningún anuncio. En AdMob crea los mensajes de RGPD y de iOS (ATT) en Privacidad y mensajes.

## Imágenes de ejercicios

Cada ejercicio muestra un mapa muscular propio (frente y espalda) con el músculo principal en verde y los secundarios atenuados: `src/components/MuscleMap.tsx`. Es un dibujo original, sin licencias de terceros.

Para añadir fotos o vídeos con licencia, regístralos en `src/data/media.ts` con autor y licencia: la ficha del ejercicio muestra la foto y el crédito.

## Web y páginas legales

`public/` se publica tal cual en Vercel, en `https://vytron-eta.vercel.app`:

| Página | URL | Uso |
|---|---|---|
| Política de privacidad | `/privacidad` | App Store Connect, Google Play, enlaces en la app |
| Términos de uso | `/terminos` | App Store (EULA), paywall |
| Soporte | `/soporte` | URL de soporte de App Store; `/soporte#eliminar-cuenta` para el formulario de borrado de Google Play |
| Cuenta confirmada | `/cuenta-confirmada` | Destino del email de confirmación |

Titular: Álvaro Santana Bencomo, Santa Cruz de Tenerife. Contacto: alvaroosb20@gmail.com (cámbialo en `public/*.html` y `SUPPORT_EMAIL` en `src/config/app.ts` si prefieres otro). Revisa los textos con un asesor antes del lanzamiento y añade tu NIF en `terminos.html` si facturas como autónomo.

## Identificadores

- iOS bundle ID y Android package: `app.vytron` (dominio inverso de `vytron.app`).
- `vytron.app` y `vytron.es` estaban disponibles el 20/10/2026 (unos 20 USD/año cada uno); conviene registrar `vytron.app` para que el identificador corresponda a un dominio propio.
- Una vez publicada la app, el identificador no se puede cambiar. Quien publique la app debe registrar `app.vytron` en su cuenta de Apple Developer (Identifiers, con HealthKit activado) y en Google Play Console.

## Marca

Paleta: `#0A0A0B` · `#171719` · `#242428` · `#B7FF36` · `#F5F5F5` · `#A0A0A8`. Tipografías Barlow Condensed e Inter (SIL OFL). Logotipos en `assets/brand/`; para regenerarlos, `npm run brand`.

Búsqueda de antecedentes (20/10/2026):

- EE. UU. (USPTO): `VYTRON` solo aparece en un registro de 1953 para lubricantes industriales; `VYTRONUS` es una marca de equipos médicos. Ninguno cubre apps ni fitness.
- `VYTROON` (solicitud de 2024, clase 25: ropa, incluida la deportiva). No afecta a la app, pero sí a una posible línea de ropa VYTRON.
- Nombres parecidos en fitness: VYTRIX (app de entrenamiento con IA), VYRON Coach y VRTO.
- EUIPO y OEPM no se han podido consultar desde aquí. Antes de lanzar, busca «VYTRON» y variantes en [TMview](https://www.tmdn.org/tmview/) y en el [localizador de la OEPM](https://consultas2.oepm.es/LocalizadorWeb/) para las clases 9, 41 y 44. La tasa de la OEPM es de algo más de 100 € por la primera clase y la de la EUIPO, 850 €.

## Pendiente

- Crear el proyecto de Supabase de VYTRON (el plan gratuito ya tiene 2 proyectos activos) y desplegar las funciones.
- Cuenta de AdMob, mensajes de privacidad y los IDs reales.
- Registrar `vytron.app` y la marca en OEPM o EUIPO.
- Fotos con licencia, si se quieren además del mapa muscular.
