'use client';

import { useState, useEffect } from 'react';
import { analyticsService, type DashboardMetrics } from '@/src/lib/api/services/analyticsService';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function QuickAnalytics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuickAnalytics();
  }, []);

  const loadQuickAnalytics = async () => {
    try {
      const data = await analyticsService.getDashboardMetrics('today');
      setMetrics(data);
    } catch (error) {
      console.error('Error loading quick analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="card bg-base-200 border border-[#C9A449]/20 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-base-300 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-base-300 rounded"></div>
            <div className="h-8 bg-base-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 border border-[#C9A449]/20">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Quick Insights</h3>
          <Link href="/dashboard/analytics" className="btn btn-ghost btn-xs">
            View All
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>

        <div className="space-y-4">
          {/* Revenue Trend */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Today's Revenue</p>
              <p className="text-xl font-bold text-white">
                ${metrics.revenue.today.toLocaleString()}
              </p>
            </div>
            <div className={`flex items-center gap-1 ${
              metrics.revenue.trend === 'up' ? 'text-success' : 
              metrics.revenue.trend === 'down' ? 'text-error' : 'text-gray-400'
            }`}>
              {metrics.revenue.trend === 'up' ? (
                <TrendingUp className="w-4 h-4" />
              ) : metrics.revenue.trend === 'down' ? (
                <TrendingDown className="w-4 h-4" />
              ) : null}
              <span className="text-sm font-medium">
                {Math.abs(metrics.revenue.growthRate)}%
              </span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-base-300 rounded-lg p-3">
              <p className="text-xs text-gray-400">Utilization</p>
              <p className="text-lg font-semibold text-white">
                {metrics.appointments.utilizationRate}%
              </p>
            </div>
            <div className="bg-base-300 rounded-lg p-3">
              <p className="text-xs text-gray-400">Conversion</p>
              <p className="text-lg font-semibold text-white">
                {metrics.requests.conversionRate}%
              </p>
            </div>
          </div>

          {/* Customer Breakdown */}
          <div className="pt-3 border-t border-base-300">
            <p className="text-sm text-gray-400 mb-2">Customer Mix</p>
            <div className="flex gap-2">
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-info">{metrics.customers.new}</p>
                <p className="text-xs text-gray-500">New</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-success">{metrics.customers.returning}</p>
                <p className="text-xs text-gray-500">Regular</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-primary">{metrics.customers.vip}</p>
                <p className="text-xs text-gray-500">VIP</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}