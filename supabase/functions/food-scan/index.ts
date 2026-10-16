// Supabase Edge Function: analiza la foto de una comida y estima calorías y macros.
//
// Seguridad:
//  - La clave de la IA y la de RevenueCat solo existen aquí, como secretos del servidor.
//  - Se verifica en RevenueCat que el usuario tiene el entitlement "premium" ACTIVO
//    antes de gastar una sola llamada a la IA.
//  - Límite diario de escaneos por usuario (tabla food_scans).
//
// Secretos necesarios: ANTHROPIC_API_KEY, REVENUECAT_SECRET_KEY
// Opcionales: ANTHROPIC_MODEL (por defecto claude-sonnet-5-5), DAILY_SCAN_LIMIT (por defecto 30)
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const PROMPT = `Eres un nutricionista que analiza fotos de comida.
Identifica cada alimento visible, estima su cantidad en gramos y sus calorías y macronutrientes
usando valores de referencia habituales de tablas de composición de alimentos.
Si la foto no muestra comida, devuelve "items": [].
Responde SOLO con JSON válido, sin texto adicional, con este formato exacto:
{"items":[{"name":"nombre en español","grams":0,"kcal":0,"proteinG":0,"carbsG":0,"fatG":0}],
 "confidence":"alta|media|baja",
 "notes":"aviso breve en español si algo es difícil de estimar (salsas, aceite, porción oculta) o cadena vacía"}`;

async function hasPremium(appUserId: string): Promise<boolean> {
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: { Authorization: `Bearer ${Deno.env.get('REVENUECAT_SECRET_KEY')}` },
  });
  if (!res.ok) return false;
  const data = await res.json();
  const ent = data?.subscriber?.entitlements?.premium;
  if (!ent) return false;
  return ent.expires_date === null || new Date(ent.expires_date).getTime() > Date.now();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido' });

  let body: { image?: string; mediaType?: string; appUserId?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Solicitud no válida' });
  }

  const { image, appUserId } = body;
  const mediaType = body.mediaType === 'image/png' ? 'image/png' : 'image/jpeg';
  if (!image || typeof image !== 'string' || !appUserId || typeof appUserId !== 'string') {
    return json(400, { error: 'Falta la imagen o el usuario' });
  }
  if ((image.length * 3) / 4 > MAX_IMAGE_BYTES) return json(413, { error: 'La imagen es demasiado grande' });

  // 1) Suscripción verificada en el servidor.
  if (!(await hasPremium(appUserId))) return json(402, { error: 'Función Premium' });

  // 2) Límite diario por usuario.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const limit = Number(Deno.env.get('DAILY_SCAN_LIMIT') ?? 30);
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('food_scans')
    .select('id', { count: 'exact', head: true })
    .eq('app_user_id', appUserId)
    .gte('created_at', since.toISOString());
  if ((count ?? 0) >= limit) return json(429, { error: 'Límite diario alcanzado' });

  // 3) Análisis con la IA.
  const ai = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-5-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    }),
  });
  if (!ai.ok) return json(502, { error: 'El servicio de análisis no está disponible. Inténtalo más tarde.' });

  const out = await ai.json();
  const text: string = out?.content?.find((c: { type: string }) => c.type === 'text')?.text ?? '';
  let parsed: any;
  try {
    parsed = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  } catch {
    return json(502, { error: 'No se pudo interpretar el análisis. Prueba con otra foto.' });
  }

  // 4) Saneamos la respuesta: solo números finitos y no negativos.
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v * 10) / 10 : 0);
  const items = (Array.isArray(parsed.items) ? parsed.items : []).slice(0, 12).map((it: any) => ({
    name: String(it.name ?? 'Alimento').slice(0, 60),
    grams: n(it.grams),
    kcal: n(it.kcal),
    proteinG: n(it.proteinG),
    carbsG: n(it.carbsG),
    fatG: n(it.fatG),
  }));
  const confidence = ['alta', 'media', 'baja'].includes(parsed.confidence) ? parsed.confidence : 'media';

  await supabase.from('food_scans').insert({ app_user_id: appUserId, items_count: items.length });

  return json(200, { items, confidence, notes: typeof parsed.notes === 'string' ? parsed.notes.slice(0, 200) : '' });
});
