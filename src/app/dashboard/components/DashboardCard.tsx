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
    <div className={`bg-gradient-to-b from-obsidian/95 to-obsidian/90 border border-gold-500/10 rounded-3xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-gold-500/30 hover:shadow-soft backdrop-blur-sm ${className}`}>
      {/* Card Header */}
      <div className="px-6 py-5 border-b border-gold-500/10">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {subtitle && (
              <p className="text-sm text-white/50 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {headerAction}
            {viewDetailsHref && (
              <Link
                href={viewDetailsHref}
                className="text-sm text-gold-500 font-medium transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:text-gold-400 group flex items-center gap-1"
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