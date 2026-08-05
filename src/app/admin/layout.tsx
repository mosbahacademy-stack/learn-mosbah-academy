import { requireRole } from '@/lib/auth';
import { BrandFooter } from '@/components/layout/brand-footer';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('admin');

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef3fb_45%,#f8fbff_100%)]">
      {children}
      <BrandFooter />
    </div>
  );
}