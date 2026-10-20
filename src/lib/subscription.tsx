import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { REVENUECAT_KEY, STORE_MANAGE_URL } from '@/config/app';
import { useAuth } from './auth';
import { Billing, ENTITLEMENTS, FEATURE_TIER, Feature, PLANS, Tier, tierAllows } from '@/config/plans';

/**
 * Estado de suscripción de VYTRON.
 *
 * Regla de seguridad: el nivel (tier) SOLO se deriva de los entitlements activos que
 * devuelve RevenueCat tras validar el recibo con Apple/Google. Nunca se desbloquea
 * nada por un estado local, un flag guardado o un botón pulsado.
 */

type Status = 'loading' | 'ready' | 'unavailable';

type Ctx = {
  status: Status;
  tier: Tier;
  /** Paquetes reales de la tienda, por id de paquete. */
  packages: Record<string, PurchasesPackage>;
  /** Productos cuya prueba o precio de introducción ya no puede usar este usuario (iOS). */
  introIneligible: Record<string, true>;
  hasAccess: (feature: Feature) => boolean;
  /** Los anuncios solo se muestran en Free y nunca mientras se verifica. */
  showAds: boolean;
  purchase: (packageId: string) => Promise<{ ok: boolean; tier: Tier; cancelled?: boolean; error?: string }>;
  restore: () => Promise<{ ok: boolean; tier: Tier; error?: string }>;
  manage: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Identificador de RevenueCat, que el servidor usa para verificar la suscripción. */
  getAppUserId: () => Promise<string | undefined>;
};

const SubscriptionContext = createContext<Ctx | null>(null);

// Carga diferida: en web no hay compras dentro de la app.
const getPurchases = () =>
  Platform.OS === 'web' ? null : (require('react-native-purchases').default as typeof import('react-native-purchases').default);

export function tierFromCustomerInfo(info: CustomerInfo | null): Tier {
  const active = info?.entitlements.active ?? {};
  if (active[ENTITLEMENTS.premium]?.isActive) return 'premium';
  if (active[ENTITLEMENTS.pro]?.isActive) return 'pro';
  return 'free';
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [packages, setPackages] = useState<Record<string, PurchasesPackage>>({});
  const [introIneligible, setIntroIneligible] = useState<Record<string, true>>({});
  const configured = useRef(false);

  const loadOfferings = useCallback(async () => {
    const Purchases = getPurchases();
    if (!Purchases) return;
    const offerings = await Purchases.getOfferings();
    const map: Record<string, PurchasesPackage> = {};
    for (const pkg of offerings.current?.availablePackages ?? []) map[pkg.identifier] = pkg;
    setPackages(map);
    // En iOS Apple decide quién puede usar la prueba gratuita: solo se anuncia si es elegible.
    if (Platform.OS === 'ios') {
      try {
        const ids = Object.values(map).map((p) => p.product.identifier);
        const res = await Purchases.checkTrialOrIntroductoryPriceEligibility(ids);
        const no: Record<string, true> = {};
        // 1 = INTRO_ELIGIBILITY_STATUS_INELIGIBLE
        for (const [id, e] of Object.entries(res)) if ((e.status as number) === 1) no[id] = true;
        setIntroIneligible(no);
      } catch {}
    }
  }, []);

  const refresh = useCallback(async () => {
    const Purchases = getPurchases();
    if (!Purchases || !configured.current) return;
    setInfo(await Purchases.getCustomerInfo());
  }, []);

  useEffect(() => {
    const Purchases = getPurchases();
    if (!Purchases || !REVENUECAT_KEY) {
      // Sin tienda configurada: experiencia Free, sin funciones de pago.
      setStatus('unavailable');
      return;
    }
    let mounted = true;
    const onUpdate = (next: CustomerInfo) => mounted && setInfo(next);
    (async () => {
      try {
        Purchases.configure({ apiKey: REVENUECAT_KEY });
        configured.current = true;
        Purchases.addCustomerInfoUpdateListener(onUpdate);
        const [ci] = await Promise.all([Purchases.getCustomerInfo(), loadOfferings()]);
        if (!mounted) return;
        setInfo(ci);
        setStatus('ready');
      } catch {
        if (mounted) setStatus('unavailable');
      }
    })();
    return () => {
      mounted = false;
      if (configured.current) Purchases.removeCustomerInfoUpdateListener(onUpdate);
    };
  }, [loadOfferings]);

  // La suscripción queda ligada a la cuenta de VYTRON: se recupera al iniciar sesión en otro teléfono.
  const { user } = useAuth();
  const linkedUser = useRef<string | null>(null);
  useEffect(() => {
    const Purchases = getPurchases();
    if (!Purchases || status !== 'ready') return;
    const id = user?.id ?? null;
    if (id === linkedUser.current) return;
    (async () => {
      try {
        if (id) {
          const { customerInfo } = await Purchases.logIn(id);
          setInfo(customerInfo);
        } else if (linkedUser.current) {
          setInfo(await Purchases.logOut());
        }
        linkedUser.current = id;
      } catch {}
    })();
  }, [user?.id, status]);

  const tier = tierFromCustomerInfo(info);

  const purchase = useCallback<Ctx['purchase']>(async (packageId) => {
    const Purchases = getPurchases();
    const pkg = packages[packageId];
    if (!Purchases || !pkg) return { ok: false, tier: 'free', error: 'Las compras no están disponibles ahora mismo.' };
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      setInfo(customerInfo);
      // Éxito solo si la tienda confirma un entitlement activo.
      const t = tierFromCustomerInfo(customerInfo);
      return { ok: t !== 'free', tier: t };
    } catch (e: any) {
      if (e?.userCancelled) return { ok: false, tier: 'free', cancelled: true };
      return { ok: false, tier: 'free', error: e?.message ?? 'No se pudo completar la compra.' };
    }
  }, [packages]);

  const restore = useCallback<Ctx['restore']>(async () => {
    const Purchases = getPurchases();
    if (!Purchases || !configured.current) return { ok: false, tier: 'free', error: 'Las compras no están disponibles ahora mismo.' };
    try {
      const ci = await Purchases.restorePurchases();
      setInfo(ci);
      const t = tierFromCustomerInfo(ci);
      return { ok: true, tier: t };
    } catch (e: any) {
      return { ok: false, tier: 'free', error: e?.message ?? 'No se pudieron restaurar las compras.' };
    }
  }, []);

  const manage = useCallback(async () => {
    const url = info?.managementURL || STORE_MANAGE_URL;
    if (url) await Linking.openURL(url);
  }, [info]);

  const value = useMemo<Ctx>(() => ({
    status,
    tier,
    packages,
    introIneligible,
    hasAccess: (f) => tierAllows(tier, FEATURE_TIER[f]),
    showAds: status !== 'loading' && !tierAllows(tier, FEATURE_TIER.adFree),
    purchase,
    restore,
    manage,
    refresh,
    getAppUserId: async () => {
      const Purchases = getPurchases();
      if (!Purchases || !configured.current) return undefined;
      try {
        return await Purchases.getAppUserID();
      } catch {
        return undefined;
      }
    },
  }), [status, tier, packages, introIneligible, purchase, restore, manage, refresh]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription debe usarse dentro de SubscriptionProvider');
  return ctx;
}

