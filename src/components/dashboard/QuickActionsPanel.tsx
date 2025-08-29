'use client';

import React from 'react';
import { Send, Calendar, FileText, Users } from 'lucide-react';
import Link from 'next/link';
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  link?: string;
  onClick?: () => void;
  color: string;
}

interface QuickActionsPanelProps {
  onCreateAppointment?: () => void;
  onSendPaymentLink?: () => void;
  className?: string;
}

export default function QuickActionsPanel({ 
  onCreateAppointment, 
  onSendPaymentLink,
  className = '' 
}: QuickActionsPanelProps) {
  const actions: QuickAction[] = [
    {
      id: 'new-appointment',
      title: 'New Appointment',
      description: 'Schedule a session',
      icon: <Calendar className="w-5 h-5" />,
      link: '/dashboard/appointments?action=new',
      color: `bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30`
    },
    {
      id: 'payment-link',
      title: 'Payment Link',
      description: 'Send to customer',
      icon: <Send className="w-5 h-5" />,
      link: onSendPaymentLink ? undefined : '/dashboard/payments?action=new-link',
      onClick: onSendPaymentLink,
      color: `bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/30`
    },
    {
      id: 'new-customer',
      title: 'Add Customer',
      description: 'Create profile',
      icon: <Users className="w-5 h-5" />,
      link: '/dashboard/customers?action=new',
      color: `bg-gold-500/10 hover:bg-gold-500/20 ${colors.textAccent} ${colors.borderDefault}`
    },
    {
      id: 'view-requests',
      title: 'View Requests',
      description: 'Review submissions',
      icon: <FileText className="w-5 h-5" />,
      link: '/dashboard/tattoo-request',
      color: `bg-gold-500/10 hover:bg-gold-500/20 ${colors.textAccent} ${colors.borderDefault}`
    }
  ];

  const handleActionClick = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    }
  };

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          if (action.link) {
            return (
              <Link
                key={action.id}
                href={action.link}
                className={`
                  p-4 ${components.radius.medium} border ${effects.transitionNormal}
                  flex flex-col items-center text-center gap-2
                  ${action.color}
                  hover:scale-[1.02] hover:shadow-soft group
                `}
              >
                <div className="relative">
                  <div className="p-2 ${components.radius.small} bg-current/10 relative z-10">
                    {action.icon}
                  </div>
                  <div className="absolute inset-0 bg-current/20 rounded-full blur-md scale-0 group-hover:scale-150 ${effects.transitionNormal}"></div>
                </div>
                <div>
                  <p className={`${typography.fontMedium} ${typography.textSm}`}>{action.title}</p>
                  <p className={`${typography.textXs} opacity-70 mt-0.5`}>{action.description}</p>
                </div>
              </Link>
            );
          }

          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={`
                p-4 ${components.radius.medium} border ${effects.transitionNormal}
                flex flex-col items-center text-center gap-2
                ${action.color}
                hover:scale-[1.02] hover:shadow-soft group
              `}
            >
              <div className="relative">
                <div className="p-2 ${components.radius.small} bg-current/10 relative z-10">
                  {action.icon}
                </div>
                <div className="absolute inset-0 bg-current/20 rounded-full blur-md scale-0 group-hover:scale-150 ${effects.transitionNormal}"></div>
              </div>
              <div>
                <p className={`${typography.fontMedium} ${typography.textSm}`}>{action.title}</p>
                <p className={`${typography.textXs} opacity-70 mt-0.5`}>{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}