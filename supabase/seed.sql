-- Seed data for local Mosbah Academy LMS setup
-- Run after migrations if you want initial visible content in the dashboard.

-- Note:
-- 1. Create your auth users first from Supabase Auth or via the Admin API.
-- 2. Replace the UUIDs below with actual auth.users/profile IDs in your project.

-- Example admin promotion
-- update public.profiles
-- set role = 'admin', full_name = 'مدير أكاديمية مصباح'
-- where email = 'admin@mosbahacademy.local';

insert into public.courses (id, title, description, published)
values
  ('11111111-1111-1111-1111-111111111111', 'الذكاء الاصطناعي للمبتدئين', 'مدخل عملي ومبسط إلى أدوات الذكاء الاصطناعي وتطبيقاتها التعليمية.', true),
  ('22222222-2222-2222-2222-222222222222', 'البرمجة والإعلام الآلي', 'مبادئ البرمجة والتفكير المنطقي وصناعة المشاريع التقنية.', true)
on conflict (id) do nothing;

insert into public.lessons (id, course_id, title, video_url, pdf_url, order_index)
values
  ('11111111-aaaa-1111-aaaa-111111111111', '11111111-1111-1111-1111-111111111111', 'مدخل إلى الذكاء الاصطناعي', 'https://iframe.mediadelivery.net/embed/example-ai-intro', 'https://example.com/ai-intro.pdf', 1),
  ('11111111-bbbb-1111-bbbb-111111111111', '11111111-1111-1111-1111-111111111111', 'أدوات الكتابة الذكية', 'https://iframe.mediadelivery.net/embed/example-ai-tools', null, 2),
  ('22222222-aaaa-2222-aaaa-222222222222', '22222222-2222-2222-2222-222222222222', 'أساسيات البرمجة', 'https://iframe.mediadelivery.net/embed/example-coding-intro', 'https://example.com/coding-intro.pdf', 1)
on conflict (id) do nothing;

insert into public.quizzes (id, lesson_id, title, pass_mark)
values
  ('33333333-1111-3333-1111-333333333333', '11111111-aaaa-1111-aaaa-111111111111', 'اختبار مدخل الذكاء الاصطناعي', 60),
  ('33333333-2222-3333-2222-333333333333', '22222222-aaaa-2222-aaaa-222222222222', 'اختبار أساسيات البرمجة', 70)
on conflict (id) do nothing;

insert into public.questions (id, quiz_id, question_text, options, correct_option_index)
values
  (
    '44444444-1111-4444-1111-444444444441',
    '33333333-1111-3333-1111-333333333333',
    'ما الفائدة الأساسية من أدوات الذكاء الاصطناعي في التعلم؟',
    '["تسريع الفهم والإنتاج", "إلغاء دور المعلم", "منع التدريب العملي"]'::jsonb,
    0
  ),
  (
    '44444444-1111-4444-1111-444444444442',
    '33333333-1111-3333-1111-333333333333',
    'أي استخدام يعد مناسبًا تربويًا؟',
    '["الاعتماد الكامل دون مراجعة", "مراجعة المخرجات وتحسينها", "نسخ الإجابات دون فهم"]'::jsonb,
    1
  ),
  (
    '44444444-2222-4444-2222-444444444441',
    '33333333-2222-3333-2222-333333333333',
    'ما أول مهارة يحتاجها المبتدئ في البرمجة؟',
    '["التفكير المنطقي", "شراء حاسوب قوي", "حفظ جميع الأوامر"]'::jsonb,
    0
  )
on conflict (id) do nothing;