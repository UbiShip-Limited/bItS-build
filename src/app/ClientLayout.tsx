'use client';

import { usePathname } from 'next/navigation';
import { Header } from "@/src/components/layout/header";
import { Footer } from "@/src/components/layout/footer";
import { AuthProvider } from "@/src/hooks/useAuth";
import MobileOptimizer from "./MobileOptimizer";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  return (
    <AuthProvider>
      {/* Mobile optimizations - runs after hydration */}
      <MobileOptimizer />
      
      {!isDashboard && <Header />}
      <main className={!isDashboard ? "pt-16 md:pt-20" : ""}>
        {children}
      </main>
      {!isDashboard && <Footer />}
    </AuthProvider>
  );
} 