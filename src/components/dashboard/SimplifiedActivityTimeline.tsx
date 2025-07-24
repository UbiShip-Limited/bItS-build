'use client';

import { Clock, Calendar, DollarSign, FileText, User, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
        return 'text-purple-400';
      case 'customer_registered':
        return 'text-gray-400';
      case 'appointment_completed':
        return 'text-[#C9A449]';
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className={`bg-[#111111] rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#111111] rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>

      <div className="space-y-4">
        {displayedActivities.map((activity) => (
          <div key={activity.id} className="flex gap-3 items-start">
            {/* Icon */}
            <div className={`mt-0.5 ${getIconColor(activity.type)}`}>
              {getIcon(activity.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">
                {activity.title}
                <span className="text-gray-400 ml-1">
                  {activity.description}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}