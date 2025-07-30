'use client';

import { usePathname } from 'next/navigation';
import { Header } from "@/src/components/layout/header";
import { Footer } from "@/src/components/layout/footer";
import { AuthProvider } from "@/src/hooks/useAuth";
import { ToastProvider } from "@/src/components/providers/ToastProvider";
import MobileOptimizer from "./MobileOptimizer";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');
  const isHomepage = pathname === '/';

  return (
    <AuthProvider>
      <ToastProvider>
        {/* Mobile optimizations - runs after hydration */}
        <MobileOptimizer />
        
        {!isDashboard && <Header />}
        <main 
          className={!isDashboard && !isHomepage ? "pt-20 md:pt-24 lg:pt-28" : ""}
          style={{ backgroundColor: 'inherit' }}
        >
          {children}
        </main>
        {!isDashboard && <Footer />}
      </ToastProvider>
    </AuthProvider>
  );
} 