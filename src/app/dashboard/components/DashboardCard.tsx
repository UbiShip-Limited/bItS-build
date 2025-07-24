'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

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
      bg-[#111111] border border-[#1a1a1a] rounded-2xl 
      transition-all duration-300 hover:border-[#C9A449]/30 
      backdrop-blur-sm ${className}
    `}>
      {/* Card Header */}
      <div className="px-6 py-5 border-b border-[#1a1a1a]">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {headerAction}
            {viewDetailsHref && (
              <Link 
                href={viewDetailsHref}
                className="text-sm text-[#C9A449] font-medium transition-all duration-200 hover:text-[#E5B563] group flex items-center gap-1"
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