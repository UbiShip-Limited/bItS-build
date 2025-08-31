'use client';

import { Calendar, FileText, DollarSign, AlertCircle } from 'lucide-react';
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';

interface ActionableMetrics {
  todayAppointments: {
    total: number;
    completed: number;
    remaining: number;
  };
  actionItems: {
    overdueRequests: number;
    unconfirmedAppointments: number;
    followUpsNeeded: number;
  };
  requests: {
    newCount: number;
    urgentCount: number;
    todayCount?: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

interface OperationsStatsGridProps {
  metrics: ActionableMetrics;
  loading?: boolean;
  onRefresh?: () => void;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  alert?: boolean;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, alert }: StatCardProps) {
  return (
    <div className={`group bg-gradient-to-b from-obsidian/95 to-obsidian/90 ${components.radius.large} p-6 
                     border ${alert ? 'border-red-500/30' : colors.borderSubtle} 
                     ${effects.transitionNormal} hover:${colors.borderDefault} hover:shadow-soft
                     backdrop-blur-sm relative overflow-hidden`}>
      {/* Subtle glow effect */}
      {alert && (
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5"></div>
      )}
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className={`${typography.textSm} ${typography.fontMedium} ${colors.textSecondary}`}>{title}</p>
          <p className={`mt-2 ${typography.text3xl} ${typography.fontSemibold} ${colors.textPrimary}`}>{value}</p>
          {subtitle && (
            <p className={`mt-1 ${typography.textSm} ${alert ? 'text-red-400/70' : colors.textMuted}`}>{subtitle}</p>
          )}
          {trend && (
            <p className={`mt-2 ${typography.textSm} ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}% from last week
            </p>
          )}
        </div>
        <div className={`p-3 ${components.radius.medium} ${alert ? 'bg-red-500/10' : 'bg-white/5'} 
                         group-hover:bg-white/10 ${effects.transitionNormal}`}>
          <Icon className={`w-6 h-6 ${alert ? 'text-red-400' : colors.textAccentMuted} 
                           group-hover:${colors.textAccent} ${effects.transitionNormal}`} />
          {!alert && (
            <div className="absolute inset-0 bg-gold-500/10 rounded-full blur-md scale-0 group-hover:scale-150 transition-transform duration-500"></div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OperationsStatsGrid({ metrics, loading, onRefresh }: OperationsStatsGridProps) {
  // Provide default values if metrics are undefined
  const safeMetrics = {
    todayAppointments: metrics?.todayAppointments || { total: 0, completed: 0, remaining: 0 },
    actionItems: metrics?.actionItems || { overdueRequests: 0, unconfirmedAppointments: 0, followUpsNeeded: 0 },
    requests: metrics?.requests || { newCount: 0, urgentCount: 0, todayCount: 0 },
    revenue: metrics?.revenue || { today: 0, thisWeek: 0, thisMonth: 0 }
  };
  
  const hasUrgentActions = safeMetrics.actionItems.overdueRequests > 0 || 
                          safeMetrics.actionItems.unconfirmedAppointments > 0;

  // Show skeleton loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`bg-gradient-to-b from-obsidian/95 to-obsidian/90 ${components.radius.large} p-6 border ${colors.borderSubtle} animate-pulse`}>
            <div className="h-4 bg-white/10 rounded w-24 mb-3"></div>
            <div className="h-8 bg-white/10 rounded w-16 mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Today's Appointments */}
      <StatCard
        title="Today's Appointments"
        value={safeMetrics.todayAppointments.total}
        subtitle={`${safeMetrics.todayAppointments.completed} completed, ${safeMetrics.todayAppointments.remaining} remaining`}
        icon={Calendar}
      />

      {/* Action Items */}
      <StatCard
        title="Action Items"
        value={safeMetrics.actionItems.overdueRequests + 
               safeMetrics.actionItems.unconfirmedAppointments + 
               safeMetrics.actionItems.followUpsNeeded}
        subtitle={hasUrgentActions ? "Urgent attention needed" : "All caught up"}
        icon={AlertCircle}
        alert={hasUrgentActions}
      />

      {/* New Requests */}
      <StatCard
        title="Tattoo Requests"
        value={safeMetrics.requests.newCount}
        subtitle={
          safeMetrics.requests.urgentCount > 0 
            ? `${safeMetrics.requests.urgentCount} urgent • ${safeMetrics.requests.todayCount || 0} today`
            : safeMetrics.requests.todayCount 
              ? `${safeMetrics.requests.todayCount} submitted today`
              : "Ready for review"
        }
        icon={FileText}
        alert={safeMetrics.requests.urgentCount > 0}
      />

      {/* Today's Revenue */}
      <StatCard
        title="Square Revenue"
        value={`$${safeMetrics.revenue.today.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        subtitle={`Week: $${safeMetrics.revenue.thisWeek.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • Month: $${safeMetrics.revenue.thisMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon={DollarSign}
        trend={safeMetrics.revenue.thisWeek > 0 && safeMetrics.revenue.today > 0 ? { value: Math.round((safeMetrics.revenue.today / (safeMetrics.revenue.thisWeek / 7)) * 100 - 100), isPositive: safeMetrics.revenue.today > (safeMetrics.revenue.thisWeek / 7) } : undefined}
      />
    </div>
  );
}