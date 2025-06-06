'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, DollarSign, Users, FileText, Clock, Target } from 'lucide-react';

interface EnhancedMetrics {
  revenue: {
    today: { amount: number; trend: number; currency: string };
    week: { amount: number; trend: number; target: number };
    month: { amount: number; trend: number; forecast: number };
  };
  appointments: {
    today: { count: number; completed: number; remaining: number };
    week: { scheduled: number; completed: number; cancelled: number };
    metrics: {
      averageDuration: number;
      conversionRate: number;
      noShowRate: number;
    };
  };
  customers: {
    total: number;
    new: { today: number; week: number; month: number };
    segments: {
      newCustomers: number;
      regularCustomers: number;
      vipCustomers: number;
    };
  };
  requests: {
    pending: { count: number; urgent: number; overdue: number };
    processed: { today: number; week: number; month: number };
    conversion: {
      rate: number;
      averageTimeToConvert: number;
    };
  };
}

interface EnhancedStatsGridProps {
  metrics?: EnhancedMetrics;
  loading?: boolean;
  onRefresh?: () => void;
}

export default function EnhancedStatsGrid({ metrics, loading = false, onRefresh }: EnhancedStatsGridProps) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (metrics) {
      setLastUpdated(new Date());
    }
  }, [metrics]);

  // Fallback to simple stats if enhanced metrics not available
  const simpleStats = {
    todayAppointments: metrics?.appointments.today.count || 0,
    weeklyRevenue: metrics?.revenue.week.amount || 0,
    activeCustomers: metrics?.customers.total || 0,
    pendingRequests: metrics?.requests.pending.count || 0,
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendText, 
    color = 'text-[#C9A449]',
    bgColor = 'bg-[#111111]',
    children 
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: number;
    trendText?: string;
    color?: string;
    bgColor?: string;
    children?: React.ReactNode;
  }) => (
    <div className="group">
      <div className={`stat ${bgColor} rounded-2xl p-6 border border-[#C9A449]/20 transition-all duration-300 hover:border-[#C9A449]/30 backdrop-blur-sm`}>
        <div className={`stat-figure ${color} opacity-70 group-hover:opacity-100 transition-opacity`}>
          <Icon className="w-8 h-8" />
        </div>
        <div className="stat-title text-gray-400 text-sm font-medium mb-2">{title}</div>
        <div className="stat-value text-white text-3xl font-bold mb-2">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {trend !== undefined && (
          <div className="stat-desc text-gray-500 text-sm flex items-center gap-1">
            {trend >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={trend >= 0 ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(trend).toFixed(1)}%
            </span>
            <span>{trendText}</span>
          </div>
        )}
        {children}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
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
    // Fallback to simple stats grid
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Appointments"
          value={simpleStats.todayAppointments}
          icon={Calendar}
          trendText="vs yesterday"
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${simpleStats.weeklyRevenue.toLocaleString()}`}
          icon={DollarSign}
          trendText="vs last month"
        />
        <StatCard
          title="Total Customers"
          value={simpleStats.activeCustomers}
          icon={Users}
          trendText="this month"
        />
        <StatCard
          title="Pending Requests"
          value={simpleStats.pendingRequests}
          icon={FileText}
          trendText="need review"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Business Overview</h3>
          <p className="text-sm text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
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

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Revenue"
          value={`$${metrics.revenue.today.amount.toLocaleString()}`}
          icon={DollarSign}
          trend={metrics.revenue.today.trend}
          trendText="vs yesterday"
        />
        
        <StatCard
          title="Today's Appointments"
          value={metrics.appointments.today.count}
          icon={Calendar}
          trendText={`${metrics.appointments.today.remaining} remaining`}
        >
          <div className="mt-2 text-xs text-gray-500">
            {metrics.appointments.today.completed} completed
          </div>
        </StatCard>

        <StatCard
          title="Active Customers"
          value={metrics.customers.total}
          icon={Users}
          trendText={`${metrics.customers.new.today} new today`}
        />

        <StatCard
          title="Pending Requests"
          value={metrics.requests.pending.count}
          icon={FileText}
          trendText={metrics.requests.pending.urgent > 0 ? `${metrics.requests.pending.urgent} urgent` : 'all current'}
          color={metrics.requests.pending.urgent > 0 ? 'text-orange-500' : 'text-[#C9A449]'}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Weekly Revenue"
          value={`$${metrics.revenue.week.amount.toLocaleString()}`}
          icon={Target}
          trend={metrics.revenue.week.trend}
          trendText="vs last week"
        >
          <div className="mt-2 text-xs text-gray-500">
            Target: ${metrics.revenue.week.target.toLocaleString()}
          </div>
        </StatCard>

        <StatCard
          title="Conversion Rate"
          value={`${metrics.requests.conversion.rate}%`}
          icon={TrendingUp}
          trendText="request to appointment"
        >
          <div className="mt-2 text-xs text-gray-500">
            Avg {metrics.requests.conversion.averageTimeToConvert} days
          </div>
        </StatCard>

        <StatCard
          title="Customer Segments"
          value={metrics.customers.segments.vipCustomers}
          icon={Users}
          trendText="VIP customers"
        >
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <div>New: {metrics.customers.segments.newCustomers}</div>
            <div>Regular: {metrics.customers.segments.regularCustomers}</div>
          </div>
        </StatCard>

        <StatCard
          title="Appointment Quality"
          value={`${(100 - metrics.appointments.metrics.noShowRate).toFixed(1)}%`}
          icon={Clock}
          trendText="show rate"
        >
          <div className="mt-2 text-xs text-gray-500">
            Avg {metrics.appointments.metrics.averageDuration}min duration
          </div>
        </StatCard>
      </div>
    </div>
  );
} 