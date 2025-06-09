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
          const isGlobalEvent = !event.userId && ['payment_received', 'appointment_created'].includes(event.type);
          
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