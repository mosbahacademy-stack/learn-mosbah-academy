create extension if not exists pgcrypto;

set check_function_bodies = off;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('student', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'enrollment_status') then
    create type public.enrollment_status as enum ('active', 'suspended');
  end if;
end
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'student'
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

create or replace function public.prevent_unauthorized_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and not public.is_admin() then
    raise exception 'Only admins can change profile roles';
  end if;

  return new;
end;
$$;

create or replace function public.touch_lesson_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role public.app_role not null default 'student',
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  thumbnail_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  video_url text,
  pdf_url text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  constraint lessons_order_index_nonnegative check (order_index >= 0)
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  pass_mark integer not null default 60,
  created_at timestamptz not null default now(),
  constraint quizzes_pass_mark_valid check (pass_mark between 0 and 100),
  constraint quizzes_one_per_lesson unique (lesson_id)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_text text not null,
  options jsonb not null,
  correct_option_index integer not null,
  created_at timestamptz not null default now(),
  constraint questions_options_is_array check (jsonb_typeof(options) = 'array'),
  constraint questions_min_options check (jsonb_array_length(options) >= 2),
  constraint questions_correct_option_index_valid check (correct_option_index >= 0)
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status public.enrollment_status not null default 'active',
  enrolled_at timestamptz not null default now(),
  constraint enrollments_unique_user_course unique (user_id, course_id)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint lesson_progress_unique_user_lesson unique (user_id, lesson_id)
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  score integer not null,
  passed boolean not null default false,
  attempted_at timestamptz not null default now(),
  constraint quiz_attempts_score_valid check (score between 0 and 100)
);

create index if not exists idx_lessons_course_id on public.lessons(course_id);
create index if not exists idx_lessons_course_order on public.lessons(course_id, order_index);
create index if not exists idx_quizzes_lesson_id on public.quizzes(lesson_id);
create index if not exists idx_questions_quiz_id on public.questions(quiz_id);
create index if not exists idx_enrollments_user_id on public.enrollments(user_id);
create index if not exists idx_enrollments_course_id on public.enrollments(course_id);
create index if not exists idx_lesson_progress_user_id on public.lesson_progress(user_id);
create index if not exists idx_lesson_progress_lesson_id on public.lesson_progress(lesson_id);
create index if not exists idx_quiz_attempts_user_id on public.quiz_attempts(user_id);
create index if not exists idx_quiz_attempts_quiz_id on public.quiz_attempts(quiz_id);

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists on_profiles_role_change on public.profiles;
create trigger on_profiles_role_change
before update on public.profiles
for each row execute function public.prevent_unauthorized_role_change();

drop trigger if exists on_lesson_progress_touch_updated_at on public.lesson_progress;
create trigger on_lesson_progress_touch_updated_at
before update on public.lesson_progress
for each row execute function public.touch_lesson_progress_updated_at();

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quiz_attempts enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_admin_only" on public.profiles;
create policy "profiles_insert_admin_only"
on public.profiles
for insert
with check (public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_delete_admin_only" on public.profiles;
create policy "profiles_delete_admin_only"
on public.profiles
for delete
using (public.is_admin());

drop policy if exists "courses_select_published_or_admin" on public.courses;
create policy "courses_select_published_or_admin"
on public.courses
for select
using (published = true or public.is_admin());

drop policy if exists "courses_insert_admin_only" on public.courses;
create policy "courses_insert_admin_only"
on public.courses
for insert
with check (public.is_admin());

drop policy if exists "courses_update_admin_only" on public.courses;
create policy "courses_update_admin_only"
on public.courses
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "courses_delete_admin_only" on public.courses;
create policy "courses_delete_admin_only"
on public.courses
for delete
using (public.is_admin());

drop policy if exists "lessons_select_enrolled_or_admin" on public.lessons;
create policy "lessons_select_enrolled_or_admin"
on public.lessons
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.user_id = auth.uid()
      and e.course_id = lessons.course_id
      and e.status = 'active'
      and c.published = true
  )
);

drop policy if exists "lessons_insert_admin_only" on public.lessons;
create policy "lessons_insert_admin_only"
on public.lessons
for insert
with check (public.is_admin());

