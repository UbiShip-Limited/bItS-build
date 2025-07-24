'use client';

import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '@/src/lib/api/apiClient';

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
      const response = await apiClient.get('/square-sync/status');
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
        const response = await apiClient.get('/square-sync/status');
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
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-[#1a1a1a] rounded w-32 mb-4"></div>
          <div className="h-3 bg-[#1a1a1a] rounded w-48"></div>
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
    <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          Square Integration
          {configuration.isConfigured ? (
            <Cloud className="w-5 h-5 text-green-500" />
          ) : (
            <CloudOff className="w-5 h-5 text-red-500" />
          )}
        </h3>
        
        {configuration.isConfigured && (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-[#C9A449] hover:bg-[#B8934A] disabled:bg-[#8B7635] disabled:cursor-not-allowed text-[#080808] rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>

      {/* Configuration Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Status</span>
          <span className={`font-medium ${configuration.isConfigured ? 'text-green-500' : 'text-red-500'}`}>
            {configuration.isConfigured ? 'Connected' : 'Not Connected'}
          </span>
        </div>

        {configuration.isConfigured && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Environment</span>
              <span className="text-white font-medium capitalize">
                {configuration.environment}
              </span>
            </div>

            {lastSync?.lastRun && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Last Sync</span>
                  <span className="text-white">
                    {new Date(lastSync.lastRun).toLocaleString()}
                  </span>
                </div>

                {lastSync.results && (
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3 mt-3">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {lastSync.results.synced}
                        </p>
                        <p className="text-xs text-gray-500">Synced</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-500">
                          {lastSync.results.created}
                        </p>
                        <p className="text-xs text-gray-500">Created</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-500">
                          {lastSync.results.updated}
                        </p>
                        <p className="text-xs text-gray-500">Updated</p>
                      </div>
                    </div>

                    {lastSync.results.errors.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
                        <p className="text-xs text-red-400">
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
              <div key={index} className="flex items-start gap-2 text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400">{warning}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}