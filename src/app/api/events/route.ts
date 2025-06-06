import { NextRequest } from 'next/server';
import { realtimeService } from '../../../../lib/services/realtimeService';
import { generateMockRealtimeEvent } from '../../../../lib/services/mockAnalyticsData';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'anonymous';
  const lastEventId = searchParams.get('lastEventId');
  
  // Create readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const encoder = new TextEncoder();
      
      const sendEvent = (data: any, event?: string) => {
        const eventData = [
          event ? `event: ${event}` : '',
          `data: ${JSON.stringify(data)}`,
          `id: ${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          '', // Empty line to separate events
        ].filter(Boolean).join('\n') + '\n';
        
        controller.enqueue(encoder.encode(eventData));
      };

      // Send connection established event
      sendEvent({ 
        type: 'connection_established', 
        timestamp: new Date().toISOString(),
        userId 
      }, 'connect');

      // Set up periodic heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        sendEvent({ 
          type: 'heartbeat', 
          timestamp: new Date().toISOString() 
        }, 'heartbeat');
      }, 30000); // Every 30 seconds

      // Set up event polling
      const eventInterval = setInterval(async () => {
        try {
          const events = await realtimeService.getEventsForSSE({
            userId,
            eventTypes: [
              'appointment_created',
              'payment_received', 
              'request_submitted',
              'system_alert'
            ],
            lastEventId: lastEventId || undefined
          });

          // Send each event
          events.forEach(event => {
            sendEvent({
              id: event.id,
              type: event.type,
              data: event.data,
              timestamp: event.timestamp.toISOString()
            }, event.type);
          });

          // For demo purposes, occasionally send a mock event
          if (Math.random() > 0.7) { // 30% chance every 5 seconds
            const mockEvent = generateMockRealtimeEvent();
            sendEvent({
              id: mockEvent.id,
              type: mockEvent.type,
              data: mockEvent.data,
              timestamp: mockEvent.timestamp.toISOString(),
              priority: mockEvent.priority
            }, mockEvent.type);
          }

        } catch (error) {
          console.error('Error fetching real-time events:', error);
          sendEvent({
            type: 'error',
            message: 'Failed to fetch events',
            timestamp: new Date().toISOString()
          }, 'error');
        }
      }, 5000); // Check for new events every 5 seconds

      // Cleanup function
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        clearInterval(eventInterval);
        controller.close();
      });

      // Auto-cleanup after 5 minutes of inactivity
      setTimeout(() => {
        clearInterval(heartbeatInterval);
        clearInterval(eventInterval);
        sendEvent({
          type: 'connection_timeout',
          message: 'Connection closed due to inactivity',
          timestamp: new Date().toISOString()
        }, 'disconnect');
        controller.close();
      }, 5 * 60 * 1000); // 5 minutes
    }
  });

  // Return response with appropriate headers for Server-Sent Events
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
} 