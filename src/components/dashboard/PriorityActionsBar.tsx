'use client';

import { AlertCircle, Clock, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';

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
      ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' 
      : 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20';
  };

  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
        
        <div className="flex-1 flex items-center gap-2 overflow-x-auto">
          {actions.map((action) => (
            <Link
              key={action.id}
              href={action.link}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md border whitespace-nowrap
                transition-all duration-200 text-sm
                ${getActionColor(action.urgency)}
                hover:scale-105
              `}
            >
              {getIcon(action.type)}
              <span className="font-medium">{action.title}</span>
              <span className="opacity-70">{action.description}</span>
              {action.time && (
                <span className="opacity-70">• {action.time}</span>
              )}
            </Link>
          ))}
        </div>

        <Link
          href="/dashboard/notifications"
          className="text-xs text-gray-400 hover:text-white transition-colors whitespace-nowrap"
        >
          View all →
        </Link>
      </div>
    </div>
  );
}