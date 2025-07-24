import { cacheService } from './cacheService';

export interface RealtimeEvent {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  userId?: string;
}

export interface EventSubscription {
  userId: string;
  eventTypes: string[];
  lastEventId?: string;
}

/**
 * Cost-effective real-time service using Server-Sent Events
 * Much cheaper than WebSocket connections and simpler to scale
 */
export class RealtimeService {
  private events: RealtimeEvent[] = [];
  private maxEvents = 1000; // Limit memory usage
  
  /**
   * Add a new event
   */
  async addEvent(event: Omit<RealtimeEvent, 'id' | 'timestamp'>): Promise<void> {
    const newEvent: RealtimeEvent = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event
    };
    
    this.events.push(newEvent);
    
    // Keep only recent events to manage memory
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    
    // Cache recent events for quick access
    const cacheKey = `recent_events_${event.userId || 'global'}`;
    const recentEvents = this.events
      .filter(e => Date.now() - e.timestamp.getTime() < 300000) // Last 5 minutes
      .slice(-50); // Last 50 events
    
    cacheService.set(cacheKey, recentEvents, 300);
  }
  
  /**
   * Get events for Server-Sent Events endpoint
   */
  async getEventsForSSE(subscription: EventSubscription): Promise<RealtimeEvent[]> {
    const cacheKey = `recent_events_${subscription.userId}`;
    let events = cacheService.get<RealtimeEvent[]>(cacheKey);
    
    if (!events) {
      // Fallback to in-memory events
      events = this.events
        .filter(event => {
          // Filter by user (if specified) or global events
          const isUserEvent = !event.userId || event.userId === subscription.userId;
          const isGlobalEvent = !event.userId && [
            'payment_received', 
            'appointment_created', 
            'request_submitted',
            'request_reviewed',
            'request_approved',
            'request_rejected',
            'appointment_approved'
          ].includes(event.type);
          
          return (isUserEvent || isGlobalEvent) && 
                 subscription.eventTypes.includes(event.type);
        })
        .filter(event => Date.now() - event.timestamp.getTime() < 300000) // Last 5 minutes only
        .slice(-20); // Limit to recent events
      
      cacheService.set(cacheKey, events, 300);
    }
    
    // Filter events after last received event ID
    if (subscription.lastEventId) {
      const lastEventIndex = events.findIndex(e => e.id === subscription.lastEventId);
      if (lastEventIndex >= 0) {
        events = events.slice(lastEventIndex + 1);
      }
    }
    
    return events;
  }
  
  /**
   * Create appointment event
   */
  async notifyAppointmentCreated(appointmentId: string, customerId?: string): Promise<void> {
    await this.addEvent({
      type: 'appointment_created',
      data: { appointmentId, customerId },
      userId: undefined // Global event
    });
  }
  
  /**
   * Create payment event
   */
  async notifyPaymentReceived(paymentId: string, amount: number, customerId?: string): Promise<void> {
    await this.addEvent({
      type: 'payment_received',
      data: { paymentId, amount, customerId },
      userId: undefined // Global event
    });
  }
  
  /**
   * Create request event
   */
  async notifyRequestSubmitted(requestId: string, customerId?: string): Promise<void> {
    await this.addEvent({
      type: 'request_submitted',
      data: { requestId, customerId },
      userId: undefined // Global event
    });
  }
  
  /**
   * Create user-specific notification
   */
  async notifyUser(userId: string, type: string, data: any): Promise<void> {
    await this.addEvent({
      type,
      data,
      userId
    });
  }
  
  /**
   * Notify when a tattoo request is reviewed
   */
  async notifyRequestReviewed(requestId: string, customerId?: string): Promise<void> {
    await this.addEvent({
      type: 'request_reviewed',
      data: { requestId, customerId, message: 'Your tattoo request has been reviewed' },
      userId: undefined // Global event for admin
    });
    
    // Also notify the customer if they have an ID
    if (customerId) {
      await this.notifyUser(customerId, 'request_reviewed', {
        requestId,
        message: 'Your tattoo request has been reviewed by the artist'
      });
    }
  }
  
  /**
   * Notify when a tattoo request is approved
   */
  async notifyRequestApproved(requestId: string, customerId?: string): Promise<void> {
    await this.addEvent({
      type: 'request_approved',
      data: { requestId, customerId, message: 'Tattoo request approved' },
      userId: undefined // Global event for admin
    });
    
    // Also notify the customer if they have an ID
    if (customerId) {
      await this.notifyUser(customerId, 'request_approved', {
        requestId,
        message: 'Great news! Your tattoo request has been approved'
      });
    }
  }
  
  /**
   * Notify when a tattoo request is rejected
   */
  async notifyRequestRejected(requestId: string, customerId?: string): Promise<void> {
    await this.addEvent({
      type: 'request_rejected',
      data: { requestId, customerId, message: 'Tattoo request declined' },
      userId: undefined // Global event for admin
    });
    
    // Also notify the customer if they have an ID
    if (customerId) {
      await this.notifyUser(customerId, 'request_rejected', {
        requestId,
        message: 'Your tattoo request has been declined. Please contact us for more information.'
      });
    }
  }
  
  /**
   * Notify when an appointment is approved/confirmed
   */
  async notifyAppointmentApproved(appointmentId: string, customerId?: string): Promise<void> {
    await this.addEvent({
      type: 'appointment_approved',
      data: { appointmentId, customerId, message: 'Appointment confirmed' },
      userId: undefined // Global event for admin
    });
    
    // Also notify the customer if they have an ID
    if (customerId) {
      await this.notifyUser(customerId, 'appointment_approved', {
        appointmentId,
        message: 'Your appointment has been confirmed!'
      });
    }
  }
  
  /**
   * Create a notification with custom data (alias for notifyUser for backward compatibility)
   */
  async sendNotification(notification: { 
    type: string; 
    title: string; 
    message: string; 
    severity?: 'info' | 'warning' | 'error' | 'success';
    metadata?: any;
    userId?: string;
  }): Promise<void> {
    const { userId, ...data } = notification;
    
    if (userId) {
      await this.notifyUser(userId, notification.type, data);
    } else {
      await this.addEvent({
        type: notification.type,
        data,
        userId: undefined
      });
    }
  }
  
  /**
   * Get event statistics
   */
  getStats(): {
    totalEvents: number;
    recentEvents: number;
    memoryUsage: string;
  } {
    const now = Date.now();
    const recentEvents = this.events.filter(e => now - e.timestamp.getTime() < 300000).length;
    
    return {
      totalEvents: this.events.length,
      recentEvents,
      memoryUsage: `${(this.events.length * 100 / this.maxEvents).toFixed(1)}%`
    };
  }
  
  /**
   * Cleanup old events
   */
  cleanup(): void {
    const fiveMinutesAgo = Date.now() - 300000;
    this.events = this.events.filter(e => e.timestamp.getTime() > fiveMinutesAgo);
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();

// Cleanup old events every 5 minutes
setInterval(() => {
  realtimeService.cleanup();
}, 300000); 