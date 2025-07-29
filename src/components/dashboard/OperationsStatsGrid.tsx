'use client';

import { Calendar, FileText, DollarSign, AlertCircle } from 'lucide-react';
import { ActionableMetrics } from '@/src/app/dashboard/hooks/useDashboardData';

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
    <div className={`bg-[#111111] rounded-lg p-6 ${alert ? 'ring-1 ring-red-500/50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <p className={`mt-2 text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}% from last week
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${alert ? 'bg-red-500/10' : 'bg-[#1a1a1a]'}`}>
          <Icon className={`w-6 h-6 ${alert ? 'text-red-400' : 'text-gray-400'}`} />
        </div>
      </div>
    </div>
  );
}

export default function OperationsStatsGrid({ metrics, loading, onRefresh }: OperationsStatsGridProps) {
  const hasUrgentActions = metrics.actionItems.overdueRequests > 0 || 
                          metrics.actionItems.unconfirmedAppointments > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Today's Appointments */}
      <StatCard
        title="Today's Appointments"
        value={metrics.todayAppointments.total}
        subtitle={`${metrics.todayAppointments.completed} completed, ${metrics.todayAppointments.remaining} remaining`}
        icon={Calendar}
      />

      {/* Action Items */}
      <StatCard
        title="Action Items"
        value={metrics.actionItems.overdueRequests + 
               metrics.actionItems.unconfirmedAppointments + 
               metrics.actionItems.followUpsNeeded}
        subtitle={hasUrgentActions ? "Urgent attention needed" : "All caught up"}
        icon={AlertCircle}
        alert={hasUrgentActions}
      />

      {/* New Requests */}
      <StatCard
        title="New Requests"
        value={metrics.requests.newCount}
        subtitle={metrics.requests.urgentCount > 0 ? `${metrics.requests.urgentCount} urgent` : "Ready for review"}
        icon={FileText}
        alert={metrics.requests.urgentCount > 0}
      />

      {/* Today's Revenue */}
      <StatCard
        title="Today's Revenue"
        value={`$${metrics.revenue.today.toLocaleString()}`}
        subtitle={`Week total: $${metrics.revenue.thisWeek.toLocaleString()}`}
        icon={DollarSign}
        trend={{ value: 12, isPositive: true }}
      />
    </div>
  );
}