'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { apiClient } from '@/src/lib/api/apiClient';

interface NotificationStatusProps {
  appointmentId: string;
  customerId?: string;
  compact?: boolean;
}

interface CommunicationHistory {
  id: string;
  type: string;
  sentAt: string;
  details: any;
}

interface NotificationData {
  squareNotificationsEnabled: boolean;
  communicationHistory: CommunicationHistory[];
}

// Cache for notification data to prevent unnecessary API calls
const notificationCache = new Map<string, { data: NotificationData; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache

export default function AppointmentNotificationStatus({ 
  appointmentId, 
  customerId, 
  compact = false 
}: NotificationStatusProps) {
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const previousIdRef = useRef<string | null>(null);

  const loadNotificationStatus = useCallback(async () => {
    // Prevent duplicate requests
    if (loadingRef.current || !appointmentId) {
      return;
    }

    // Check cache first
    const cached = notificationCache.get(appointmentId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setNotificationData(cached.data);
      setLoading(false);
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      
      // Call the backend service to get notification status
      const response = await apiClient.get<NotificationData>(`/appointments/${appointmentId}/notifications`);
      
      // Cache the response
      notificationCache.set(appointmentId, { data: response, timestamp: Date.now() });
      
      setNotificationData(response);
    } catch (err: any) {
      console.error('Failed to load notification status:', err);
      setError(err.message || 'Failed to load notification data');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [appointmentId]);

  useEffect(() => {
    // Only load if appointmentId changed
    if (appointmentId && appointmentId !== previousIdRef.current) {
      previousIdRef.current = appointmentId;
      loadNotificationStatus();
    }
  }, [appointmentId, loadNotificationStatus]);

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment_confirmation':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'appointment_reminder':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'aftercare_instructions':
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case 'booking_created_webhook':
      case 'booking_updated_webhook':
        return <ExternalLink className="w-4 h-4 text-yellow-400" />;
      default:
        return <Mail className="w-4 h-4 text-gray-400" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'appointment_confirmation': 'Confirmation Sent',
      'appointment_reminder': 'Reminder Sent',
      'aftercare_instructions': 'Aftercare Sent',
      'booking_created_webhook': 'Square Booking Created',
      'booking_updated_webhook': 'Square Booking Updated'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
        <div className="animate-spin w-3 h-3 border border-gray-600 border-t-transparent rounded-full"></div>
        Loading...
      </div>
    );
  }

  if (error || !notificationData) {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
        <AlertCircle className="w-3 h-3" />
        No data
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* Square sync status */}
        <div className={`flex items-center gap-1 ${notificationData.squareNotificationsEnabled ? 'text-green-400' : 'text-gray-500'}`}>
          <Bell className="w-3 h-3" />
          <span className="text-xs">
            {notificationData.squareNotificationsEnabled ? 'Auto' : 'Manual'}
          </span>
        </div>
        
        {/* Communication count */}
        {notificationData.communicationHistory.length > 0 && (
          <div className="flex items-center gap-1 text-blue-400">
            <Mail className="w-3 h-3" />
            <span className="text-xs">{notificationData.communicationHistory.length}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Notification Settings */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-200">Communication Status</h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
          notificationData.squareNotificationsEnabled 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-gray-500/20 text-gray-400'
        }`}>
          <Bell className="w-4 h-4" />
          {notificationData.squareNotificationsEnabled ? 'Auto Notifications' : 'Manual Only'}
        </div>
      </div>

      {/* Communication History */}
      {notificationData.communicationHistory.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-400">Recent Communications</p>
          <div className="space-y-2">
            {notificationData.communicationHistory.slice(0, 5).map((comm) => (
              <div key={comm.id} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded">
                {getNotificationTypeIcon(comm.type)}
                <div className="flex-1">
                  <p className="text-sm text-gray-200">{getNotificationTypeLabel(comm.type)}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(comm.sentAt).toLocaleString()}
                  </p>
                </div>
                {comm.details?.status && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    comm.details.status === 'sent' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {comm.details.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <Mail className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No communications sent yet</p>
        </div>
      )}
    </div>
  );
}