drop policy if exists "lessons_update_admin_only" on public.lessons;
create policy "lessons_update_admin_only"
on public.lessons
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "lessons_delete_admin_only" on public.lessons;
create policy "lessons_delete_admin_only"
on public.lessons
for delete
using (public.is_admin());

drop policy if exists "quizzes_select_enrolled_or_admin" on public.quizzes;
create policy "quizzes_select_enrolled_or_admin"
on public.quizzes
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.lessons l
    join public.enrollments e on e.course_id = l.course_id
    join public.courses c on c.id = l.course_id
    where l.id = quizzes.lesson_id
      and e.user_id = auth.uid()
      and e.status = 'active'
      and c.published = true
  )
);

drop policy if exists "quizzes_insert_admin_only" on public.quizzes;
create policy "quizzes_insert_admin_only"
on public.quizzes
for insert
with check (public.is_admin());

drop policy if exists "quizzes_update_admin_only" on public.quizzes;
create policy "quizzes_update_admin_only"
on public.quizzes
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "quizzes_delete_admin_only" on public.quizzes;
create policy "quizzes_delete_admin_only"
on public.quizzes
for delete
using (public.is_admin());

drop policy if exists "questions_select_enrolled_or_admin" on public.questions;
create policy "questions_select_enrolled_or_admin"
on public.questions
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.quizzes q
    join public.lessons l on l.id = q.lesson_id
    join public.enrollments e on e.course_id = l.course_id
    join public.courses c on c.id = l.course_id
    where q.id = questions.quiz_id
      and e.user_id = auth.uid()
      and e.status = 'active'
      and c.published = true
  )
);

drop policy if exists "questions_insert_admin_only" on public.questions;
create policy "questions_insert_admin_only"
on public.questions
for insert
with check (public.is_admin());

drop policy if exists "questions_update_admin_only" on public.questions;
create policy "questions_update_admin_only"
on public.questions
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "questions_delete_admin_only" on public.questions;
create policy "questions_delete_admin_only"
on public.questions
for delete
using (public.is_admin());

drop policy if exists "enrollments_select_own_or_admin" on public.enrollments;
create policy "enrollments_select_own_or_admin"
on public.enrollments
for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "enrollments_insert_admin_only" on public.enrollments;
create policy "enrollments_insert_admin_only"
on public.enrollments
for insert
with check (public.is_admin());

drop policy if exists "enrollments_update_admin_only" on public.enrollments;
create policy "enrollments_update_admin_only"
on public.enrollments
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "enrollments_delete_admin_only" on public.enrollments;
create policy "enrollments_delete_admin_only"
on public.enrollments
for delete
using (public.is_admin());

drop policy if exists "lesson_progress_select_own_or_admin" on public.lesson_progress;
create policy "lesson_progress_select_own_or_admin"
on public.lesson_progress
for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "lesson_progress_insert_own_or_admin" on public.lesson_progress;
create policy "lesson_progress_insert_own_or_admin"
on public.lesson_progress
for insert
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "lesson_progress_update_own_or_admin" on public.lesson_progress;
create policy "lesson_progress_update_own_or_admin"
on public.lesson_progress
for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "lesson_progress_delete_admin_only" on public.lesson_progress;
create policy "lesson_progress_delete_admin_only"
on public.lesson_progress
for delete
using (public.is_admin());

drop policy if exists "quiz_attempts_select_own_or_admin" on public.quiz_attempts;
create policy "quiz_attempts_select_own_or_admin"
on public.quiz_attempts
for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "quiz_attempts_insert_own_or_admin" on public.quiz_attempts;
create policy "quiz_attempts_insert_own_or_admin"
on public.quiz_attempts
for insert
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "quiz_attempts_update_admin_only" on public.quiz_attempts;
create policy "quiz_attempts_update_admin_only"
on public.quiz_attempts
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "quiz_attempts_delete_admin_only" on public.quiz_attempts;
create policy "quiz_attempts_delete_admin_only"
on public.quiz_attempts
for delete
using (public.is_admin());

set check_function_bodies = on;