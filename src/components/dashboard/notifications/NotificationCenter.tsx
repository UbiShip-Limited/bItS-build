'use client';

import { useState, useEffect } from 'react';
import { notificationService, type NotificationSettings, type NotificationStats } from '@/src/lib/api/services/notificationService';
import { Bell, MessageSquare, Mail, ExternalLink, TrendingUp } from 'lucide-react';
import { toast } from '@/src/lib/toast';
import { typography, colors, effects, components, cn } from '@/src/lib/styles/globalStyleConstants';

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
        <div className={cn('animate-spin rounded-full h-12 w-12 border-b-2', colors.borderDefault)}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className={cn(typography.h3, colors.textPrimary)}>Notification Center</h2>
          <p className={cn(typography.textBase, colors.textSecondary)}>Monitor appointment reminders and confirmations</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(Number(e.target.value))}
          className={cn(components.select, 'w-auto')}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Square Settings Card */}
      <div className={cn(components.card, 'p-6')}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className={cn(typography.h4, colors.textPrimary, 'mb-2')}>Square Notification Settings</h3>
            <p className={cn(typography.textSm, colors.textMuted, 'mb-4')}>
              Automatic notifications are managed through {settings.provider}
            </p>
          </div>
          <a
            href={settings.squareDashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              components.button.base,
              components.button.sizes.small,
              components.button.variants.secondary,
              'flex items-center gap-2'
            )}
          >
            <ExternalLink className="w-4 h-4" />
            Square Dashboard
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={cn('bg-white/5 border', colors.borderSubtle, components.radius.small, 'p-4')}>
            <div className="flex items-center justify-between mb-3">
              <span className={cn(typography.textSm, colors.textMuted)}>Automatic Reminders</span>
              <div className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                settings.automaticReminders ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              )}>
                {settings.automaticReminders ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            <p className={cn(typography.textXs, colors.textSubtle)}>
              Sent {settings.reminderTiming}
            </p>
          </div>

          <div className={cn('bg-white/5 border', colors.borderSubtle, components.radius.small, 'p-4')}>
            <div className="flex items-center justify-between mb-3">
              <span className={cn(typography.textSm, colors.textMuted)}>Confirmations</span>
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                Enabled
              </div>
            </div>
            <p className={cn(typography.textXs, colors.textSubtle)}>
              Sent {settings.confirmationTiming}
            </p>
          </div>

          <div className={cn('bg-white/5 border', colors.borderSubtle, components.radius.small, 'p-4')}>
            <div className="flex items-center gap-4">
              <Mail className={cn('w-5 h-5', settings.emailEnabled ? 'text-emerald-500' : colors.textSubtle)} />
              <div>
                <p className={cn(typography.textSm, colors.textPrimary)}>Email Notifications</p>
                <p className={cn(typography.textXs, colors.textMuted)}>
                  {settings.emailEnabled ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>

          <div className={cn('bg-white/5 border', colors.borderSubtle, components.radius.small, 'p-4')}>
            <div className="flex items-center gap-4">
              <MessageSquare className={cn('w-5 h-5', settings.smsEnabled ? 'text-emerald-500' : colors.textSubtle)} />
              <div>
                <p className={cn(typography.textSm, colors.textPrimary)}>SMS Notifications</p>
                <p className={cn(typography.textXs, colors.textMuted)}>
                  {settings.smsEnabled ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={cn(components.card, 'p-6')}>
          <div className="flex justify-between items-start">
            <div>
              <p className={cn(typography.textSm, colors.textMuted)}>Total Sent</p>
              <p className={cn(typography.text3xl, typography.fontSemibold, colors.textPrimary)}>
                {stats.totalNotifications}
              </p>
              <p className={cn(typography.textXs, colors.textSubtle, 'mt-1')}>
                Last {dateRange} days
              </p>
            </div>
            <div className={cn('p-3 bg-gold-500/20 rounded-lg')}>
              <Bell className={cn('w-6 h-6', colors.textAccent)} />
            </div>
          </div>
        </div>

        <div className={cn(components.card, 'p-6')}>
          <div className="flex justify-between items-start">
            <div>
              <p className={cn(typography.textSm, colors.textMuted)}>Confirmations</p>
              <p className={cn(typography.text3xl, typography.fontSemibold, colors.textPrimary)}>
                {stats.confirmationsSent}
              </p>
              <p className={cn(typography.textXs, colors.textSubtle, 'mt-1')}>
                Sent on booking
              </p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Mail className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className={cn(components.card, 'p-6')}>
          <div className="flex justify-between items-start">
            <div>
              <p className={cn(typography.textSm, colors.textMuted)}>Reminders</p>
              <p className={cn(typography.text3xl, typography.fontSemibold, colors.textPrimary)}>
                {stats.remindersSent}
              </p>
              <p className={cn(typography.textXs, colors.textSubtle, 'mt-1')}>
                24hr before appt
              </p>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <MessageSquare className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Notification Chart */}
      <div className={cn(components.card, 'p-6')}>
        <h3 className={cn(typography.h4, colors.textPrimary, 'mb-4')}>Daily Notification Volume</h3>
        <div className="space-y-3">
          {stats.notificationsByDay.slice(-7).map((day) => (
            <div key={day.date} className="flex items-center gap-4">
              <span className={cn(typography.textSm, colors.textMuted, 'w-24')}>
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <div className="flex-1">
                <div className={cn('w-full bg-white/5 rounded-full h-6')}>
                  <div 
                    className={cn('bg-gold-500 h-6 rounded-full flex items-center justify-end pr-2', effects.transitionNormal)}
                    style={{ width: `${(day.count / Math.max(...stats.notificationsByDay.map(d => d.count))) * 100}%` }}
                  >
                    <span className={cn(typography.textXs, 'text-obsidian font-medium')}>{day.count}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Future Enhancement Note */}
      <div className={cn('bg-blue-500/10 border border-blue-500/30', components.radius.medium, 'p-4 flex gap-3')}>
        <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className={cn(typography.textBase, typography.fontMedium, colors.textPrimary)}>Coming Soon: Custom Notifications</p>
          <p className={cn(typography.textSm, colors.textSecondary)}>
            Send manual reminders, follow-ups, and aftercare instructions directly from the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}