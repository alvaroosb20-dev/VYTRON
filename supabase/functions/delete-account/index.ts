// Supabase Edge Function: elimina la cuenta del usuario que la llama y todos sus datos en la nube.
// Requisito de App Store (5.1.1(v)) y Google Play: borrar la cuenta desde la propia app.
//
// El usuario se identifica con su JWT; nadie puede borrar la cuenta de otro.
// user_data se elimina en cascada al borrar el usuario.
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido' });

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'Sin sesión' });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return json(401, { error: 'Sesión no válida' });

  const { error: delErr } = await admin.auth.admin.deleteUser(data.user.id);
  if (delErr) return json(500, { error: 'No se pudo eliminar la cuenta' });

  return json(200, { ok: true });
});
