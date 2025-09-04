'use client';

import { useState, useEffect } from 'react';
import { analyticsService, type DashboardMetrics } from '@/src/lib/api/services/analyticsService';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar, 
  FileText,
  Download,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/src/lib/toast';
import RevenueChart from './RevenueChart';
import CustomerSegmentation from './CustomerSegmentation';
import AppointmentMetrics from './AppointmentMetrics';
import BusinessTrends from './BusinessTrends';

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('today');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading analytics...');

  useEffect(() => {
    loadMetrics();
  }, [timeframe]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setLoadingMessage('Loading analytics data...');
      
      // Add timeout warning after 45 seconds
      const timeoutWarning = setTimeout(() => {
        setLoadingMessage('Analytics taking longer than usual, please wait...');
      }, 45000);
      
      const data = await analyticsService.getDashboardMetrics(timeframe);
      setMetrics(data);
      clearTimeout(timeoutWarning);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMessage('Loading analytics...');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMetrics();
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  const handleExport = async (type: 'revenue' | 'appointments' | 'customers' | 'full') => {
    try {
      await analyticsService.exportAnalytics(type, 'csv');
      toast.success(`${type} report downloaded`);
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast.error('Failed to export analytics');
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="text-gray-400 text-sm">{loadingMessage}</p>
        <div className="text-xs text-gray-500 max-w-md text-center">
          Analytics queries can take up to 60 seconds for large datasets
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
          <p className="text-gray-400">Track your business performance and insights</p>
        </div>
        <div className="flex gap-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="select select-bordered bg-[#111111] text-white border-[#1a1a1a] [&>option]:bg-[#111111] [&>option]:text-white"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisYear">This Year</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-ghost btn-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="card bg-base-200 border border-[#C9A449]/20">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-white">
                  ${metrics.revenue.month?.amount?.toLocaleString() || 0}
                </p>
                <p className={`text-sm mt-1 flex items-center gap-1 ${
                  (metrics.revenue.month?.trend || 0) > 0 ? 'text-success' : 'text-error'
                }`}>
                  {(metrics.revenue.month?.trend || 0) > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(metrics.revenue.month?.trend || 0)}% vs last period
                </p>
              </div>
              <div className="p-3 bg-primary/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Customers Card */}
        <div className="card bg-base-200 border border-[#C9A449]/20">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Total Customers</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.customers?.total || 0}
                </p>
                <p className="text-sm mt-1 text-gray-400">
                  +{metrics.customers?.new?.month || 0} new this month
                </p>
              </div>
              <div className="p-3 bg-info/20 rounded-lg">
                <Users className="w-6 h-6 text-info" />
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Card */}
        <div className="card bg-base-200 border border-[#C9A449]/20">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Appointments</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.appointments?.week?.scheduled || 0}
                </p>
                <p className="text-sm mt-1 text-gray-400">
                  {metrics.appointments?.metrics?.conversionRate || 0}% completion rate
                </p>
              </div>
              <div className="p-3 bg-success/20 rounded-lg">
                <Calendar className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
        </div>

        {/* Requests Card */}
        <div className="card bg-base-200 border border-[#C9A449]/20">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Active Requests</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.requests?.pending?.count || 0}
                </p>
                <p className="text-sm mt-1 text-gray-400">
                  {metrics.requests?.conversion?.rate || 0}% conversion rate
                </p>
              </div>
              <div className="p-3 bg-warning/20 rounded-lg">
                <FileText className="w-6 h-6 text-warning" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <RevenueChart 
          data={metrics.business?.growth ? [{ date: 'Today', amount: metrics.revenue?.today?.amount || 0 }] : []} 
          breakdown={metrics.revenue?.breakdown || { consultations: 0, tattoos: 0, touchups: 0, deposits: 0 }}
        />

        {/* Customer Segmentation */}
        <CustomerSegmentation 
          segments={{
            new: metrics.customers?.segments?.newCustomers || 0,
            returning: metrics.customers?.segments?.regularCustomers || 0,
            vip: metrics.customers?.segments?.vipCustomers || 0,
            retentionRate: metrics.customers?.returning?.rate || 0
          }}
          retentionRate={metrics.customers?.returning?.rate || 0}
        />

        {/* Appointment Metrics */}
        <AppointmentMetrics 
          metrics={{
            today: metrics.appointments?.today?.count || 0,
            thisWeek: metrics.appointments?.week?.scheduled || 0,
            completionRate: metrics.appointments?.metrics?.conversionRate || 0,
            noShowRate: metrics.appointments?.metrics?.noShowRate || 0,
            utilizationRate: metrics.appointments?.metrics?.rebookingRate || 0
          }}
          trends={[]}
        />

        {/* Business Trends */}
        <BusinessTrends 
          revenue={[]}
          appointments={[]}
          customers={[]}
        />
      </div>

      {/* Export Options */}
      <div className="card bg-base-200 border border-[#C9A449]/20">
        <div className="card-body">
          <h3 className="text-lg font-semibold text-white mb-4">Export Reports</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleExport('revenue')}
              className="btn btn-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Revenue Report
            </button>
            <button
              onClick={() => handleExport('appointments')}
              className="btn btn-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Appointments Report
            </button>
            <button
              onClick={() => handleExport('customers')}
              className="btn btn-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Customer Report
            </button>
            <button
              onClick={() => handleExport('full')}
              className="btn btn-sm btn-primary"
            >
              <Download className="w-4 h-4 mr-2" />
              Full Analytics Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}