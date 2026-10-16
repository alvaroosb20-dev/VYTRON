// Sistema visual de VYTRON. Un único sitio para colores, espacios y tipografía.
export const colors = {
  black: '#0A0A0B', // fondo principal
  graphite: '#171719', // superficies / barra inferior
  card: '#242428', // tarjetas
  neon: '#B7FF36', // acción principal, progreso, positivo
  white: '#F5F5F5',
  muted: '#A0A0A8',
  line: '#2E2E33', // separadores sutiles
  neonInk: '#0A0A0B', // texto sobre verde
  danger: '#FF5A4E',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;

// Barlow Condensed para titulares deportivos; Inter para lectura.
export const fonts = {
  display: 'BarlowCondensed_800ExtraBold',
  displayBold: 'BarlowCondensed_700Bold',
  body: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;

export const type = {
  hero: { fontFamily: fonts.display, fontSize: 40, lineHeight: 42, letterSpacing: 0.5, color: colors.white },
  h1: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, letterSpacing: 0.5, color: colors.white },
  h2: { fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 26, letterSpacing: 0.5, color: colors.white },
  label: { fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1.4, color: colors.muted },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.white },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.muted },
  stat: { fontFamily: fonts.display, fontSize: 34, lineHeight: 36, color: colors.white },
} as const;
