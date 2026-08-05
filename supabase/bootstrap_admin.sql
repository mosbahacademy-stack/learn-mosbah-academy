
update public.profiles
set role = 'admin',
    full_name = coalesce(nullif(full_name, ''), 'مدير أكاديمية مصباح')
where email = 'mosbahacademy@gmail.com';

-- Verify:
-- select id, email, full_name, role from public.profiles where email = 'mosbahacademy@gmail.com';