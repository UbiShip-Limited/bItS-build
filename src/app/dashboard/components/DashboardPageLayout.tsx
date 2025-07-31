'use client';

import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';

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
    const className = action.variant === 'primary' 
      ? `${components.button.base} ${components.button.sizes.medium} ${components.button.variants.primary}`
      : action.variant === 'ghost'
      ? `${components.button.base} ${components.button.sizes.medium} ${components.button.variants.ghost}`
      : `${components.button.base} ${components.button.sizes.medium} ${components.button.variants.secondary}`;

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
      <div className={`${layout.containerXl} mx-auto`}>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-4">
            <ol className={`flex items-center space-x-2 ${typography.textSm}`}>
              <li>
                <Link href="/dashboard" className={`${colors.textSecondary} hover:${colors.textPrimary} ${effects.transitionNormal}`}>
                  Dashboard
                </Link>
              </li>
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  <ChevronRight className={`w-4 h-4 ${colors.textMuted} mx-2`} />
                  {crumb.href ? (
                    <Link href={crumb.href} className={`${colors.textSecondary} hover:${colors.textPrimary} ${effects.transitionNormal}`}>
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={`${colors.textPrimary} ${typography.fontMedium}`}>{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Main Container */}
        <div className={`relative border ${colors.borderDefault} ${components.radius.large} bg-gradient-to-b from-obsidian/95 to-obsidian/90 backdrop-blur-sm`}>
          {/* Page Header */}
          <div className={`border-b ${colors.borderSubtle} px-8 py-6`}>
            <div className="flex justify-between items-start">
              <div>
                <h1 className={`${typography.h2} ${colors.textPrimary} mb-2`}>
                  {title}
                </h1>
                {description && (
                  <p className={`${typography.textLg} ${colors.textSecondary}`}>{description}</p>
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
                  <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${colors.borderDefault} mx-auto mb-4`}></div>
                  <p className={`${colors.textSecondary}`}>Loading...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center max-w-md">
                  <div className={`bg-red-500/10 border border-red-500/30 ${components.radius.medium} p-6`}>
                    <p className={`text-red-400 ${typography.fontMedium} mb-4`}>{error}</p>
                    {onRetry && (
                      <button 
                        onClick={onRetry}
                        className={`${components.button.base} ${components.button.sizes.medium} ${components.button.variants.primary}`}
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