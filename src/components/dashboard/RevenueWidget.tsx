'use client';

import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Clock, CreditCard, AlertCircle } from 'lucide-react';
import { apiClient } from '@/src/lib/api/apiClient';

interface RevenueStats {
  today: number;
  week: number;
  month: number;
  pendingCount: number;
  pendingAmount: number;
  completedToday: number;
  refundedToday: number;
}

export default function RevenueWidget() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRevenueStats();
  }, []);

  const fetchRevenueStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: RevenueStats }>('/payments/stats');
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch revenue stats:', err);
      setError('Unable to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-[#1a1a1a] rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-[#1a1a1a] rounded"></div>
            <div className="h-8 bg-[#1a1a1a] rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#111111] border border-red-500/20 rounded-lg p-6">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6 hover:border-[#C9A449]/20 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Revenue Overview</h3>
        <DollarSign className="w-5 h-5 text-[#C9A449]" />
      </div>

      <div className="space-y-4">
        {/* Today's Revenue */}
        <div className="flex items-center justify-between p-3 bg-[#C9A449]/10 rounded-lg border border-[#C9A449]/20">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Today</p>
            <p className="text-2xl font-bold text-[#C9A449]">
              ${stats?.today?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-gray-400">
              {stats?.completedToday || 0} payments
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-[#C9A449]/50" />
        </div>

        {/* Week & Month Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">This Week</p>
            <p className="text-xl font-semibold text-white">
              ${stats?.week?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">This Month</p>
            <p className="text-xl font-semibold text-white">
              ${stats?.month?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>

        {/* Pending Payments Alert */}
        {stats && stats.pendingCount && stats.pendingCount > 0 && (
          <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <div>
                <p className="text-sm text-yellow-400 font-medium">
                  {stats.pendingCount} Pending Payment{stats.pendingCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-400">
                  ${stats.pendingAmount?.toFixed(2) || '0.00'} outstanding
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Refunds Today */}
        {stats && stats.refundedToday && stats.refundedToday > 0 && (
          <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-xs text-red-400">
              ${stats.refundedToday.toFixed(2)} refunded today
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-3 border-t border-[#1a1a1a]">
          <button
            onClick={() => window.location.href = '/dashboard/payments'}
            className="w-full px-3 py-2 bg-[#C9A449]/10 hover:bg-[#C9A449]/20 text-[#C9A449] rounded-lg transition-colors text-sm font-medium"
          >
            View All Payments
          </button>
        </div>
      </div>
    </div>
  );
}