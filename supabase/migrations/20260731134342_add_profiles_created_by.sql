alter table public.profiles
add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists profiles_created_by_idx on public.profiles(created_by);
