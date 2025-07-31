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

  const renderSettings = () => (
    <div className="space-y-4">
      {Array.isArray(settings) && settings.length > 0 ? settings.map((setting) => (
        <div key={setting.id} className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  {emailTypeDisplayNames[setting.emailType] || setting.emailType}
                </h3>
                <p className="text-sm text-base-content/70 mt-1">
                  {emailTypeDescriptions[setting.emailType]}
                </p>
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Timing: {setting.timingHours || 0}h {setting.timingMinutes || 0}m
                  </span>
                  {setting.businessHoursOnly && (
                    <span className="badge badge-sm">Business hours only</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text mr-2">Enabled</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={setting.enabled}
                      onChange={(e) => updateSetting(setting.emailType, { enabled: e.target.checked })}
                      disabled={updatingSettings === setting.emailType}
                    />
                  </label>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    const modal = document.getElementById(`settings_modal_${setting.emailType}`) as HTMLDialogElement;
                    modal?.showModal();
                  }}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )) : (
        <div className="text-center py-8 text-base-content/60">
          No email automation settings found. Please check your backend configuration.
        </div>
      )}
      
      {/* Settings Modals */}
      {Array.isArray(settings) && settings.map((setting) => (
        <dialog key={`modal_${setting.id}`} id={`settings_modal_${setting.emailType}`} className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              {emailTypeDisplayNames[setting.emailType]} Settings
            </h3>
            
            <div className="space-y-4 mt-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Timing (Hours)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={setting.timingHours || 0}
                  onChange={(e) => updateSetting(setting.emailType, { 
                    timingHours: parseInt(e.target.value) || 0 
                  })}
                  min="0"
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Timing (Minutes)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={setting.timingMinutes || 0}
                  onChange={(e) => updateSetting(setting.emailType, { 
                    timingMinutes: parseInt(e.target.value) || 0 
                  })}
                  min="0"
                  max="59"
                />
              </div>
              
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Business hours only</span>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={setting.businessHoursOnly}
                    onChange={(e) => updateSetting(setting.emailType, { 
                      businessHoursOnly: e.target.checked 
                    })}
                  />
                </label>
              </div>
            </div>
            
            <div className="modal-action">
              <form method="dialog">
                <button className="btn">Close</button>
              </form>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      ))}
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Recipient</th>
              <th>Status</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap">
                  {formatDistanceToNow(new Date(log.sentAt), { addSuffix: true })}
                </td>
                <td>
                  <div className="badge badge-sm">
                    {emailTypeDisplayNames[log.emailType]?.split(' ').slice(0, 2).join(' ') || log.emailType}
                  </div>
                </td>
                <td>
                  <div>
                    <div className="font-medium">{log.customer?.name || 'Unknown'}</div>
                    <div className="text-xs text-base-content/60">{log.emailAddress}</div>
                  </div>
                </td>
                <td>
                  {log.status === 'sent' && (
                    <div className="badge badge-success badge-sm gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Sent
                    </div>
                  )}
                  {log.status === 'failed' && (
                    <div className="badge badge-error badge-sm gap-1">
                      <XCircle className="w-3 h-3" />
                      Failed
                    </div>
                  )}
                  {log.status === 'bounced' && (
                    <div className="badge badge-warning badge-sm gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Bounced
                    </div>
                  )}
                </td>
                <td>
                  {log.error && (
                    <span className="text-xs text-error">{log.error}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {logs.length === 0 && (
        <div className="text-center py-8 text-base-content/60">
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
          <div className="stat bg-base-100 shadow rounded-box">
            <div className="stat-figure text-success">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="stat-title">Sent (30 days)</div>
            <div className="stat-value text-success">{statistics.last30Days.sent}</div>
            <div className="stat-desc">Successfully delivered</div>
          </div>
          
          <div className="stat bg-base-100 shadow rounded-box">
            <div className="stat-figure text-error">
              <XCircle className="w-8 h-8" />
            </div>
            <div className="stat-title">Failed (30 days)</div>
            <div className="stat-value text-error">{statistics.last30Days.failed}</div>
            <div className="stat-desc">Delivery failed</div>
          </div>
          
          <div className="stat bg-base-100 shadow rounded-box">
            <div className="stat-figure text-warning">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="stat-title">Bounced (30 days)</div>
            <div className="stat-value text-warning">{statistics.last30Days.bounced}</div>
            <div className="stat-desc">Email bounced</div>
          </div>
          
          <div className="stat bg-base-100 shadow rounded-box">
            <div className="stat-figure text-primary">
              <Activity className="w-8 h-8" />
            </div>
            <div className="stat-title">Success Rate</div>
            <div className="stat-value text-primary">{successRate}%</div>
            <div className="stat-desc">Last 30 days</div>
          </div>
        </div>
        
        {/* By Type Stats */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title">
              <BarChart className="w-5 h-5" />
              Performance by Email Type
            </h3>
            
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Email Type</th>
                    <th className="text-center">Sent</th>
                    <th className="text-center">Failed</th>
                    <th className="text-center">Bounced</th>
                    <th className="text-center">Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(statistics.byType).map(([type, stats]) => {
                    const total = stats.sent + stats.failed;
                    const rate = total > 0 ? ((stats.sent / total) * 100).toFixed(1) : '0';
                    
                    return (
                      <tr key={type}>
                        <td>{emailTypeDisplayNames[type] || type}</td>
                        <td className="text-center">
                          <span className="badge badge-success">{stats.sent}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge badge-error">{stats.failed}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge badge-warning">{stats.bounced}</span>
                        </td>
                        <td className="text-center">
                          <span className="font-medium">{rate}%</span>
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

  return (
    <DashboardPageLayout
      title="Email Automation"
      description="Manage automated email workflows and monitor performance"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="tabs tabs-boxed">
          <button
            className={`tab ${selectedTab === 'settings' ? 'tab-active' : ''}`}
            onClick={() => setSelectedTab('settings')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>
          <button
            className={`tab ${selectedTab === 'logs' ? 'tab-active' : ''}`}
            onClick={() => setSelectedTab('logs')}
          >
            <Mail className="w-4 h-4 mr-2" />
            Activity Logs
          </button>
          <button
            className={`tab ${selectedTab === 'stats' ? 'tab-active' : ''}`}
            onClick={() => setSelectedTab('stats')}
          >
            <BarChart className="w-4 h-4 mr-2" />
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