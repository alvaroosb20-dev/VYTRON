-- Registro de escaneos de comida para aplicar el límite diario por usuario.
-- No se guardan las fotos ni el resultado: solo cuándo y quién escaneó.
create table if not exists public.food_scans (
  id bigint generated always as identity primary key,
  app_user_id text not null,
  items_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists food_scans_user_day on public.food_scans (app_user_id, created_at desc);

-- Solo la función del servidor (service role) puede leer o escribir.
alter table public.food_scans enable row level security;
