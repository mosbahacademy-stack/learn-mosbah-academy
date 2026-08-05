import { z } from 'zod';

import { ACADEMIC_LEVEL_OPTIONS, ALGERIAN_MUNICIPALITIES, ALGERIAN_WILAYAS } from '@/lib/algeria-data';

export const loginSchema = z.object({
  email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('أدخل بريدًا إلكترونيًا صحيحًا'),
  password: z.string().min(6, 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل')
});

export const registerSchema = z
  .object({
    firstName: z.string().min(2, 'الاسم مطلوب'),
    lastName: z.string().min(2, 'اللقب مطلوب'),
    state: z.string().refine((value) => ALGERIAN_WILAYAS.includes(value as (typeof ALGERIAN_WILAYAS)[number]), {
      message: 'اختر ولاية صحيحة من القائمة'
    }),
    city: z.string().min(2, 'البلدية مطلوبة'),
    institution: z.string().min(2, 'اسم المؤسسة مطلوب'),
    phone: z.string().regex(/^(0)(5|6|7)[0-9]{8}$/, 'رقم الهاتف غير صالح (مثال: 05XXXXXXXX)'),
    academicLevel: z.string().refine((value) => ACADEMIC_LEVEL_OPTIONS.includes(value as (typeof ACADEMIC_LEVEL_OPTIONS)[number]), {
      message: 'اختر مستوى دراسي صحيح من القائمة'
    }),
    email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('أدخل بريدًا إلكترونيًا صحيحًا'),
    password: z.string().min(6, 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل'),
    confirmPassword: z.string().min(6, 'تأكيد كلمة المرور مطلوب')
  })
  .superRefine((data, ctx) => {
    const cities = ALGERIAN_MUNICIPALITIES[data.state as keyof typeof ALGERIAN_MUNICIPALITIES] ?? [];

    if (!cities.includes(data.city)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'اختر بلدية صحيحة من القائمة',
        path: ['city']
      });
    }

    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'كلمتا المرور غير متطابقتين',
        path: ['confirmPassword']
      });
    }
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;