'use client';

import { usePathname } from 'next/navigation';
import { Header } from "@/src/components/layout/header";
import { Footer } from "@/src/components/layout/footer";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  return (
    <>
      {!isDashboard && <Header />}
      <main className={!isDashboard ? "pt-16 md:pt-20" : ""}>
        {children}
      </main>
      {!isDashboard && <Footer />}
    </>
  );
} 