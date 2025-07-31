'use client';

import { AlertCircle, Clock, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';

interface PriorityAction {
  id: string;
  type: 'overdue_request' | 'unconfirmed_appointment' | 'urgent_request' | 'upcoming_appointment';
  title: string;
  description: string;
  link: string;
  urgency: 'high' | 'medium';
  time?: string;
}

interface PriorityActionsBarProps {
  actions: PriorityAction[];
}

export default function PriorityActionsBar({ actions }: PriorityActionsBarProps) {
  if (!actions || actions.length === 0) {
    return null;
  }

  const getIcon = (type: PriorityAction['type']) => {
    switch (type) {
      case 'overdue_request':
        return <FileText className="w-4 h-4" />;
      case 'unconfirmed_appointment':
        return <Calendar className="w-4 h-4" />;
      case 'urgent_request':
        return <AlertCircle className="w-4 h-4" />;
      case 'upcoming_appointment':
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActionColor = (urgency: PriorityAction['urgency']) => {
    return urgency === 'high' 
      ? `bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 ${effects.transitionNormal}` 
      : `bg-gold-500/10 ${colors.borderDefault} ${colors.textAccent} hover:bg-gold-500/20 ${effects.transitionNormal}`;
  };

  return (
    <div className={`bg-gradient-to-r from-red-500/10 via-red-500/5 to-red-500/10 border border-red-500/20 ${components.radius.medium} p-4 backdrop-blur-sm`}>
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 animate-pulse" />
        
        <div className="flex-1 flex items-center gap-2 overflow-x-auto">
          {actions.map((action) => (
            <Link
              key={action.id}
              href={action.link}
              className={`
                flex items-center gap-2 px-3 py-1.5 ${components.radius.small} border whitespace-nowrap
                ${typography.textSm}
                ${getActionColor(action.urgency)}
                hover:scale-[1.02] hover:shadow-soft
              `}
            >
              {getIcon(action.type)}
              <span className={typography.fontMedium}>{action.title}</span>
              <span className="opacity-70">{action.description}</span>
              {action.time && (
                <span className="opacity-70">• {action.time}</span>
              )}
            </Link>
          ))}
        </div>

        <Link
          href="/dashboard/notifications"
          className={`${typography.textXs} ${colors.textSecondary} hover:${colors.textPrimary} ${effects.transitionNormal} whitespace-nowrap`}
        >
          View all →
        </Link>
      </div>
    </div>
  );
}