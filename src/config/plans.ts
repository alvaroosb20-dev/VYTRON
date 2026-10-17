// Planes de VYTRON. Los precios son PROVISIONALES: se muestran solo como referencia
// mientras la tienda no devuelve el precio real. En producción manda siempre el precio
// localizado que devuelven App Store / Google Play (vía RevenueCat).

export type Tier = 'free' | 'pro' | 'premium';
export type Billing = 'monthly' | 'annual';

export type Plan = {
  tier: Tier;
  name: string;
  fallbackPrice: string;
  period: string;
  packageId?: string; // paquete mensual en la "offering" actual de RevenueCat
  annualPackageId?: string; // paquete anual (con o sin prueba gratuita, según lo configurado en la tienda)
  fallbackAnnualPrice?: string;
  pitch: string;
  highlights: string[];
};

export const PLANS: Plan[] = [
  {
    tier: 'free',
    name: 'FREE',
    fallbackPrice: '0 €',
    period: '/mes',
    pitch: 'Para empezar a entrenar con buena técnica.',
    highlights: ['Rutinas básicas y programa de inicio', 'Seguimiento esencial', 'Selección de ejercicios con técnica', 'Anuncios discretos', 'Mejora de plan cuando quieras'],
  },
  {
    tier: 'pro',
    name: 'PRO',
    fallbackPrice: '4,99 €',
    period: '/mes',
    packageId: 'pro_monthly',
    annualPackageId: 'pro_annual',
    fallbackAnnualPrice: '34,99 €',
    pitch: 'Para entrenar en serio y medir cada avance.',
    highlights: [
      'Sin anuncios',
      'Programas de 6 a 8 semanas',
      'Biblioteca de 41 ejercicios con técnica',
      'Crea tus propias rutinas',
      'Marcas personales y 1RM estimado',
      'Estadísticas por grupo muscular',
      'Planificación semanal',
      'Calculadora de discos y registro de peso',
      'Conexión con Apple Salud',
    ],
  },
  {
    tier: 'premium',
    name: 'PREMIUM',
    fallbackPrice: '9,99 €',
    period: '/mes',
    packageId: 'premium_monthly',
    annualPackageId: 'premium_annual',
    fallbackAnnualPrice: '59,99 €',
    pitch: 'Entrenamiento y nutrición en un solo lugar.',
    highlights: [
      'Todo lo de Pro',
      'Escáner de comidas: calorías estimadas con una foto',
      'Diario de nutrición con objetivo diario',
      'Recetas para entrenar',
      'Plan personalizado según objetivo, días y material',
      'Progresión automática de cargas',
      'Programa de recomposición de 12 semanas',
      'Informes de progreso mensuales',
      'Envío de nutrición a Apple Salud',
    ],
  },
];

export const ENTITLEMENTS = { pro: 'pro', premium: 'premium' } as const;

// Nivel mínimo de cada función. Única fuente de verdad para el bloqueo en toda la app.
export const FEATURE_TIER = {
  adFree: 'pro',
  allRoutines: 'pro',
  fullLibrary: 'pro',
  programs: 'pro',
  customRoutines: 'pro',
  advancedStats: 'pro',
  personalRecords: 'pro',
  weeklyPlanning: 'pro',
  plateCalculator: 'pro',
  bodyWeight: 'pro',
  healthSync: 'pro',
  foodScan: 'premium',
  nutrition: 'premium',
  customPlanning: 'premium',
  autoProgression: 'premium',
  progressReports: 'premium',
  healthNutrition: 'premium',
} as const satisfies Record<string, Tier>;

export type Feature = keyof typeof FEATURE_TIER;

const RANK: Record<Tier, number> = { free: 0, pro: 1, premium: 2 };
export const tierAllows = (current: Tier, required: Tier) => RANK[current] >= RANK[required];

export const COMPARISON: { label: string; free: boolean | string; pro: boolean | string; premium: boolean | string }[] = [
  { label: 'Rutinas', free: '5', pro: '14', premium: '16' },
  { label: 'Ejercicios con técnica', free: '18', pro: '41', premium: '48' },
  { label: 'Programas por semanas', free: '1', pro: '4', premium: '5' },
  { label: 'Sin anuncios', free: false, pro: true, premium: true },
  { label: 'Crear rutinas propias', free: false, pro: true, premium: true },
  { label: 'Marcas y 1RM estimado', free: false, pro: true, premium: true },
  { label: 'Estadísticas por músculo', free: false, pro: true, premium: true },
  { label: 'Planificación semanal', free: false, pro: true, premium: true },
  { label: 'Calculadora de discos', free: false, pro: true, premium: true },
  { label: 'Apple Salud', free: false, pro: true, premium: true },
  { label: 'Escáner de comidas', free: false, pro: false, premium: true },
  { label: 'Diario de nutrición', free: false, pro: false, premium: true },
  { label: 'Plan personalizado', free: false, pro: false, premium: true },
  { label: 'Progresión automática', free: false, pro: false, premium: true },
  { label: 'Informes mensuales', free: false, pro: false, premium: true },
];
