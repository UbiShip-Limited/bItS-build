'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary';
}

interface DashboardEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
}

export function DashboardEmptyState({
  icon: Icon,
  title,
  description,
  actions
}: DashboardEmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-[#C9A449]/10 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-[#C9A449]" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>

        {/* Description */}
        {description && (
          <p className="text-gray-400 mb-6">{description}</p>
        )}

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className="flex items-center justify-center gap-3">
            {actions.map((action, index) => {
              const className = `
                px-6 py-2 rounded-lg font-medium transition-all duration-200
                ${action.variant === 'primary' 
                  ? 'bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] shadow-lg shadow-[#C9A449]/20' 
                  : 'border border-[#1a1a1a] hover:border-[#C9A449]/30 text-gray-400 hover:text-[#C9A449]'
                }
              `;

              if (action.href) {
                return (
                  <a key={index} href={action.href} className={className}>
                    {action.label}
                  </a>
                );
              }

              return (
                <button key={index} onClick={action.onClick} className={className}>
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}