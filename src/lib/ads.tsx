import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { loadAdsModule } from './adsModule';
import { useSubscription } from './subscription';

/**
 * Anuncios de Google AdMob, solo en el plan Free.
 *
 * Orden obligatorio en la UE (RGPD + TCF v2.2):
 *  1. Formulario de consentimiento de Google (UMP), que en iPhone muestra también el aviso ATT
 *     si está configurado en AdMob.
 *  2. Solo si el SDK dice que se pueden pedir anuncios, se inicializa AdMob.
 * Si el usuario no da su consentimiento, Google sirve anuncios no personalizados o ninguno.
 * Con Pro o Premium verificados no se pide consentimiento ni se carga el SDK.
 */

type Ctx = {
  /** El SDK está listo y se pueden pedir anuncios. */
  ready: boolean;
  /** Hay que ofrecer al usuario un acceso para cambiar su decisión (UE). */
  privacyOptionsRequired: boolean;
  showPrivacyOptions: () => Promise<void>;
};

const AdsContext = createContext<Ctx>({ ready: false, privacyOptionsRequired: false, showPrivacyOptions: async () => {} });

// Módulo nativo: no existe en web ni en Expo Go (ver adsModule.native.ts).
export const adsModule = loadAdsModule;

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const { showAds } = useSubscription();
  const [ready, setReady] = useState(false);
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    const M = adsModule();
    if (!M || !showAds || started.current) return;
    started.current = true;
    (async () => {
      try {
        // Si falla la recogida (sin red, etc.), se usa la decisión guardada de la última vez.
        await M.AdsConsent.gatherConsent().catch(() => {});
        const info = await M.AdsConsent.getConsentInfo();
        setPrivacyOptionsRequired(info.privacyOptionsRequirementStatus === M.AdsConsentPrivacyOptionsRequirementStatus.REQUIRED);
        if (!info.canRequestAds) return;
        await M.default().initialize();
        setReady(true);
      } catch {
        // Sin consentimiento resuelto no se muestran anuncios.
      }
    })();
  }, [showAds]);

  const showPrivacyOptions = useCallback(async () => {
    const M = adsModule();
    if (!M) return;
    try {
      await M.AdsConsent.showPrivacyOptionsForm();
      const info = await M.AdsConsent.getConsentInfo();
      if (info.canRequestAds && !ready) {
        await M.default().initialize();
        setReady(true);
      }
    } catch {}
  }, [ready]);

  const value = useMemo(() => ({ ready: ready && showAds, privacyOptionsRequired, showPrivacyOptions }), [ready, showAds, privacyOptionsRequired, showPrivacyOptions]);
  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export const useAds = () => useContext(AdsContext);

/** Id del banner: el de prueba de Google en desarrollo; el real (variables de entorno) en producción. */
export function bannerUnitId(): string | null {
  const M = adsModule();
  if (!M) return null;
  if (__DEV__) return M.TestIds.ADAPTIVE_BANNER;
  const id = Platform.select({ ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS, android: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID });
  return id || null; // Sin id real en producción, no se muestran anuncios.
}
