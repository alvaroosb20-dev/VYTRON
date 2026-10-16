# VYTRON

**TRAIN. EVOLVE. DOMINATE.**

App de entrenamiento para Android e iPhone. Expo (React Native) + TypeScript + expo-router, suscripciones con RevenueCat (App Store / Google Play).

## Arrancar

```bash
npm install
npx expo install --fix      # alinea versiones con el SDK de Expo instalado
cp .env.example .env        # rellena las claves públicas de RevenueCat y las URLs legales
npx expo start              # web y Expo Go (sin compras)
npx expo run:ios            # build de desarrollo con compras reales
npx expo run:android
```

Las compras dentro de la app necesitan un *development build* (`expo-dev-client`); en Expo Go y en web la app funciona en modo Free.

## Estructura

```
app/                  Pantallas (expo-router)
  (tabs)/             Inicio · Entrenar · Progreso · Perfil
  workout/[id].tsx    Sesión de entrenamiento con series, descanso y pesos
  paywall.tsx         Planes y comparación
  nutrition.tsx       Recetas (Premium)
src/
  theme/tokens.ts     Colores, espacios y tipografía de la marca
  config/plans.ts     Planes, precios provisionales y qué desbloquea cada nivel
  lib/subscription.tsx  Estado de suscripción verificado (RevenueCat)
  lib/progress.tsx    Sesiones y objetivos del usuario (AsyncStorage)
  components/         Logo, iconos, UI, gráficos y bloqueo de funciones
assets/brand/         Logotipos en SVG y PNG
scripts/              Generadores del logotipo
```

## Marca

| Token | Color |
|---|---|
| Negro profundo | `#0A0A0B` |
| Grafito | `#171719` |
| Tarjetas | `#242428` |
| Verde neón (acción, progreso) | `#B7FF36` |
| Blanco | `#F5F5F5` |
| Gris secundario | `#A0A0A8` |

Tipografía: Barlow Condensed (titulares) e Inter (texto), ambas con licencia SIL Open Font.

Logotipo: letras geométricas propias con inclinación de 12°. La **V** tiene el brazo derecho más alto (progreso) y es la versión compacta para icono y avatar.

- `assets/brand/vytron-wordmark.svg` — completo, fondo oscuro
- `assets/brand/vytron-wordmark-on-light.svg` — fondos claros
- `assets/brand/vytron-lockup.svg` — con eslogan (web, tiendas, redes)
- `assets/brand/vytron-mark.svg` — icono compacto
- `assets/brand/png/` — PNG para redes

Para modificar el logo: edita `scripts/generate-brand.mjs` y ejecuta `npm run brand` (requiere Python con Pillow).

## Suscripciones

1. Crea los productos en App Store Connect y Google Play Console (mensuales).
2. En RevenueCat crea los *entitlements* `pro` y `premium`, y una *offering* actual con los paquetes `pro_monthly` y `premium_monthly`.
3. Pon las claves públicas del SDK en `.env`.

Reglas implementadas:

- El nivel se calcula **solo** con los entitlements activos que devuelve RevenueCat tras validar el recibo. No hay desbloqueos locales.
- Los precios de `src/config/plans.ts` son provisionales: en la app se muestra el precio real de la tienda; si la tienda no responde, se avisa de que es un precio de referencia y el botón de compra se desactiva.
- Restaurar compras y gestionar la suscripción están en el paywall y en Perfil.
- Los anuncios solo pueden aparecer en Free, nunca mientras se verifica, y desaparecen en cuanto llega un entitlement sin anuncios. El SDK de anuncios se conecta en `src/components/Gate.tsx` (`getAdBanner`); hasta entonces no se muestra nada.

## Pendiente

- Integrar el prompt maestro de desarrollo (backend, cuentas, seguridad) cuando esté disponible.
- Conectar el SDK de anuncios (AdMob u otro) y el consentimiento RGPD.
- Fotografías con licencia para las rutinas.
- URLs reales de términos y privacidad.
- Identificadores definitivos de la app (`com.vytron.app` es provisional).
- Verificación de marca: `vytron.com` no estaba disponible (16/10/2026). Existen nombres parecidos en fitness (VYTRIX, VYRON Coach, VRTO). Antes de lanzar, búsqueda formal en EUIPO/OEPM.
