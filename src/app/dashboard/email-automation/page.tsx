'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { 
  Mail, 
  Clock, 
  Settings, 
  Activity,
  ToggleLeft,
  ToggleRight,
  Play,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart
} from 'lucide-react';
import { useAuth } from '@/src/hooks/useAuth';
import { toast } from '@/src/lib/toast';
import { SkeletonLoader } from '@/src/components/ui/SkeletonLoader';
import { DashboardPageLayout } from '../components/DashboardPageLayout';
import Modal from '@/src/components/ui/Modal';
import { colors, typography, components, effects, cn } from '@/src/lib/styles/globalStyleConstants';

interface EmailAutomationSetting {
  id: string;
  emailType: string;
  enabled: boolean;
  timingHours: number | null;
  timingMinutes: number | null;
  businessHoursOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmailAutomationLog {
  id: string;
  customerId: string | null;
  appointmentId: string | null;
  tattooRequestId: string | null;
  emailType: string;
  emailAddress: string;
  templateId: string;
  sentAt: string;
  status: string;
  error: string | null;
  customer?: {
    name: string;
  } | null;
}

interface EmailStatistics {
  totalSent: number;
  totalFailed: number;
  totalBounced: number;
  byType: Record<string, { sent: number; failed: number; bounced: number }>;
  last30Days: {
    sent: number;
    failed: number;
    bounced: number;
  };
}

const emailTypeDisplayNames: Record<string, string> = {
  appointment_reminder_24h: '24 Hour Appointment Reminder',
  appointment_reminder_2h: '2 Hour Appointment Reminder',
  aftercare_instructions: 'Aftercare Instructions',
  review_request: 'Review Request (7 days)',
  re_engagement: 'Re-engagement Campaign (90 days)',
  abandoned_request_recovery: 'Abandoned Request Recovery (48 hours)'
};

const emailTypeDescriptions: Record<string, string> = {
  appointment_reminder_24h: 'Sends reminder 24 hours before appointment',
  appointment_reminder_2h: 'Sends reminder 2 hours before appointment',
  aftercare_instructions: 'Sends aftercare instructions 2 hours after appointment',
  review_request: 'Requests review 7 days after completed appointment',
  re_engagement: 'Re-engages customers inactive for 90 days',
  abandoned_request_recovery: 'Recovers incomplete tattoo requests after 48 hours'
};

export default function EmailAutomationPage() {
  const [settings, setSettings] = useState<EmailAutomationSetting[]>([]);
  const [logs, setLogs] = useState<EmailAutomationLog[]>([]);
  const [statistics, setStatistics] = useState<EmailStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'settings' | 'logs' | 'stats'>('settings');
  const [updatingSettings, setUpdatingSettings] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(true);
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session?.access_token) {
      fetchData();
    }
  }, [session, selectedTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (selectedTab === 'settings') {
        await fetchSettings();
      } else if (selectedTab === 'logs') {
        await fetchLogs();
      } else if (selectedTab === 'stats') {
        await fetchStatistics();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/email-automation`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }
      );

      if (response.status === 403) {
        setHasPermission(false);
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch settings');
      
      const data = await response.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setSettings(data);
      } else {
        console.error('Expected array of settings, got:', data);
        setSettings([]);
      }
    } catch (error) {
      toast.error('Failed to load automation settings');
      console.error('Error fetching settings:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/email-automation/logs?limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }
      );

      if (response.status === 403) {
        setHasPermission(false);
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      toast.error('Failed to load automation logs');
      console.error('Error fetching logs:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/email-automation/stats`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }
      );

      if (response.status === 403) {
        setHasPermission(false);
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch statistics');
      
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      toast.error('Failed to load statistics');
      console.error('Error fetching statistics:', error);
    }
  };

  const updateSetting = async (emailType: string, updates: Partial<EmailAutomationSetting>) => {
    setUpdatingSettings(emailType);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/email-automation/settings/${emailType}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) throw new Error('Failed to update setting');
      
      toast.success('Automation setting updated');
      await fetchSettings();
    } catch (error) {
      toast.error('Failed to update setting');
      console.error('Error updating setting:', error);
    } finally {
      setUpdatingSettings(null);
    }
  };

  const triggerEmail = async (emailType: string, targetId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/email-automation/trigger`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ emailType, targetId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to trigger email');
      }
      
      toast.success('Email triggered successfully');
      await fetchLogs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to trigger email');
      console.error('Error triggering email:', error);
    }
  };

  const [openModal, setOpenModal] = useState<string | null>(null);
  const [modalSettings, setModalSettings] = useState<EmailAutomationSetting | null>(null);

  const renderSettings = () => (
    <div className="space-y-4">
      {Array.isArray(settings) && settings.length > 0 ? settings.map((setting) => (
        <div key={setting.id} className={cn(components.card, 'p-6')}>
          <div>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className={cn(typography.textLg, typography.fontSemibold, colors.textPrimary, 'flex items-center gap-2')}>
                  <Mail className={cn('w-5 h-5', colors.textAccent)} />
                  {emailTypeDisplayNames[setting.emailType] || setting.emailType}
                </h3>
                <p className={cn(typography.textSm, colors.textSecondary, 'mt-1')}>
                  {emailTypeDescriptions[setting.emailType]}
                </p>
                <div className="flex gap-4 mt-3">
                  <span className={cn(typography.textSm, colors.textProminent, 'flex items-center gap-1')}>
                    <Clock className="w-4 h-4" />
                    Timing: {setting.timingHours || 0}h {setting.timingMinutes || 0}m
                  </span>
                  {setting.businessHoursOnly && (
                    <span className="px-2 py-1 text-xs bg-gold-500/10 text-gold-500/70 rounded-full border border-gold-500/20">
                      Business hours only
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className={cn(typography.textSm, colors.textProminent)}>Enabled</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={setting.enabled}
                      onChange={(e) => updateSetting(setting.emailType, { enabled: e.target.checked })}
                      disabled={updatingSettings === setting.emailType}
                    />
                    <div className={cn(
                      'w-11 h-6 rounded-full transition-colors',
                      setting.enabled ? 'bg-green-500/30' : 'bg-white/10'
                    )}>
                      <div className={cn(
                        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                        setting.enabled ? 'translate-x-5' : 'translate-x-0'
                      )} />
                    </div>
                  </label>
                </div>
                <button
                  className={cn(
                    'p-2 rounded-lg',
                    components.button.variants.ghost,
                    'hover:bg-white/10'
                  )}
                  onClick={() => {
                    setModalSettings(setting);
                    setOpenModal(setting.emailType);
                  }}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )) : (
        <div className={cn('text-center py-8', colors.textMuted)}>
          No email automation settings found. Please check your backend configuration.
        </div>
      )}
      
      {/* Settings Modal */}
      <Modal
        isOpen={!!openModal && !!modalSettings}
        onClose={() => {
          setOpenModal(null);
          setModalSettings(null);
        }}
        title={modalSettings ? `${emailTypeDisplayNames[modalSettings.emailType]} Settings` : ''}
        size="md"
      >
        {modalSettings && (
          <div className="space-y-4">
            <div>
              <label className={cn(typography.textSm, typography.fontMedium, colors.textProminent, 'block mb-2')}>
                Timing (Hours)
              </label>
              <input
                type="number"
                className={components.input}
                value={modalSettings.timingHours || 0}
                onChange={(e) => {
                  updateSetting(modalSettings.emailType, { 
                    timingHours: parseInt(e.target.value) || 0 
                  });
                  setModalSettings({...modalSettings, timingHours: parseInt(e.target.value) || 0});
                }}
                min="0"
              />
            </div>
            
            <div>
              <label className={cn(typography.textSm, typography.fontMedium, colors.textProminent, 'block mb-2')}>
                Timing (Minutes)
              </label>
              <input
                type="number"
                className={components.input}
                value={modalSettings.timingMinutes || 0}
                onChange={(e) => {
                  updateSetting(modalSettings.emailType, { 
                    timingMinutes: parseInt(e.target.value) || 0 
                  });
                  setModalSettings({...modalSettings, timingMinutes: parseInt(e.target.value) || 0});
                }}
                min="0"
                max="59"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <label className={cn(typography.textSm, typography.fontMedium, colors.textProminent)}>
                Business hours only
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={modalSettings.businessHoursOnly}
                  onChange={(e) => {
                    updateSetting(modalSettings.emailType, { 
                      businessHoursOnly: e.target.checked 
                    });
                    setModalSettings({...modalSettings, businessHoursOnly: e.target.checked});
                  }}
                />
                <div className={cn(
                  'w-11 h-6 rounded-full transition-colors',
                  modalSettings.businessHoursOnly ? 'bg-green-500/30' : 'bg-white/10'
                )}>
                  <div className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                    modalSettings.businessHoursOnly ? 'translate-x-5' : 'translate-x-0'
                  )} />
                </div>
              </label>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-4">
      <div className={cn(components.card, 'p-0 overflow-hidden')}>
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className={cn('px-4 py-3 text-left', typography.textSm, typography.fontMedium, colors.textProminent)}>Date</th>
              <th className={cn('px-4 py-3 text-left', typography.textSm, typography.fontMedium, colors.textProminent)}>Type</th>
              <th className={cn('px-4 py-3 text-left', typography.textSm, typography.fontMedium, colors.textProminent)}>Recipient</th>
              <th className={cn('px-4 py-3 text-left', typography.textSm, typography.fontMedium, colors.textProminent)}>Status</th>
              <th className={cn('px-4 py-3 text-left', typography.textSm, typography.fontMedium, colors.textProminent)}>Error</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={log.id} className={cn(
                'border-b border-white/5',
                index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'
              )}>
                <td className={cn('px-4 py-3 whitespace-nowrap', typography.textSm, colors.textSecondary)}>
                  {formatDistanceToNow(new Date(log.sentAt), { addSuffix: true })}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs bg-gold-500/10 text-gold-500/70 rounded border border-gold-500/20">
                    {emailTypeDisplayNames[log.emailType]?.split(' ').slice(0, 2).join(' ') || log.emailType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className={cn(typography.textSm, typography.fontMedium, colors.textProminent)}>
                      {log.customer?.name || 'Unknown'}
                    </div>
                    <div className={cn(typography.textXs, colors.textMuted)}>
                      {log.emailAddress}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {log.status === 'sent' && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded border border-green-500/30">
                      <CheckCircle className="w-3 h-3" />
                      Sent
                    </div>
                  )}
                  {log.status === 'failed' && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded border border-red-500/30">
                      <XCircle className="w-3 h-3" />
                      Failed
                    </div>
                  )}
                  {log.status === 'bounced' && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">
                      <AlertCircle className="w-3 h-3" />
                      Bounced
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {log.error && (
                    <span className={cn(typography.textXs, 'text-red-400')}>{log.error}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {logs.length === 0 && (
        <div className={cn('text-center py-8', colors.textMuted)}>
          No automation logs found
        </div>
      )}
    </div>
  );

  const renderStatistics = () => {
    if (!statistics) return null;
    
    const successRate = statistics.totalSent > 0 
      ? ((statistics.totalSent / (statistics.totalSent + statistics.totalFailed)) * 100).toFixed(1)
      : '0';
    
    return (
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={cn(components.card, 'p-6')}>
            <div className="flex justify-between items-start">
              <div>
                <p className={cn(typography.textSm, colors.textSecondary)}>Sent (30 days)</p>
                <p className={cn(typography.text2xl, typography.fontSemibold, 'text-green-400 mt-1')}>
                  {statistics.last30Days.sent}
                </p>
                <p className={cn(typography.textXs, colors.textMuted, 'mt-1')}>Successfully delivered</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400/50" />
            </div>
          </div>
          
          <div className={cn(components.card, 'p-6')}>
            <div className="flex justify-between items-start">
              <div>
                <p className={cn(typography.textSm, colors.textSecondary)}>Failed (30 days)</p>
                <p className={cn(typography.text2xl, typography.fontSemibold, 'text-red-400 mt-1')}>
                  {statistics.last30Days.failed}
                </p>
                <p className={cn(typography.textXs, colors.textMuted, 'mt-1')}>Delivery failed</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400/50" />
            </div>
          </div>
          
          <div className={cn(components.card, 'p-6')}>
            <div className="flex justify-between items-start">
              <div>
                <p className={cn(typography.textSm, colors.textSecondary)}>Bounced (30 days)</p>
                <p className={cn(typography.text2xl, typography.fontSemibold, 'text-yellow-400 mt-1')}>
                  {statistics.last30Days.bounced}
                </p>
                <p className={cn(typography.textXs, colors.textMuted, 'mt-1')}>Email bounced</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-400/50" />
            </div>
          </div>
          
          <div className={cn(components.card, 'p-6')}>
            <div className="flex justify-between items-start">
              <div>
                <p className={cn(typography.textSm, colors.textSecondary)}>Success Rate</p>
                <p className={cn(typography.text2xl, typography.fontSemibold, colors.textAccent, 'mt-1')}>
                  {successRate}%
                </p>
                <p className={cn(typography.textXs, colors.textMuted, 'mt-1')}>Last 30 days</p>
              </div>
              <Activity className={cn('w-8 h-8', colors.textAccentMuted)} />
            </div>
          </div>
        </div>
        
        {/* By Type Stats */}
        <div className={cn(components.card, 'p-6')}>
          <div>
            <h3 className={cn(typography.textLg, typography.fontSemibold, colors.textPrimary, 'flex items-center gap-2 mb-4')}>
              <BarChart className={cn('w-5 h-5', colors.textAccent)} />
              Performance by Email Type
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className={cn('px-4 py-3 text-left', typography.textSm, typography.fontMedium, colors.textProminent)}>Email Type</th>
                    <th className={cn('px-4 py-3 text-center', typography.textSm, typography.fontMedium, colors.textProminent)}>Sent</th>
                    <th className={cn('px-4 py-3 text-center', typography.textSm, typography.fontMedium, colors.textProminent)}>Failed</th>
                    <th className={cn('px-4 py-3 text-center', typography.textSm, typography.fontMedium, colors.textProminent)}>Bounced</th>
                    <th className={cn('px-4 py-3 text-center', typography.textSm, typography.fontMedium, colors.textProminent)}>Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(statistics.byType).map(([type, stats], index) => {
                    const total = stats.sent + stats.failed;
                    const rate = total > 0 ? ((stats.sent / total) * 100).toFixed(1) : '0';
                    
                    return (
                      <tr key={type} className={cn(
                        'border-b border-white/5',
                        index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'
                      )}>
                        <td className={cn('px-4 py-3', typography.textSm, colors.textSecondary)}>
                          {emailTypeDisplayNames[type] || type}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                            {stats.sent}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">
                            {stats.failed}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                            {stats.bounced}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(typography.textSm, typography.fontMedium, colors.textProminent)}>
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardPageLayout
        title="Email Automation"
        description="Manage automated email workflows"
      >
        <SkeletonLoader count={3} />
      </DashboardPageLayout>
    );
  }

  if (!hasPermission) {
    return (
      <DashboardPageLayout
        title="Email Automation"
        description="Manage automated email workflows and monitor performance"
      >
        <div className={cn(components.card, 'p-8 text-center')}>
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className={cn('w-12 h-12', colors.textWarning)} />
            <h2 className={cn(typography.text2xl, typography.fontSemibold, colors.textPrimary)}>
              Admin Access Required
            </h2>
            <p className={cn(typography.textBase, colors.textSecondary, 'max-w-md')}>
              You need administrator privileges to access email automation settings. Please contact your system administrator for access.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className={cn(components.button.base, components.button.variants.primary, 'mt-4')}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      title="Email Automation"
      description="Manage automated email workflows and monitor performance"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
          <button
            className={cn(
              'flex-1 px-4 py-2 rounded-md flex items-center justify-center gap-2',
              typography.textSm,
              typography.fontMedium,
              effects.transitionNormal,
              selectedTab === 'settings' 
                ? 'bg-gold-500 text-obsidian' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            )}
            onClick={() => setSelectedTab('settings')}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            className={cn(
              'flex-1 px-4 py-2 rounded-md flex items-center justify-center gap-2',
              typography.textSm,
              typography.fontMedium,
              effects.transitionNormal,
              selectedTab === 'logs' 
                ? 'bg-gold-500 text-obsidian' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            )}
            onClick={() => setSelectedTab('logs')}
          >
            <Mail className="w-4 h-4" />
            Activity Logs
          </button>
          <button
            className={cn(
              'flex-1 px-4 py-2 rounded-md flex items-center justify-center gap-2',
              typography.textSm,
              typography.fontMedium,
              effects.transitionNormal,
              selectedTab === 'stats' 
                ? 'bg-gold-500 text-obsidian' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            )}
            onClick={() => setSelectedTab('stats')}
          >
            <BarChart className="w-4 h-4" />
            Statistics
          </button>
        </div>
        
        {/* Tab Content */}
        {selectedTab === 'settings' && renderSettings()}
        {selectedTab === 'logs' && renderLogs()}
        {selectedTab === 'stats' && renderStatistics()}
      </div>
    </DashboardPageLayout>
  );
}