const UNIT_DAYS: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

/** Días de prueba gratuita que ofrece la tienda para este paquete (0 si no hay). Nunca se inventa. */
function freeTrialDays(pkg: PurchasesPackage | undefined, ineligible: Record<string, true>) {
  if (!pkg || ineligible[pkg.product.identifier]) return 0;
  const p: any = pkg.product;
  const intro = p.introPrice; // iOS
  if (intro && intro.price === 0) return (UNIT_DAYS[intro.periodUnit] ?? 0) * intro.periodNumberOfUnits * Math.max(1, intro.cycles ?? 1);
  const free = p.defaultOption?.freePhase; // Google Play
  if (free?.billingPeriod) return (UNIT_DAYS[free.billingPeriod.unit] ?? 0) * free.billingPeriod.value * Math.max(1, free.billingCycleCount ?? 1);
  return 0;
}

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2).replace('.', ',')} ${currency}`;
  }
}

/** Precio a mostrar: el real de la tienda o, si no hay, el provisional marcado como tal. */
export function usePlanPrice(tier: Tier, billing: Billing = 'monthly') {
  const { packages, introIneligible } = useSubscription();
  const plan = PLANS.find((p) => p.tier === tier)!;
  const monthlyPkg = plan.packageId ? packages[plan.packageId] : undefined;
  const annualPkg = plan.annualPackageId ? packages[plan.annualPackageId] : undefined;

  if (billing === 'annual') {
    const a = annualPkg?.product;
    const m = monthlyPkg?.product;
    // Ahorro real frente a pagar 12 meses, solo si la tienda da ambos precios.
    const savingsPct = a && m && m.price > 0 ? Math.round((1 - a.price / (m.price * 12)) * 100) : undefined;
    return {
      packageId: plan.annualPackageId,
      price: a?.priceString ?? plan.fallbackAnnualPrice ?? '',
      period: '/año',
      perMonth: a ? money(a.price / 12, a.currencyCode) : undefined,
      savingsPct: savingsPct && savingsPct > 0 ? savingsPct : undefined,
      trialDays: freeTrialDays(annualPkg, introIneligible),
      fromStore: !!annualPkg,
      purchasable: !!annualPkg,
    };
  }
  return {
    packageId: plan.packageId,
    price: monthlyPkg?.product.priceString ?? plan.fallbackPrice,
    period: '/mes',
    perMonth: undefined as string | undefined,
    savingsPct: undefined as number | undefined,
    trialDays: freeTrialDays(monthlyPkg, introIneligible),
    fromStore: !!monthlyPkg,
    purchasable: !!monthlyPkg,
  };
}

/** Si la tienda no ofrece plan anual, el paywall vuelve a mostrar solo el mensual. */
export function useHasAnnual() {
  const { packages, status } = useSubscription();
  // Sin tienda (Expo Go, web) se enseñan ambos con precios de referencia y la compra desactivada.
  if (status !== 'ready') return true;
  return PLANS.some((p) => p.annualPackageId && packages[p.annualPackageId]);
}
