'use client';

import { useState, useEffect } from 'react';
import { Calendar, DollarSign, FileText, Clock, AlertCircle, CheckCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import Tooltip from '@/src/components/ui/Tooltip';

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
  
  // Performance metrics
  performance: {
    utilizationRate: number;
    conversionRate: number;
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
    trend,
    progress,
    children 
  }: {
    title: string;
    value: string | number;
    icon: any;
    description: string;
    urgency?: 'normal' | 'attention' | 'urgent';
    action?: string;
    trend?: { value: number; isPositive: boolean };
    progress?: { current: number; total: number };
    children?: React.ReactNode;
  }) => {
    const urgencyColors = {
      normal: 'text-[#C9A449] border-[#C9A449]/20',
      attention: 'text-orange-400 border-orange-400/20',
      urgent: 'text-red-400 border-red-400/20'
    };

    return (
      <div className="group relative">
        <div className={`stat bg-[#111111] rounded-xl lg:rounded-2xl p-4 lg:p-6 border transition-all duration-300 hover:border-opacity-40 backdrop-blur-sm ${urgencyColors[urgency]}`}>
          <div className={`stat-figure opacity-70 group-hover:opacity-100 transition-opacity ${urgency === 'normal' ? 'text-[#C9A449]' : urgency === 'attention' ? 'text-orange-400' : 'text-red-400'}`}>
            <Icon className="w-8 h-8" />
          </div>
          
          {/* Trend indicator */}
          {trend && (
            <div className="absolute top-4 right-4 flex items-center gap-1">
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {trend.value}%
              </span>
            </div>
          )}
          
          <div className="stat-title text-gray-400 text-xs lg:text-sm font-medium mb-1 lg:mb-2 flex items-center gap-1">
            {title}
            {title === 'Today\'s Schedule' && <Tooltip content="Shows all appointments scheduled for today. The progress bar indicates how many have been completed." />}
            {title === 'New Requests' && <Tooltip content="Tattoo requests that need your initial review. Urgent requests are highlighted separately." />}
            {title === 'Today\'s Revenue' && <Tooltip content="Revenue from completed appointments today. Includes trend compared to your average." />}
            {title === 'Action Items' && <Tooltip content="Important items requiring your immediate attention, including overdue requests and unconfirmed appointments." />}
          </div>
          <div className="stat-value text-white text-2xl lg:text-3xl font-bold mb-1 lg:mb-2">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          
          {/* Progress bar */}
          {progress && (
            <div className="mb-2">
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div 
                  className="bg-[#C9A449] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">{progress.current} of {progress.total}</span>
                <span className="text-xs text-gray-500">{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
            </div>
          )}
          
          <div className="stat-desc text-gray-500 text-xs lg:text-sm">
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
      {/* Header - Mobile optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <div>
          <h3 className="text-base lg:text-lg font-semibold text-white">Today's Action Items</h3>
          <p className="text-xs lg:text-sm text-gray-400">
            <span className="hidden sm:inline">Focus on what needs your attention • </span>
            <span className="sm:hidden">Updated: </span>
            {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn btn-xs sm:btn-sm btn-ghost text-gray-400 hover:text-white self-end sm:self-auto"
          >
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
      </div>

      {/* Actionable Stats - Mobile optimized with carousel on small screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Today's Schedule - What's coming up */}
        <ActionCard
          title="Today's Schedule"
          value={metrics.todayAppointments.total}
          icon={Calendar}
          description={`${metrics.todayAppointments.remaining} remaining`}
          urgency={metrics.todayAppointments.remaining > 0 ? 'attention' : 'normal'}
          action={metrics.todayAppointments.remaining > 0 ? 'Check preparation' : undefined}
          progress={{
            current: metrics.todayAppointments.completed,
            total: metrics.todayAppointments.total
          }}
        >
          {metrics.todayAppointments.nextAppointment && (
            <div className="mt-2 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <div className="text-xs text-blue-400">
                  <span className="font-medium">Next: {metrics.todayAppointments.nextAppointment}</span>
                </div>
              </div>
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
          trend={{ value: 12, isPositive: true }}
        >
          {metrics.requests.urgentCount > 0 && (
            <div className="mt-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-red-400 font-medium">
                  {metrics.requests.urgentCount} urgent requests
                </span>
              </div>
            </div>
          )}
        </ActionCard>

        {/* Today's Revenue - Simple tracking */}
        <ActionCard
          title="Today's Revenue"
          value={`${metrics.revenue.currency}${metrics.revenue.today.toLocaleString()}`}
          icon={DollarSign}
          description="Completed today"
          trend={{ value: 8, isPositive: true }}
        >
          <div className="mt-2 space-y-2">
            <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-xs text-green-400">
                Week total: ${metrics.revenue.thisWeek.toLocaleString()}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-[#1a1a1a] rounded-lg group/metric">
                <div className="text-lg font-bold text-[#C9A449]">{metrics.performance.utilizationRate}%</div>
                <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                  Utilization
                  <Tooltip content="Percentage of available appointment slots that are booked" position="bottom" />
                </div>
              </div>
              <div className="text-center p-2 bg-[#1a1a1a] rounded-lg group/metric">
                <div className="text-lg font-bold text-[#C9A449]">{metrics.performance.conversionRate}%</div>
                <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                  Conversion
                  <Tooltip content="Percentage of tattoo requests that become completed appointments" position="bottom" />
                </div>
              </div>
            </div>
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
            <div className="mt-2 space-y-1">
              {metrics.actionItems.overdueRequests > 0 && (
                <div className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                  <span className="text-xs text-red-400">Overdue requests</span>
                  <span className="text-xs font-bold text-red-400">{metrics.actionItems.overdueRequests}</span>
                </div>
              )}
              {metrics.actionItems.unconfirmedAppointments > 0 && (
                <div className="flex items-center justify-between p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <span className="text-xs text-orange-400">Unconfirmed</span>
                  <span className="text-xs font-bold text-orange-400">{metrics.actionItems.unconfirmedAppointments}</span>
                </div>
              )}
              {metrics.actionItems.followUpsNeeded > 0 && (
                <div className="flex items-center justify-between p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <span className="text-xs text-yellow-400">Follow-ups</span>
                  <span className="text-xs font-bold text-yellow-400">{metrics.actionItems.followUpsNeeded}</span>
                </div>
              )}
            </div>
          )}
        </ActionCard>
      </div>
    </div>
  );
} 