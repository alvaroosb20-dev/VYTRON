import { FOOD_SCAN_URL, SUPABASE_ANON_KEY } from '@/config/app';

export type ScannedItem = { name: string; grams: number; kcal: number; proteinG: number; carbsG: number; fatG: number };
export type ScanResult = { items: ScannedItem[]; confidence: 'alta' | 'media' | 'baja'; notes?: string };

/**
 * Envía la foto al servidor de VYTRON, que verifica la suscripción Premium y pide a la IA
 * una ESTIMACIÓN de los alimentos y sus calorías. La clave de la IA nunca está en la app.
 */
export async function scanFood(imageBase64: string, appUserId: string): Promise<ScanResult> {
  if (!FOOD_SCAN_URL) throw new Error('El escáner aún no está configurado en el servidor.');
  const res = await fetch(FOOD_SCAN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ image: imageBase64, mediaType: 'image/jpeg', appUserId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg: Record<number, string> = {
      402: 'El escáner de comidas es una función Premium.',
      429: 'Has alcanzado el límite de escaneos de hoy. Puedes añadir la comida manualmente.',
    };
    throw new Error(msg[res.status] ?? data.error ?? 'No se pudo analizar la foto. Inténtalo de nuevo.');
  }
  if (!Array.isArray(data.items)) throw new Error('La respuesta del análisis no es válida.');
  return data as ScanResult;
}
