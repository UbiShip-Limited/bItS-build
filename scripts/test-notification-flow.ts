#!/usr/bin/env tsx

/**
 * Test script to verify the notification flow is working correctly
 * Run with: npx tsx scripts/test-notification-flow.ts
 */

import { realtimeService } from '../lib/services/realtimeService';

async function testNotificationFlow() {
  console.log('🚀 Testing Notification Flow\n');
  console.log('================================\n');

  try {
    // Test 1: Appointment Created Notification
    console.log('📅 Test 1: Creating appointment notification...');
    await realtimeService.notifyAppointmentCreated(
      'test-appointment-123',
      'customer-456'
    );
    console.log('✅ Appointment notification sent\n');

    // Test 2: Tattoo Request Submitted Notification
    console.log('🎨 Test 2: Creating tattoo request notification...');
    await realtimeService.notifyRequestSubmitted(
      'test-request-789',
      'customer-456'
    );
    console.log('✅ Tattoo request notification sent\n');

    // Test 3: Payment Received Notification
    console.log('💰 Test 3: Creating payment notification...');
    await realtimeService.notifyPaymentReceived(
      'test-payment-321',
      150.00,
      'customer-456'
    );
    console.log('✅ Payment notification sent\n');

    // Test 4: Request Status Change Notifications
    console.log('📝 Test 4: Creating request status notifications...');
    
    await realtimeService.notifyRequestReviewed(
      'test-request-111',
      'customer-789'
    );
    console.log('✅ Request reviewed notification sent');

    await realtimeService.notifyRequestApproved(
      'test-request-222',
      'customer-789'
    );
    console.log('✅ Request approved notification sent');

    await realtimeService.notifyAppointmentApproved(
      'test-appointment-333',
      'customer-789'
    );
    console.log('✅ Appointment approved notification sent\n');

    // Get stats
    const stats = realtimeService.getStats();
    console.log('📊 Current Stats:');
    console.log(`   Total events: ${stats.totalEvents}`);
    console.log(`   Recent events: ${stats.recentEvents}`);
    console.log(`   Memory usage: ${stats.memoryUsage}\n`);

    console.log('================================');
    console.log('✅ All notification tests passed!');
    console.log('\n💡 To verify in the dashboard:');
    console.log('   1. Open the dashboard at http://localhost:3000/dashboard');
    console.log('   2. Check the browser console for SSE connection logs');
    console.log('   3. You should see the dashboard auto-refresh when events arrive');
    console.log('   4. The NotificationCenter bell icon should show new notifications');
    console.log('\n📝 Note: Make sure both frontend and backend are running:');
    console.log('   npm run dev:all');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testNotificationFlow().catch(console.error);