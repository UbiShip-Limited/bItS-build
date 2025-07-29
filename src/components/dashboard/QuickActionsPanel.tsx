'use client';

import React from 'react';
import { Send, Calendar, FileText, Users } from 'lucide-react';
import Link from 'next/link';

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
      color: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    {
      id: 'payment-link',
      title: 'Payment Link',
      description: 'Send to customer',
      icon: <Send className="w-5 h-5" />,
      onClick: onSendPaymentLink,
      color: 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/30'
    },
    {
      id: 'new-customer',
      title: 'Add Customer',
      description: 'Create profile',
      icon: <Users className="w-5 h-5" />,
      link: '/dashboard/customers?action=new',
      color: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30'
    },
    {
      id: 'view-requests',
      title: 'View Requests',
      description: 'Review submissions',
      icon: <FileText className="w-5 h-5" />,
      link: '/dashboard/tattoo-request',
      color: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/30'
    }
  ];

  const handleActionClick = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    }
  };

  return (
    <div className={`bg-[#111111] rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          if (action.link) {
            return (
              <Link
                key={action.id}
                href={action.link}
                className={`
                  p-4 rounded-lg border transition-all duration-200
                  flex flex-col items-center text-center gap-2
                  ${action.color}
                  hover:scale-105 hover:shadow-lg
                `}
              >
                <div className="p-2 rounded-lg bg-current/10">
                  {action.icon}
                </div>
                <div>
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs opacity-70 mt-0.5">{action.description}</p>
                </div>
              </Link>
            );
          }

          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={`
                p-4 rounded-lg border transition-all duration-200
                flex flex-col items-center text-center gap-2
                ${action.color}
                hover:scale-105 hover:shadow-lg
              `}
            >
              <div className="p-2 rounded-lg bg-current/10">
                {action.icon}
              </div>
              <div>
                <p className="font-medium text-sm">{action.title}</p>
                <p className="text-xs opacity-70 mt-0.5">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}