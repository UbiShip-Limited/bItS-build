'use client';

import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '@/src/lib/api/apiClient';
import { typography, colors, effects, components, cn } from '@/src/lib/styles/globalStyleConstants';

interface SquareSyncStatus {
  configuration: {
    isConfigured: boolean;
    hasAccessToken: boolean;
    hasLocationId: boolean;
    environment: string;
    warnings: string[];
  };
  lastSync?: {
    lastRun?: string;
    success?: boolean;
    results?: {
      synced: number;
      created: number;
      updated: number;
      errors: Array<{ bookingId: string; error: string }>;
    };
  };
  isRunning: boolean;
}

export default function SquareSyncStatus() {
  const [status, setStatus] = useState<SquareSyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await apiClient.get('/square-sync/status') as SquareSyncStatus;
      setStatus(response);
    } catch (error) {
      console.error('Failed to fetch Square sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Poll status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await apiClient.post('/square-sync/run', {});
      
      // Poll for status updates more frequently during sync
      const pollInterval = setInterval(async () => {
        const response = await apiClient.get('/square-sync/status') as SquareSyncStatus;
        setStatus(response);
        
        if (!response.isRunning) {
          clearInterval(pollInterval);
          setSyncing(false);
        }
      }, 2000);
      
      // Stop polling after 5 minutes as a safety measure
      setTimeout(() => {
        clearInterval(pollInterval);
        setSyncing(false);
      }, 300000);
    } catch (error) {
      console.error('Failed to start Square sync:', error);
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-white/10 rounded w-32 mb-4"></div>
          <div className="h-3 bg-white/10 rounded w-48"></div>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const { configuration, lastSync, isRunning } = status;
  const isSyncing = isRunning || syncing;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {configuration.isConfigured ? (
            <Cloud className="w-5 h-5 text-emerald-500" />
          ) : (
            <CloudOff className="w-5 h-5 text-red-500" />
          )}
          <span className={cn(typography.textBase, typography.fontMedium, colors.textPrimary)}>
            {configuration.isConfigured ? 'Connected' : 'Not Connected'}
          </span>
        </div>
        
        {configuration.isConfigured && (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={cn(
              components.button.base,
              components.button.sizes.small,
              components.button.variants.primary,
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <RefreshCw className={cn('w-3.5 h-3.5 mr-1', isSyncing && 'animate-spin')} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>

      {/* Configuration Status */}
      <div className="space-y-3">
        {configuration.isConfigured && (
          <>
            <div className="flex items-center justify-between">
              <span className={cn(typography.textSm, colors.textMuted)}>Environment</span>
              <span className={cn(typography.textSm, typography.fontMedium, colors.textPrimary, 'capitalize')}>
                {configuration.environment}
              </span>
            </div>

            {lastSync?.lastRun && (
              <>
                <div className="flex items-center justify-between">
                  <span className={cn(typography.textSm, colors.textMuted)}>Last Sync</span>
                  <span className={cn(typography.textSm, colors.textPrimary)}>
                    {new Date(lastSync.lastRun).toLocaleString()}
                  </span>
                </div>

                {lastSync.results && (
                  <div className={cn('bg-white/5 border', colors.borderSubtle, components.radius.small, 'p-3 mt-3')}>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className={cn(typography.text2xl, typography.fontSemibold, colors.textPrimary)}>
                          {lastSync.results.synced}
                        </p>
                        <p className={cn(typography.textXs, colors.textMuted)}>Synced</p>
                      </div>
                      <div>
                        <p className={cn(typography.text2xl, typography.fontSemibold, 'text-emerald-500')}>
                          {lastSync.results.created}
                        </p>
                        <p className={cn(typography.textXs, colors.textMuted)}>Created</p>
                      </div>
                      <div>
                        <p className={cn(typography.text2xl, typography.fontSemibold, 'text-blue-500')}>
                          {lastSync.results.updated}
                        </p>
                        <p className={cn(typography.textXs, colors.textMuted)}>Updated</p>
                      </div>
                    </div>

                    {lastSync.results.errors.length > 0 && (
                      <div className={cn('mt-3 pt-3 border-t', colors.borderSubtle)}>
                        <p className={cn(typography.textXs, 'text-red-400')}>
                          {lastSync.results.errors.length} error{lastSync.results.errors.length !== 1 ? 's' : ''} during sync
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Warnings */}
        {configuration.warnings.length > 0 && (
          <div className="mt-4 space-y-2">
            {configuration.warnings.map((warning, index) => (
              <div key={index} className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className={cn(typography.textXs, colors.textMuted)}>{warning}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}