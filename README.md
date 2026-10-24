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

### Acceso Premium gratis (para ti, testers o colaboradores)

No hay códigos dentro de la app: el repositorio es público y cualquiera podría usarlos. Se hace desde RevenueCat:

1. La persona crea su cuenta en VYTRON.
2. RevenueCat › **Customers** › buscar por su email (la app lo envía al iniciar sesión).
3. **Grant entitlement** › `premium` › duración (p. ej. *Lifetime*).

El acceso queda ligado a su cuenta en todos sus dispositivos y se puede retirar en cualquier momento. Para regalar meses a usuarios normales también existen los códigos de oferta de App Store Connect y los códigos promocionales de Google Play.

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

## Arranque y acceso

Flujo (prompt maestro de acceso):

| Situación | Qué ve el usuario |
|---|---|
| Primera vez | Pantalla de carga → Bienvenida → Iniciar sesión o Crear cuenta → Configuración del perfil fitness → App |
| Con sesión guardada | Pantalla de carga → App |
| Tras cerrar sesión | Pantalla de carga → Bienvenida |
| Sesión caducada o revocada | Pantalla de carga → Iniciar sesión (email puesto y aviso) |

- **Pantalla de carga** (`src/components/Splash.tsx`): logo con fundido y escala, brillo verde, eslogan y línea de carga. La línea avanza hasta ~70 % y solo se completa cuando la sesión y los datos locales están comprobados (mínimo 1,5 s). Si la comprobación falla o tarda más de 8 s, muestra el error y «Reintentar». Respeta «Reducir movimiento». Solo aparece al abrir la app. La pantalla nativa es solo fondo (#080808) para que no haya saltos.
- **Rutas protegidas** (`app/_layout.tsx`, `Stack.Protected`): sin sesión solo existe el grupo `(auth)`; con sesión, la app. La navegación entre ambos es automática al iniciar o cerrar sesión.
- **Pantallas** (`app/(auth)/`): `welcome`, `login`, `register`, `forgot-password` y `verify-email`. Componentes compartidos en `src/components/authUI.tsx`.
- **Validaciones**: formato de email, campos vacíos, contraseña de 8+ caracteres con letras y números (lista en vivo), confirmación de contraseña y aceptación de términos y del consentimiento de datos de salud (RGPD art. 9). Errores en español. Botones bloqueados mientras se envía.
- **Cuentas duplicadas**: Supabase no revela si un email existe; la app lo detecta (usuario sin identidades) y ofrece ir a iniciar sesión.
- **Email sin confirmar**: el login ofrece reenviar el enlace; la pantalla de verificación permite reenviarlo cada 60 s.
- **Recuperar contraseña**: Supabase envía el enlace → `/nueva-contrasena` en la web → contraseña nueva. Solo se confirma el envío si Supabase lo acepta.
- **Sesión**: la guarda Supabase en el almacenamiento de la app y la renueva sola. «Recordarme» no se incluye: la sesión siempre se recuerda de forma segura hasta que el usuario la cierra.
- **Nombre**: se guarda en el perfil de Supabase (`user_metadata.name`) y se muestra en Perfil › Cuenta.
- **Teléfono nuevo**: si el usuario ya tenía datos en la nube, la app los descarga antes de decidir si mostrar la configuración inicial.

### Configuración externa del acceso

1. **Supabase › Authentication › URL Configuration**: Site URL `https://vytron-eta.vercel.app` y Redirect URLs `https://vytron-eta.vercel.app/**`.
2. **Supabase › Authentication › Providers › Email**: «Confirm email» activado; longitud mínima de contraseña 8 y requisito «letras y números».
3. **Supabase › Authentication › Emails**: pega las plantillas de `supabase/templates/` (asuntos en `supabase/config.toml`).
4. **SMTP propio** (Resend o Brevo) antes de publicar: el correo de Supabase solo envía unos pocos emails por hora.
5. **Continuar con Apple** (opcional, iPhone):
   - Apple Developer › Identifiers › `app.vytron` › activar **Sign in with Apple**.
   - Supabase › Authentication › Providers › **Apple**: activar y añadir `app.vytron` en «Client IDs». Para el flujo nativo no hace falta clave secreta.
   - En `.env`: `EXPO_PUBLIC_APPLE_SIGN_IN=1` y nueva compilación. Sin esto el botón no aparece.
6. **Continuar con Google**: no incluido. Necesita IDs de cliente OAuth de Google Cloud (iOS, Android y web) y el proveedor Google en Supabase. Si se añade Google, Apple exige ofrecer también «Continuar con Apple».

## Cuentas y sincronización

Cuenta obligatoria (email y contraseña con Supabase Auth; ver «Arranque y acceso»). Los datos se guardan en el teléfono y se sincronizan con la nube.

- `user_data`: una fila por usuario con el progreso y el diario de comidas en JSON, protegida con RLS (cada usuario solo ve la suya). Migración en `supabase/migrations/20261020000000_user_data.sql`.
- `src/lib/cloudSync.tsx` sincroniza al iniciar sesión, al volver a la app y 2,5 s después de cada cambio. La fusión (`src/lib/syncMerge.ts`) une sesiones, rutinas, pesos y comidas por id, respeta lo borrado en cualquier dispositivo y, en ajustes, gana la copia más reciente. Las fotos de comida no se suben.
- Si en el teléfono había datos de otra cuenta, no se mezclan.
- La suscripción se liga a la cuenta (`Purchases.logIn`): al iniciar sesión en otro teléfono se recupera el plan.
- Borrar cuenta: Perfil › Cuenta › Eliminar cuenta llama a la función `delete-account`, que borra el usuario y, en cascada, sus datos (obligatorio en App Store y Google Play).
- Recuperar contraseña: el email lleva a `/nueva-contrasena` en la web; la confirmación de cuenta, a `/cuenta-confirmada`.

Estado (20/10/2026): proyecto **vytron** (`dycoqoehcdymxblfvbyv`, UE-Irlanda) creado, con las tablas `user_data` y `food_scans` y las funciones `delete-account` y `food-scan` desplegadas. La URL y la clave pública ya están en `src/config/app.ts`.

Falta en el panel de Supabase:

1. Authentication › URL Configuration: Site URL `https://vytron-eta.vercel.app` y en Redirect URLs `https://vytron-eta.vercel.app/**`.
2. Authentication › Emails › SMTP: un servidor de correo propio (Resend, Brevo…). El de Supabase solo envía unos pocos emails por hora.
3. Edge Functions › Secrets: `ANTHROPIC_API_KEY` y `REVENUECAT_SECRET_KEY` para el escáner.

Si cambias de proyecto: `supabase link`, `supabase db push` y `supabase functions deploy` para cada función.

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

Titular: Álvaro Santana Bencomo, Santa Cruz de Tenerife. Contacto: vytronsoporte@gmail.com (cámbialo en `public/*.html` y `SUPPORT_EMAIL` en `src/config/app.ts` si prefieres otro). Revisa los textos con un asesor antes del lanzamiento y añade tu NIF en `terminos.html` si facturas como autónomo.

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

- Los 3 ajustes del panel de Supabase de la sección «Cuentas y sincronización».
- RevenueCat: cuenta, apps, productos y claves (`EXPO_PUBLIC_RC_IOS_KEY`, `EXPO_PUBLIC_RC_ANDROID_KEY` y la secreta en Supabase).
- Cuenta de AdMob, mensajes de privacidad y los IDs reales.
- Registrar `vytron.app` y la marca en OEPM o EUIPO.
- Fotos con licencia, si se quieren además del mapa muscular.
