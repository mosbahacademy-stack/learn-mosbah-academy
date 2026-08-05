# Mosbah Academy LMS

منصة LMS عربية مبنية بـ Next.js وSupabase لأكاديمية مصباح.

## النشر أونلاين (Vercel + Supabase)

### 1) تجهيز قاعدة البيانات (Supabase)

1. افتح مشروع Supabase الإنتاجي.
2. نفّذ ملف الهجرة [supabase/migrations/0001_initial_schema.sql](supabase/migrations/0001_initial_schema.sql).
3. بعد إنشاء أول مستخدم (من Auth)، عدّل البريد داخل [supabase/bootstrap_admin.sql](supabase/bootstrap_admin.sql) ثم نفّذه لمنح صلاحية المدير.
4. اختياريًا نفّذ [supabase/seed.sql](supabase/seed.sql) لإضافة بيانات أولية.

### 2) رفع المشروع على Vercel

1. ارفع المستودع إلى GitHub.
2. في Vercel: `Add New Project` ثم اختر المستودع.
3. اترك إعدادات البناء الافتراضية لـ Next.js:
	- Build Command: `npm run build`
	- Output: `.next`
4. أضف متغيرات البيئة التالية في Vercel (Production):
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
	- `SUPABASE_SERVICE_ROLE_KEY`
5. مهم: لا تضف `DEV_ADMIN_BYPASS=true` في بيئة الإنتاج.
6. اضغط `Deploy`.

### 3) فحص ما بعد النشر (Production Smoke Test)

بعد أول نشر، اختبر الروابط التالية:

1. `/` يجب أن تفتح الصفحة الرئيسية بنجاح.
2. `/login` يجب أن تعرض نموذج تسجيل الدخول.
3. `/admin` بدون جلسة يجب أن يعيد التوجيه إلى `/login`.
4. `/dashboard` بدون جلسة يجب أن يعيد التوجيه إلى `/login`.
5. `/mosbah-logo.svg` يجب أن يعمل (200).
6. سجّل الدخول بحساب مدير وتأكد من فتح `/admin` بدون أخطاء.
7. أنشئ طالبًا من `/admin/students` للتأكد أن `SUPABASE_SERVICE_ROLE_KEY` يعمل فعليًا.

### 4) ملاحظات جاهزية الإنتاج

1. التحذير الخاص بـ `@next/swc-win32-x64-msvc` ظهر محليًا على Windows فقط، لكنه لم يمنع نجاح build/start.
2. أخطاء `dev` المتعلقة بـ `.next` تم تجاوزها عبر تنظيف `.next` وإعادة البناء، بينما تشغيل الإنتاج كان مستقرًا.
3. اجعل مفاتيح Supabase محصورة في بيئة Vercel فقط، ولا تضعها داخل المستودع.

## الإعداد المحلي لاحقًا

1. أنشئ مشروع Supabase جديدًا.
2. نفّذ ملف الهجرة [supabase/migrations/0001_initial_schema.sql](supabase/migrations/0001_initial_schema.sql).
3. أنشئ ملف `.env.local` اعتمادًا على [\.env.example](.env.example).
4. أنشئ أول مستخدم من صفحة التسجيل أو من Supabase Auth.
5. نفّذ [supabase/bootstrap_admin.sql](supabase/bootstrap_admin.sql) بعد تعديل البريد الإلكتروني لتحويل هذا المستخدم إلى مدير.
6. اختياريًا نفّذ [supabase/seed.sql](supabase/seed.sql) لإضافة دورات ودروس واختبارات أولية.

## ملاحظات التشغيل

- `NEXT_PUBLIC_SUPABASE_URL` و `NEXT_PUBLIC_SUPABASE_ANON_KEY` مطلوبان للواجهة.
- `SUPABASE_SERVICE_ROLE_KEY` مطلوب فقط لإنشاء الطلاب من لوحة الإدارة.
- لا تشارك `SUPABASE_SERVICE_ROLE_KEY` داخل الواجهة أو المستودع العام.
- `DEV_ADMIN_BYPASS` مخصص للتطوير المحلي فقط، ويجب إيقافه في الإنتاج.