'use client';

import { useState, useEffect } from 'react';
import { Calendar, DollarSign, FileText, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface ActionableMetrics {
  // Today's actionable items
  todayAppointments: {
    total: number;
    completed: number;
    remaining: number;
    nextAppointment?: string; // time of next appointment
  };
  
  // Requests needing attention
  requests: {
    newCount: number; // new requests needing first review
    urgentCount: number; // overdue or high priority
    totalPending: number;
  };
  
  // Simple revenue tracking
  revenue: {
    today: number;
    thisWeek: number;
    currency: string;
  };
  
  // Action items
  actionItems: {
    overdueRequests: number;
    unconfirmedAppointments: number;
    followUpsNeeded: number;
  };
}

interface ActionableStatsGridProps {
  metrics?: ActionableMetrics;
  loading?: boolean;
  onRefresh?: () => void;
}

export default function EnhancedStatsGrid({ metrics, loading = false, onRefresh }: ActionableStatsGridProps) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (metrics) {
      setLastUpdated(new Date());
    }
  }, [metrics]);

  const ActionCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description,
    urgency = 'normal',
    action,
    children 
  }: {
    title: string;
    value: string | number;
    icon: any;
    description: string;
    urgency?: 'normal' | 'attention' | 'urgent';
    action?: string;
    children?: React.ReactNode;
  }) => {
    const urgencyColors = {
      normal: 'text-[#C9A449] border-[#C9A449]/20',
      attention: 'text-orange-400 border-orange-400/20',
      urgent: 'text-red-400 border-red-400/20'
    };

    return (
      <div className="group">
        <div className={`stat bg-[#111111] rounded-2xl p-6 border transition-all duration-300 hover:border-opacity-40 backdrop-blur-sm ${urgencyColors[urgency]}`}>
          <div className={`stat-figure opacity-70 group-hover:opacity-100 transition-opacity ${urgency === 'normal' ? 'text-[#C9A449]' : urgency === 'attention' ? 'text-orange-400' : 'text-red-400'}`}>
            <Icon className="w-8 h-8" />
          </div>
          <div className="stat-title text-gray-400 text-sm font-medium mb-2">{title}</div>
          <div className="stat-value text-white text-3xl font-bold mb-2">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className="stat-desc text-gray-500 text-sm">
            {action && urgency !== 'normal' && (
              <span className={urgency === 'attention' ? 'text-orange-400' : 'text-red-400'}>
                ⚡ {action}
              </span>
            )}
            {!action && <span>{description}</span>}
          </div>
          {children}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat bg-[#111111] rounded-2xl p-6 border border-[#C9A449]/20 animate-pulse">
            <div className="h-8 w-8 bg-gray-700 rounded mb-4"></div>
            <div className="h-4 w-24 bg-gray-700 rounded mb-2"></div>
            <div className="h-8 w-16 bg-gray-700 rounded mb-2"></div>
            <div className="h-3 w-20 bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) {
    // Fallback message when enhanced metrics aren't available
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Loading actionable insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Today's Action Items</h3>
          <p className="text-sm text-gray-400">
            Focus on what needs your attention • Updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn btn-sm btn-ghost text-gray-400 hover:text-white"
          >
            <Clock className="w-4 h-4 mr-2" />
            Refresh
          </button>
        )}
      </div>

      {/* Actionable Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Schedule - What's coming up */}
        <ActionCard
          title="Today's Schedule"
          value={metrics.todayAppointments.total}
          icon={Calendar}
          description={`${metrics.todayAppointments.remaining} remaining`}
          urgency={metrics.todayAppointments.remaining > 0 ? 'attention' : 'normal'}
          action={metrics.todayAppointments.remaining > 0 ? 'Check preparation' : undefined}
        >
          {metrics.todayAppointments.nextAppointment && (
            <div className="mt-2 text-xs text-gray-500">
              Next: {metrics.todayAppointments.nextAppointment}
            </div>
          )}
        </ActionCard>

        {/* New Requests - Need first review */}
        <ActionCard
          title="New Requests"
          value={metrics.requests.newCount}
          icon={FileText}
          description="Need initial review"
          urgency={metrics.requests.newCount > 0 ? 'attention' : 'normal'}
          action={metrics.requests.newCount > 0 ? 'Review needed' : undefined}
        >
          {metrics.requests.urgentCount > 0 && (
            <div className="mt-2 text-xs text-red-400">
              {metrics.requests.urgentCount} urgent
            </div>
          )}
        </ActionCard>

        {/* Today's Revenue - Simple tracking */}
        <ActionCard
          title="Today's Revenue"
          value={`${metrics.revenue.currency}${metrics.revenue.today.toLocaleString()}`}
          icon={DollarSign}
          description="Completed today"
        >
          <div className="mt-2 text-xs text-gray-500">
            Week: ${metrics.revenue.thisWeek.toLocaleString()}
          </div>
        </ActionCard>

        {/* Action Items - Things that need attention */}
        <ActionCard
          title="Action Items"
          value={metrics.actionItems.overdueRequests + metrics.actionItems.unconfirmedAppointments + metrics.actionItems.followUpsNeeded}
          icon={AlertCircle}
          description="Items need attention"
          urgency={
            (metrics.actionItems.overdueRequests + metrics.actionItems.unconfirmedAppointments + metrics.actionItems.followUpsNeeded) > 0 
              ? 'urgent' 
              : 'normal'
          }
          action={
            (metrics.actionItems.overdueRequests + metrics.actionItems.unconfirmedAppointments + metrics.actionItems.followUpsNeeded) > 0 
              ? 'Take action' 
              : undefined
          }
        >
          {(metrics.actionItems.overdueRequests + metrics.actionItems.unconfirmedAppointments + metrics.actionItems.followUpsNeeded) > 0 && (
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              {metrics.actionItems.overdueRequests > 0 && <div>Overdue: {metrics.actionItems.overdueRequests}</div>}
              {metrics.actionItems.unconfirmedAppointments > 0 && <div>Unconfirmed: {metrics.actionItems.unconfirmedAppointments}</div>}
              {metrics.actionItems.followUpsNeeded > 0 && <div>Follow-ups: {metrics.actionItems.followUpsNeeded}</div>}
            </div>
          )}
        </ActionCard>
      </div>
    </div>
  );
} 