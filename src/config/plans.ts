// Planes de VYTRON. Los precios son PROVISIONALES: se muestran solo como referencia
// mientras la tienda no devuelve el precio real. En producción manda siempre el precio
// localizado que devuelven App Store / Google Play (vía RevenueCat).

export type Tier = 'free' | 'pro' | 'premium';

export type Plan = {
  tier: Tier;
  name: string;
  fallbackPrice: string; // solo referencia, editable
  period: string;
  // Identificador del paquete en la "offering" actual de RevenueCat.
  packageId?: string;
  highlights: string[];
};

export const PLANS: Plan[] = [
  {
    tier: 'free',
    name: 'FREE',
    fallbackPrice: '0 €',
    period: '/mes',
    highlights: [
      'Entrenamientos básicos',
      'Seguimiento esencial',
      'Selección limitada de ejercicios',
      'Anuncios discretos',
      'Puedes mejorar de plan cuando quieras',
    ],
  },
  {
    tier: 'pro',
    name: 'PRO',
    fallbackPrice: '4,99 €',
    period: '/mes',
    packageId: 'pro_monthly',
    highlights: [
      'Sin anuncios',
      'Más rutinas y ejercicios',
      'Estadísticas avanzadas',
      'Seguimiento de marcas personales',
      'Planificación semanal',
    ],
  },
  {
    tier: 'premium',
    name: 'PREMIUM',
    fallbackPrice: '9,99 €',
    period: '/mes',
    packageId: 'premium_monthly',
    highlights: [
      'Todo lo de Pro',
      'Planificación personalizada ampliada',
      'Nutrición y recetas',
      'Informes de progreso',
      'Herramientas adicionales de planificación',
    ],
  },
];

// Identificadores de "entitlements" configurados en RevenueCat.
export const ENTITLEMENTS = { pro: 'pro', premium: 'premium' } as const;

// Qué nivel mínimo necesita cada función. Única fuente de verdad para el bloqueo.
export const FEATURE_TIER = {
  adFree: 'pro',
  allRoutines: 'pro',
  advancedStats: 'pro',
  personalRecords: 'pro',
  weeklyPlanning: 'pro',
  customPlanning: 'premium',
  nutrition: 'premium',
  progressReports: 'premium',
} as const satisfies Record<string, Tier>;

export type Feature = keyof typeof FEATURE_TIER;

const RANK: Record<Tier, number> = { free: 0, pro: 1, premium: 2 };
export const tierAllows = (current: Tier, required: Tier) => RANK[current] >= RANK[required];

// Tabla de comparación del paywall.
export const COMPARISON: { label: string; free: boolean | string; pro: boolean | string; premium: boolean | string }[] = [
  { label: 'Rutinas', free: 'Básicas', pro: 'Todas', premium: 'Todas' },
  { label: 'Sin anuncios', free: false, pro: true, premium: true },
  { label: 'Estadísticas avanzadas', free: false, pro: true, premium: true },
  { label: 'Marcas personales', free: false, pro: true, premium: true },
  { label: 'Planificación semanal', free: false, pro: true, premium: true },
  { label: 'Plan personalizado ampliado', free: false, pro: false, premium: true },
  { label: 'Nutrición y recetas', free: false, pro: false, premium: true },
  { label: 'Informes de progreso', free: false, pro: false, premium: true },
];
