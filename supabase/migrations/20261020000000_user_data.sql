-- Copia en la nube de los datos de cada usuario (entrenamientos, ajustes, cuerpo y diario de comidas).
-- Una fila por usuario. Se borra sola al eliminar la cuenta (on delete cascade).
create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  nutrition jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  -- Límite de tamaño para evitar abusos (~2 MB por columna).
  constraint user_data_progress_size check (pg_column_size(progress) < 2000000),
  constraint user_data_nutrition_size check (pg_column_size(nutrition) < 2000000)
);

-- La hora de actualización la pone el servidor, no el reloj del teléfono.
create or replace function public.touch_user_data()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_data_touch on public.user_data;
create trigger user_data_touch
  before insert or update on public.user_data
  for each row execute function public.touch_user_data();

-- Cada usuario solo puede ver y modificar su propia fila.
alter table public.user_data enable row level security;

drop policy if exists "user_data_select_own" on public.user_data;
create policy "user_data_select_own" on public.user_data
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "user_data_insert_own" on public.user_data;
create policy "user_data_insert_own" on public.user_data
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "user_data_update_own" on public.user_data;
create policy "user_data_update_own" on public.user_data
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Sin política de delete: el borrado se hace al eliminar la cuenta (función delete-account).
revoke all on public.user_data from anon;
