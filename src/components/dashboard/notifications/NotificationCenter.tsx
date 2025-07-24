'use client';

import { useState, useEffect } from 'react';
import { notificationService, type NotificationSettings, type NotificationStats } from '@/src/lib/api/services/notificationService';
import { Bell, MessageSquare, Mail, ExternalLink, TrendingUp } from 'lucide-react';
import { toast } from '@/src/lib/toast';

export default function NotificationCenter() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30); // days

  useEffect(() => {
    loadNotificationData();
  }, [dateRange]);

  const loadNotificationData = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      const [settingsData, statsData] = await Promise.all([
        notificationService.getSettings(),
        notificationService.getStats(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        )
      ]);

      setSettings(settingsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading notification data:', error);
      toast.error('Failed to load notification data');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !settings || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Notification Center</h2>
          <p className="text-gray-400">Monitor appointment reminders and confirmations</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(Number(e.target.value))}
          className="select select-bordered bg-base-200"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Square Settings Card */}
      <div className="card bg-base-200 border border-[#C9A449]/20">
        <div className="card-body">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Square Notification Settings</h3>
              <p className="text-sm text-gray-400 mb-4">
                Automatic notifications are managed through {settings.provider}
              </p>
            </div>
            <a
              href={settings.squareDashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-ghost"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Square Dashboard
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-base-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Automatic Reminders</span>
                <div className={`badge ${settings.automaticReminders ? 'badge-success' : 'badge-error'}`}>
                  {settings.automaticReminders ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Sent {settings.reminderTiming}
              </p>
            </div>

            <div className="bg-base-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Confirmations</span>
                <div className="badge badge-success">Enabled</div>
              </div>
              <p className="text-xs text-gray-500">
                Sent {settings.confirmationTiming}
              </p>
            </div>

            <div className="bg-base-300 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <Mail className={`w-5 h-5 ${settings.emailEnabled ? 'text-success' : 'text-gray-600'}`} />
                <div>
                  <p className="text-sm text-white">Email Notifications</p>
                  <p className="text-xs text-gray-500">
                    {settings.emailEnabled ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-base-300 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <MessageSquare className={`w-5 h-5 ${settings.smsEnabled ? 'text-success' : 'text-gray-600'}`} />
                <div>
                  <p className="text-sm text-white">SMS Notifications</p>
                  <p className="text-xs text-gray-500">
                    {settings.smsEnabled ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-base-200 border border-[#C9A449]/20">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Total Sent</p>
                <p className="text-3xl font-bold text-white">
                  {stats.totalNotifications}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Last {dateRange} days
                </p>
              </div>
              <div className="p-3 bg-primary/20 rounded-lg">
                <Bell className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-200 border border-[#C9A449]/20">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Confirmations</p>
                <p className="text-3xl font-bold text-white">
                  {stats.confirmationsSent}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Sent on booking
                </p>
              </div>
              <div className="p-3 bg-info/20 rounded-lg">
                <Mail className="w-6 h-6 text-info" />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-200 border border-[#C9A449]/20">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Reminders</p>
                <p className="text-3xl font-bold text-white">
                  {stats.remindersSent}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  24hr before appt
                </p>
              </div>
              <div className="p-3 bg-success/20 rounded-lg">
                <MessageSquare className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Notification Chart */}
      <div className="card bg-base-200 border border-[#C9A449]/20">
        <div className="card-body">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Notification Volume</h3>
          <div className="space-y-3">
            {stats.notificationsByDay.slice(-7).map((day) => (
              <div key={day.date} className="flex items-center gap-4">
                <span className="text-sm text-gray-400 w-24">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <div className="flex-1">
                  <div className="w-full bg-base-300 rounded-full h-6">
                    <div 
                      className="bg-primary h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${(day.count / Math.max(...stats.notificationsByDay.map(d => d.count))) * 100}%` }}
                    >
                      <span className="text-xs text-white">{day.count}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Future Enhancement Note */}
      <div className="alert alert-info">
        <TrendingUp className="w-5 h-5" />
        <div>
          <p className="font-semibold">Coming Soon: Custom Notifications</p>
          <p className="text-sm">
            Send manual reminders, follow-ups, and aftercare instructions directly from the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}