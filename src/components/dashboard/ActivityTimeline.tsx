'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, DollarSign, FileText, User, CheckCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

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

interface ActivityTimelineProps {
  activities: ActivityItem[];
  className?: string;
}

export default function ActivityTimeline({ activities, className = '' }: ActivityTimelineProps) {
  const [showAll, setShowAll] = useState(false);
  const displayedActivities = showAll ? activities : activities.slice(0, 5);

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
        return 'bg-blue-500/20 text-blue-400';
      case 'payment_received':
        return 'bg-green-500/20 text-green-400';
      case 'request_submitted':
        return 'bg-purple-500/20 text-purple-400';
      case 'customer_registered':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'appointment_completed':
        return 'bg-[#C9A449]/20 text-[#C9A449]';
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className={`bg-[#111111] border border-[#1a1a1a] rounded-2xl p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#111111] border border-[#1a1a1a] rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        <span className="text-xs text-gray-400">
          {formatDistanceToNow(activities[0].timestamp, { addSuffix: true })}
        </span>
      </div>

      <div className="space-y-3">
        {displayedActivities.map((activity, index) => (
          <div key={activity.id} className="flex gap-3 group">
            {/* Icon */}
            <div className={`
              p-2 rounded-lg flex-shrink-0
              ${getIconColor(activity.type)}
              group-hover:scale-110 transition-transform
            `}>
              {getIcon(activity.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {activity.description}
                  </p>
                  
                  {/* Metadata */}
                  {activity.metadata && (
                    <div className="flex items-center gap-3 mt-1">
                      {activity.metadata.amount && (
                        <span className="text-xs text-green-400">
                          ${activity.metadata.amount.toLocaleString()}
                        </span>
                      )}
                      {activity.metadata.appointmentTime && (
                        <span className="text-xs text-blue-400">
                          {format(activity.metadata.appointmentTime, 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Timeline connector */}
            {index < displayedActivities.length - 1 && (
              <div className="absolute left-7 top-10 w-0.5 h-12 bg-[#1a1a1a]" />
            )}
          </div>
        ))}
      </div>

      {/* Show more/less button */}
      {activities.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 text-sm text-[#C9A449] hover:text-[#B8934A] transition-colors"
        >
          {showAll ? 'Show less' : `Show ${activities.length - 5} more`}
        </button>
      )}
    </div>
  );
}