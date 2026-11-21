-- Commit enum additions before the policy migration uses the new roles.
alter type public.bbs_role add value if not exists 'aprobador';
alter type public.bbs_role add value if not exists 'cotizador';
alter table public.profiles add column if not exists must_change_password boolean not null default false;
