'use client';

import { usePathname } from 'next/navigation';
import PostAuthLayout from '@/components/layouts/postauth/layout';
import PostAuthFormsLayout from '@/components/layouts/postauthforms/layout';
import { ThemeReady } from '@/components/atoms/ThemeReady';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  return (
    <ThemeReady>
      {pathname?.includes('/business-profile') ? (
        <PostAuthFormsLayout>{children}</PostAuthFormsLayout>
      ) : (
        <PostAuthLayout>{children}</PostAuthLayout>
      )}
    </ThemeReady>
  );
}