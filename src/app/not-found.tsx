import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>الصفحة غير موجودة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">قد يكون الرابط غير صحيح أو تم نقل الصفحة.</p>
          <Button asChild>
            <Link href="/">العودة إلى الصفحة الرئيسية</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}