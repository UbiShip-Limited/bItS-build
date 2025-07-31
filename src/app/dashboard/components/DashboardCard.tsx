'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  viewDetailsHref?: string;
  viewDetailsLabel?: string;
  headerAction?: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function DashboardCard({
  title,
  subtitle,
  children,
  viewDetailsHref,
  viewDetailsLabel = 'View details',
  headerAction,
  className = '',
  noPadding = false
}: DashboardCardProps) {
  return (
    <div className={`
      bg-gradient-to-b from-obsidian/95 to-obsidian/90 border ${colors.borderSubtle} ${components.radius.large} 
      ${effects.transitionNormal} hover:${colors.borderDefault} hover:shadow-soft 
      backdrop-blur-sm ${className}
    `}>
      {/* Card Header */}
      <div className={`px-6 py-5 border-b ${colors.borderSubtle}`}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className={`${typography.textLg} ${typography.fontSemibold} ${colors.textPrimary}`}>{title}</h2>
            {subtitle && (
              <p className={`${typography.textSm} ${colors.textMuted} mt-1`}>{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {headerAction}
            {viewDetailsHref && (
              <Link 
                href={viewDetailsHref}
                className={`${typography.textSm} ${colors.textAccent} ${typography.fontMedium} ${effects.transitionNormal} hover:${colors.textAccentProminent} group flex items-center gap-1`}
              >
                {viewDetailsLabel}
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
}