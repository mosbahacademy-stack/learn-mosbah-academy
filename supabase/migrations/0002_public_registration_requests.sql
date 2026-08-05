do $$
begin
  if not exists (select 1 from pg_type where typname = 'enrollment_request_status') then
    create type public.enrollment_request_status as enum ('pending', 'approved', 'rejected');
  end if;
end
$$;

alter table public.profiles add column if not exists first_name text not null default '';
alter table public.profiles add column if not exists last_name text not null default '';
alter table public.profiles add column if not exists state text not null default '';
alter table public.profiles add column if not exists city text not null default '';
alter table public.profiles add column if not exists institution text not null default '';
alter table public.profiles add column if not exists phone text not null default '';
alter table public.profiles add column if not exists academic_level text not null default '';

alter table public.courses add column if not exists price_dzd numeric(10, 2) not null default 0;
alter table public.courses add column if not exists payment_notes text not null default '';

create table if not exists public.enrollment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  payment_method text not null default 'baridi_mob',
  payment_reference text not null default '',
  proof_note text not null default '',
  status public.enrollment_request_status not null default 'pending',
  admin_note text not null default '',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint enrollment_requests_payment_method_check check (payment_method in ('baridi_mob', 'bank_transfer'))
);

create index if not exists idx_enrollment_requests_user_id on public.enrollment_requests(user_id);
create index if not exists idx_enrollment_requests_course_id on public.enrollment_requests(course_id);
create index if not exists idx_enrollment_requests_status_created on public.enrollment_requests(status, created_at desc);

create unique index if not exists uniq_pending_enrollment_request_per_course
  on public.enrollment_requests(user_id, course_id)
  where status = 'pending';

alter table public.enrollment_requests enable row level security;

drop policy if exists "enrollment_requests_select_own_or_admin" on public.enrollment_requests;
create policy "enrollment_requests_select_own_or_admin"
on public.enrollment_requests
for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "enrollment_requests_insert_own" on public.enrollment_requests;
create policy "enrollment_requests_insert_own"
on public.enrollment_requests
for insert
with check (user_id = auth.uid());

drop policy if exists "enrollment_requests_update_admin_only" on public.enrollment_requests;
create policy "enrollment_requests_update_admin_only"
on public.enrollment_requests
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "enrollment_requests_delete_admin_only" on public.enrollment_requests;
create policy "enrollment_requests_delete_admin_only"
on public.enrollment_requests
for delete
using (public.is_admin());