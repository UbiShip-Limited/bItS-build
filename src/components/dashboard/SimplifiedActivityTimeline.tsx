'use client';

import { Clock, Calendar, DollarSign, FileText, User, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';

interface ActivityItem {
  id: string;
  type: 'appointment_booked' | 'payment_received' | 'request_submitted' | 'customer_registered' | 'appointment_completed';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: {
    amount?: number;
    customerName?: string;
    appointmentTime?: Date;
  };
}

interface SimplifiedActivityTimelineProps {
  activities: ActivityItem[];
  className?: string;
}

export default function SimplifiedActivityTimeline({ activities, className = '' }: SimplifiedActivityTimelineProps) {
  // Show only 5 most recent activities
  const displayedActivities = activities.slice(0, 5);

  const getIcon = (type: ActivityItem['type']) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'appointment_booked':
        return <Calendar className={iconClass} />;
      case 'payment_received':
        return <DollarSign className={iconClass} />;
      case 'request_submitted':
        return <FileText className={iconClass} />;
      case 'customer_registered':
        return <User className={iconClass} />;
      case 'appointment_completed':
        return <CheckCircle className={iconClass} />;
    }
  };

  const getIconColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'appointment_booked':
        return 'text-blue-400';
      case 'payment_received':
        return 'text-green-400';
      case 'request_submitted':
        return colors.textAccent;
      case 'customer_registered':
        return colors.textSecondary;
      case 'appointment_completed':
        return colors.textAccent;
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <Clock className={`w-8 h-8 ${colors.textMuted} mx-auto mb-2`} />
          <p className={colors.textSecondary}>No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="space-y-4">
        {displayedActivities.map((activity, index) => (
          <div key={activity.id} className={`flex gap-3 items-start p-3 ${components.radius.medium} 
                                           hover:bg-white/5 ${effects.transitionNormal} group`}>
            {/* Icon with glow effect */}
            <div className="relative">
              <div className={`mt-0.5 ${getIconColor(activity.type)} relative z-10`}>
                {getIcon(activity.type)}
              </div>
              <div className={`absolute inset-0 bg-gold-500/20 rounded-full blur-md scale-0 
                             group-hover:scale-150 ${effects.transitionNormal}`}></div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`${typography.textSm} ${colors.textPrimary}`}>
                {activity.title}
                <span className={`${colors.textSecondary} ml-1`}>
                  {activity.description}
                </span>
              </p>
              <p className={`${typography.textXs} ${colors.textMuted} mt-1`}>
                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
              </p>
            </div>
            
            {/* Timeline line */}
            {index < displayedActivities.length - 1 && (
              <div className={`absolute left-7 top-10 bottom-0 w-px bg-gradient-to-b 
                             from-gold-500/20 via-gold-500/10 to-transparent`}></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}