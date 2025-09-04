'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Clock, DollarSign, Calendar, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'appointment_created' | 'payment_received' | 'request_submitted' | 'system_alert' | 
        'request_reviewed' | 'request_approved' | 'request_rejected' | 'appointment_approved' |
        'email_sent';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  data?: any;
}

interface NotificationCenterProps {
  userId: string;
  onDashboardMetricsUpdate?: () => void;
}

export default function NotificationCenter({ userId, onDashboardMetricsUpdate }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Connect to Server-Sent Events
  useEffect(() => {
    const connectToEvents = () => {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
      const eventTypes = [
        'appointment_created', 
        'payment_received', 
        'request_submitted',
        'request_reviewed',
        'request_approved', 
        'request_rejected',
        'appointment_approved',
        'email_sent',
        'dashboard_metrics_updated'
      ].join(',');
      
      const eventSource = new EventSource(`${apiUrl}/events?userId=${userId}&eventTypes=${eventTypes}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        console.log('Connected to notification stream');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const notification: Notification = {
            id: data.id,
            title: getNotificationTitle(data.type),
            message: getNotificationMessage(data.type, data.data),
            type: data.type,
            priority: data.priority || 'medium',
            timestamp: new Date(data.timestamp),
            read: false,
            data: data.data
          };

          setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
          
          // Handle dashboard metrics updates
          if (data.type === 'dashboard_metrics_updated' && onDashboardMetricsUpdate) {
            console.log('Dashboard metrics update received:', data.data);
            onDashboardMetricsUpdate();
          }
          
          // Show browser notification for high priority
          if (notification.priority === 'high' || notification.priority === 'urgent') {
            showBrowserNotification(notification);
          }
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();
        
        // Reconnect after 5 seconds
        setTimeout(connectToEvents, 5000);
      };
    };

    connectToEvents();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [userId]);

  // Update unread count
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const getNotificationTitle = (type: string): string => {
    switch (type) {
      case 'appointment_created': return 'New Appointment';
      case 'payment_received': return 'Payment Received';
      case 'request_submitted': return 'New Request';
      case 'request_reviewed': return 'Request Reviewed';
      case 'request_approved': return 'Request Approved';
      case 'request_rejected': return 'Request Rejected';
      case 'appointment_approved': return 'Appointment Confirmed';
      case 'email_sent': return 'Email Sent';
      case 'dashboard_metrics_updated': return 'Dashboard Updated';
      case 'system_alert': return 'System Alert';
      default: return 'Notification';
    }
  };

  const getNotificationMessage = (type: string, data: any): string => {
    switch (type) {
      case 'appointment_created':
        return `Appointment scheduled${data?.customerId ? ' for customer' : ''}`;
      case 'payment_received':
        return `Payment of $${data?.amount || 0} received`;
      case 'request_submitted':
        return 'New tattoo request needs review';
      case 'request_reviewed':
        return data?.message || 'Tattoo request has been reviewed';
      case 'request_approved':
        return data?.message || 'Tattoo request has been approved';
      case 'request_rejected':
        return data?.message || 'Tattoo request has been declined';
      case 'appointment_approved':
        return data?.message || 'Appointment has been confirmed';
      case 'email_sent':
        return data?.message || 'Email notification sent';
      case 'dashboard_metrics_updated':
        return data?.message || `Metrics updated for ${data?.timeframe || 'today'}`;
      case 'system_alert':
        return data?.message || 'System notification';
      default:
        return data?.message || 'New notification';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_created': return Calendar;
      case 'appointment_approved': return CheckCircle;
      case 'payment_received': return DollarSign;
      case 'request_submitted': return FileText;
      case 'request_reviewed': return FileText;
      case 'request_approved': return CheckCircle;
      case 'request_rejected': return AlertCircle;
      case 'email_sent': return Bell;
      case 'system_alert': return AlertCircle;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-500/10';
      case 'high': return 'border-orange-500 bg-orange-500/10';
      case 'medium': return 'border-[#C9A449] bg-[#C9A449]/10';
      case 'low': return 'border-gray-500 bg-gray-500/10';
      default: return 'border-[#C9A449] bg-[#C9A449]/10';
    }
  };

  const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
      >
        <Bell className="w-6 h-6" />
        
        {/* Connection Status */}
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-[#080808] ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        
        {/* Unread Count */}
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-[#C9A449] text-[#080808] text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-[#111111] border border-[#C9A449]/20 rounded-lg shadow-2xl z-50 max-h-[500px] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Notifications</h3>
              <p className="text-xs text-gray-400">
                {isConnected ? 'Live updates' : 'Reconnecting...'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-[#C9A449] hover:text-white transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-xs mt-1">You'll see updates here when they happen</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 border-b border-[#1a1a1a] last:border-b-0 transition-all duration-200 hover:bg-white/5 ${
                      getPriorityColor(notification.priority)
                    } ${notification.read ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#080808] border border-[#C9A449]/20">
                        <Icon className="w-4 h-4 text-[#C9A449]" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-white truncate">
                            {notification.title}
                          </h4>
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="text-gray-500 hover:text-white transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {notification.timestamp.toLocaleTimeString()}
                          </div>
                          
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-[#C9A449] hover:text-white transition-colors"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-[#1a1a1a] text-center">
              <button className="text-xs text-[#C9A449] hover:text-white transition-colors">
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 