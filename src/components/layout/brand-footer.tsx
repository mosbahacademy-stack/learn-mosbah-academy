import Image from 'next/image';
import Link from 'next/link';

const WHATSAPP_NUMBER = '213655198992';
const CONTACT_EMAIL = 'mosbahacademy@gmail.com';

export function BrandFooter() {
  return (
    <footer className="mx-auto mt-8 w-full max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-brand-deep px-6 py-10 text-white shadow-glow sm:px-8">
      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h3 className="text-2xl font-bold">أكاديمية مصباح للتعليم والتطوير</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
            متابعة تعليمية واضحة، إدارة مرنة للمحتوى، وتجربة عربية متسقة مع هوية الأكاديمية الرسمية.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-100">
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="rounded-full border border-white/30 px-4 py-2 transition hover:bg-white/10" target="_blank" rel="noreferrer">
              واتساب: 0655198992
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="rounded-full border border-white/30 px-4 py-2 transition hover:bg-white/10">
              {CONTACT_EMAIL}
            </a>
            <Link href="/" className="rounded-full border border-accent/60 bg-accent px-4 py-2 text-white transition hover:bg-accent/90">
              الرجوع للرئيسية
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[220px] rounded-3xl border border-white/40 bg-white/85 p-4 backdrop-blur md:mx-0">
          <Image src="/mosbah-logo.svg" alt="شعار أكاديمية مصباح" width={200} height={200} className="h-auto w-full" />
        </div>
      </div>
      <p className="mt-8 border-t border-white/20 pt-4 text-xs text-slate-300">© {new Date().getFullYear()} أكاديمية مصباح. جميع الحقوق محفوظة.</p>
    </footer>
  );
}