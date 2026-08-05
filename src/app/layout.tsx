import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';

import './globals.css';

const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo' });

export const metadata: Metadata = {
  title: 'أكاديمية مصباح | نظام إدارة التعلم',
  description: 'منصة تعليمية عربية بإدارة بسيطة وتجربة RTL متوافقة مع هوية أكاديمية مصباح.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body>{children}</body>
    </html>
  );
}