#!/usr/bin/env tsx

/**
 * Test script to simulate real-time notifications for dashboard testing
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { RealtimeService } from '../lib/services/realtimeService';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

async function testRealtimeNotifications() {
  console.log(`\n${colors.bright}${colors.cyan}=== Real-time Notification Test ===${colors.reset}\n`);
  console.log('This script will send test notifications to the dashboard.');
  console.log('Open your dashboard at http://localhost:3000/dashboard to see them.\n');

  const realtimeService = new RealtimeService();
  
  // Test 1: New tattoo request
  console.log(`${colors.yellow}📨 Sending: New Tattoo Request notification...${colors.reset}`);
  await realtimeService.addEvent({
    type: 'request_submitted',
    data: {
      requestId: 'test-request-' + Date.now(),
      customerId: 'test-customer-1',
      customerName: 'John Doe',
      description: 'Dragon tattoo on forearm',
      message: 'New tattoo request from John Doe'
    }
  });
  console.log(`${colors.green}✓ Sent!${colors.reset}`);
  
  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: New appointment
  console.log(`${colors.yellow}📅 Sending: New Appointment notification...${colors.reset}`);
  await realtimeService.addEvent({
    type: 'appointment_created',
    data: {
      appointmentId: 'test-appointment-' + Date.now(),
      customerId: 'test-customer-2',
      customerName: 'Jane Smith',
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      message: 'New appointment booked by Jane Smith'
    }
  });
  console.log(`${colors.green}✓ Sent!${colors.reset}`);
  
  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: Payment received
  console.log(`${colors.yellow}💰 Sending: Payment Received notification...${colors.reset}`);
  await realtimeService.addEvent({
    type: 'payment_received',
    data: {
      paymentId: 'test-payment-' + Date.now(),
      amount: 250.00,
      customerId: 'test-customer-3',
      customerName: 'Bob Wilson',
      message: 'Payment of $250.00 received from Bob Wilson'
    }
  });
  console.log(`${colors.green}✓ Sent!${colors.reset}`);
  
  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 4: Owner email sent (high priority)
  console.log(`${colors.yellow}🔔 Sending: Owner Email notification (high priority)...${colors.reset}`);
  await realtimeService.addEvent({
    type: 'email_sent',
    data: {
      message: 'Urgent: New tattoo request needs review',
      notificationType: 'owner_new_request',
      priority: 'high',
      customerName: 'Sarah Johnson',
      requestId: 'test-urgent-request-' + Date.now()
    }
  });
  console.log(`${colors.green}✓ Sent!${colors.reset}`);
  
  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 5: Request approved
  console.log(`${colors.yellow}✅ Sending: Request Approved notification...${colors.reset}`);
  await realtimeService.addEvent({
    type: 'request_approved',
    data: {
      requestId: 'test-request-approved-' + Date.now(),
      customerId: 'test-customer-4',
      customerName: 'Mike Brown',
      message: 'Tattoo request approved for Mike Brown'
    }
  });
  console.log(`${colors.green}✓ Sent!${colors.reset}`);
  
  // Summary
  const stats = realtimeService.getStats();
  console.log(`\n${colors.bright}${colors.blue}=== Summary ===${colors.reset}`);
  console.log(`Total events in memory: ${stats.totalEvents}`);
  console.log(`Recent events available: ${stats.recentEvents}`);
  
  console.log(`\n${colors.magenta}📱 To see these notifications:${colors.reset}`);
  console.log('1. Open your browser to http://localhost:3000/dashboard');
  console.log('2. Look for the notification bell icon in the header');
  console.log('3. Click it to see the notifications');
  console.log('4. Check browser console for SSE connection status');
  console.log(`\n${colors.cyan}The dashboard will receive these in real-time if connected!${colors.reset}\n`);
}

// Run the test
testRealtimeNotifications()
  .then(() => {
    console.log('Test complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });