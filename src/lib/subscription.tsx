import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { REVENUECAT_KEY, STORE_MANAGE_URL } from '@/config/app';
import { ENTITLEMENTS, FEATURE_TIER, Feature, PLANS, Tier, tierAllows } from '@/config/plans';

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
  hasAccess: (feature: Feature) => boolean;
  /** Los anuncios solo se muestran en Free y nunca mientras se verifica. */
  showAds: boolean;
  purchase: (packageId: string) => Promise<{ ok: boolean; cancelled?: boolean; error?: string }>;
  restore: () => Promise<{ ok: boolean; tier: Tier; error?: string }>;
  manage: () => Promise<void>;
  refresh: () => Promise<void>;
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
  const configured = useRef(false);

  const loadOfferings = useCallback(async () => {
    const Purchases = getPurchases();
    if (!Purchases) return;
    const offerings = await Purchases.getOfferings();
    const map: Record<string, PurchasesPackage> = {};
    for (const pkg of offerings.current?.availablePackages ?? []) map[pkg.identifier] = pkg;
    setPackages(map);
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

  const tier = tierFromCustomerInfo(info);

  const purchase = useCallback<Ctx['purchase']>(async (packageId) => {
    const Purchases = getPurchases();
    const pkg = packages[packageId];
    if (!Purchases || !pkg) return { ok: false, error: 'Las compras no están disponibles ahora mismo.' };
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      setInfo(customerInfo);
      // Éxito solo si la tienda confirma un entitlement activo.
      return { ok: tierFromCustomerInfo(customerInfo) !== 'free' };
    } catch (e: any) {
      if (e?.userCancelled) return { ok: false, cancelled: true };
      return { ok: false, error: e?.message ?? 'No se pudo completar la compra.' };
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
    hasAccess: (f) => tierAllows(tier, FEATURE_TIER[f]),
    showAds: status !== 'loading' && !tierAllows(tier, FEATURE_TIER.adFree),
    purchase,
    restore,
    manage,
    refresh,
  }), [status, tier, packages, purchase, restore, manage, refresh]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription debe usarse dentro de SubscriptionProvider');
  return ctx;
}

/** Precio a mostrar: el real de la tienda o, si no hay, el provisional marcado como tal. */
export function usePlanPrice(tier: Tier) {
  const { packages } = useSubscription();
  const plan = PLANS.find((p) => p.tier === tier)!;
  const pkg = plan.packageId ? packages[plan.packageId] : undefined;
  return {
    price: pkg?.product.priceString ?? plan.fallbackPrice,
    fromStore: !!pkg,
    purchasable: !!pkg,
  };
}
