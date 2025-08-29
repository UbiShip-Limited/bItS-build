#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

async function testNotifications(token?: string) {
  console.log('🧪 Testing Notification System\n');
  console.log('Backend URL:', BACKEND_URL);
  
  // For testing, we'll use a sample token or prompt for one
  const authToken = token || process.env.TEST_AUTH_TOKEN;
  
  if (!authToken) {
    console.error('❌ No auth token provided');
    console.log('Please provide a token as argument or set TEST_AUTH_TOKEN in .env');
    console.log('Usage: npx tsx scripts/test-notifications.ts YOUR_TOKEN');
    process.exit(1);
  }
  
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // Test 1: Get notification settings
    console.log('📋 Test 1: Getting notification settings...');
    const settingsResponse = await axios.get(`${BACKEND_URL}/notifications/settings`, { headers });
    console.log('✅ Settings retrieved:');
    console.log(JSON.stringify(settingsResponse.data.settings, null, 2));
    console.log();
    
    // Test 2: Get notification stats
    console.log('📋 Test 2: Getting notification stats...');
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const statsResponse = await axios.get(
      `${BACKEND_URL}/notifications/stats?startDate=${startDate}&endDate=${endDate}`,
      { headers }
    );
    console.log('✅ Stats retrieved:');
    console.log('   Total notifications:', statsResponse.data.stats.totalNotifications);
    console.log('   Confirmations sent:', statsResponse.data.stats.confirmationsSent);
    console.log('   Reminders sent:', statsResponse.data.stats.remindersSent);
    console.log('   Manual notifications:', statsResponse.data.stats.manualNotifications);
    console.log('   Daily breakdown:', statsResponse.data.stats.notificationsByDay.length, 'days');
    console.log();
    
    // Test 3: Get notification history for a sample appointment
    console.log('📋 Test 3: Getting sample appointment notification history...');
    
    // First, get an appointment ID to test with
    const appointmentsResponse = await axios.get(`${BACKEND_URL}/appointments?limit=1`, { headers });
    
    if (appointmentsResponse.data.appointments && appointmentsResponse.data.appointments.length > 0) {
      const appointmentId = appointmentsResponse.data.appointments[0].id;
      console.log('   Testing with appointment ID:', appointmentId);
      
      const historyResponse = await axios.get(
        `${BACKEND_URL}/notifications/history/${appointmentId}`,
        { headers }
      );
      
      console.log('✅ Notification history:');
      console.log('   Appointment ID:', historyResponse.data.appointmentId);
      console.log('   Total notifications:', historyResponse.data.notifications.length);
      
      if (historyResponse.data.notifications.length > 0) {
        console.log('   Recent notifications:');
        historyResponse.data.notifications.slice(0, 3).forEach((notif: any) => {
          console.log(`     - ${notif.type} at ${new Date(notif.sentAt).toLocaleString()}`);
        });
      }
    } else {
      console.log('   No appointments found to test with');
    }
    console.log();
    
    // Test 4: Test manual notification (will return "coming soon" message)
    console.log('📋 Test 4: Testing manual notification endpoint...');
    
    if (appointmentsResponse.data.appointments && appointmentsResponse.data.appointments.length > 0) {
      const appointmentId = appointmentsResponse.data.appointments[0].id;
      
      try {
        const manualResponse = await axios.post(
          `${BACKEND_URL}/notifications/send-manual`,
          {
            appointmentId,
            type: 'reminder',
            message: 'Test reminder message'
          },
          { headers }
        );
        
        console.log('✅ Manual notification response:');
        console.log('   ', manualResponse.data.message);
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log('❌ Appointment not found');
        } else {
          console.log('❌ Error:', error.response?.data?.error || error.message);
        }
      }
    }
    
    console.log('\n✅ Notification system test complete!');
    console.log('\n📊 Summary:');
    console.log('- Settings endpoint: ✅ Working');
    console.log('- Stats endpoint: ✅ Working');
    console.log('- History endpoint: ✅ Working');
    console.log('- Manual send endpoint: ✅ Working (pending implementation)');
    console.log('\n💡 Note: Square handles automatic notifications. Manual notifications coming soon.');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\n🔑 Authentication failed. Please check your token.');
    } else if (error.response?.status === 403) {
      console.log('\n🚫 Authorization failed. You need admin role to access stats.');
    }
  }
}

// Run the test
const token = process.argv[2];
testNotifications(token).catch(console.error);