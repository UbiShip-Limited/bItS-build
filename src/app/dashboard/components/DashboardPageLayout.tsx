'use client';

import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

interface DashboardPageLayoutProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: PageAction[];
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function DashboardPageLayout({
  title,
  description,
  breadcrumbs,
  actions,
  children,
  loading,
  error,
  onRetry
}: DashboardPageLayoutProps) {
  const renderAction = (action: PageAction, index: number) => {
    const className = `
      flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
      ${action.variant === 'primary' 
        ? 'bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] shadow-lg shadow-[#C9A449]/20' 
        : action.variant === 'ghost'
        ? 'text-gray-400 hover:text-white hover:bg-white/5'
        : 'border border-[#1a1a1a] hover:border-[#C9A449]/30 text-gray-400 hover:text-[#C9A449]'
      }
    `;

    const content = (
      <>
        {action.icon}
        <span>{action.label}</span>
      </>
    );

    if (action.href) {
      return (
        <Link key={index} href={action.href} className={className}>
          {content}
        </Link>
      );
    }

    return (
      <button key={index} onClick={action.onClick} className={className}>
        {content}
      </button>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-4">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  <ChevronRight className="w-4 h-4 text-gray-600 mx-2" />
                  {crumb.href ? (
                    <Link href={crumb.href} className="text-gray-400 hover:text-white transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-white font-medium">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Main Container */}
        <div className="relative border border-[#C9A449]/30 rounded-2xl bg-[#0a0a0a]/90 backdrop-blur-sm">
          {/* Page Header */}
          <div className="border-b border-[#1a1a1a] px-8 py-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-heading font-bold text-white mb-2 tracking-wide">
                  {title}
                </h1>
                {description && (
                  <p className="text-gray-400 text-lg">{description}</p>
                )}
              </div>
              {actions && actions.length > 0 && (
                <div className="flex items-center gap-3">
                  {actions.map(renderAction)}
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <span className="loading loading-spinner loading-lg text-[#C9A449]"></span>
                  <p className="mt-4 text-gray-400">Loading...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center max-w-md">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                    <p className="text-red-400 font-medium mb-4">{error}</p>
                    {onRetry && (
                      <button 
                        onClick={onRetry}
                        className="px-6 py-2 bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] rounded-lg font-medium shadow-lg shadow-[#C9A449]/20 transition-all duration-300"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </div>
  );
}