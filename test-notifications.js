#!/usr/bin/env node
/**
 * Test script to verify real-time notifications are working
 * Run this script with: node test-notifications.js
 */

const fetch = require('node-fetch');
const EventSource = require('eventsource');

const API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';
const USER_ID = 'admin-user'; // Test user ID

console.log('🧪 Testing Real-Time Notification System');
console.log(`📡 Backend URL: ${API_URL}`);
console.log(`👤 User ID: ${USER_ID}`);
console.log('');

// Connect to SSE endpoint
console.log('🔌 Connecting to SSE endpoint...');
const eventSource = new EventSource(`${API_URL}/api/events?userId=${USER_ID}`);

let connectionEstablished = false;

eventSource.onopen = () => {
  connectionEstablished = true;
  console.log('✅ Connected to notification stream!');
  console.log('');
  console.log('📨 Listening for notifications...');
  console.log('');
};

eventSource.onerror = (error) => {
  console.error('❌ SSE Connection error:', error);
  if (!connectionEstablished) {
    console.error('Failed to establish connection. Make sure the backend is running on port 3001.');
    process.exit(1);
  }
};

// Listen for specific event types
const eventTypes = [
  'appointment_created',
  'appointment_approved',
  'payment_received',
  'request_submitted',
  'request_reviewed',
  'request_approved',
  'request_rejected',
  'email_sent'
];

eventTypes.forEach(eventType => {
  eventSource.addEventListener(eventType, (event) => {
    const data = JSON.parse(event.data);
    console.log(`🔔 ${eventType.toUpperCase()} Event Received:`);
    console.log(`   ID: ${data.id}`);
    console.log(`   Time: ${new Date(data.timestamp).toLocaleString()}`);
    console.log(`   Data:`, JSON.stringify(data.data, null, 2));
    console.log('');
  });
});

// Also listen for generic messages
eventSource.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    console.log('📬 Generic Event Received:');
    console.log(`   Type: ${data.type}`);
    console.log(`   ID: ${data.id}`);
    console.log(`   Time: ${new Date(data.timestamp).toLocaleString()}`);
    console.log(`   Data:`, JSON.stringify(data.data, null, 2));
    console.log('');
  } catch (error) {
    console.log('📝 Raw message:', event.data);
  }
};

// Simulate events after connection is established
setTimeout(async () => {
  if (!connectionEstablished) {
    console.log('⏳ Still waiting for connection...');
    return;
  }

  console.log('🚀 Triggering test events...');
  console.log('');

  try {
    // Test 1: Simulate a tattoo request submission
    console.log('1️⃣ Simulating tattoo request submission...');
    await fetch(`${API_URL}/api/tattoo-requests/test-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'request_submitted' })
    }).catch(() => {
      console.log('   (Endpoint not available - would be triggered by actual request submission)');
    });

    // Test 2: Check event stats
    console.log('');
    console.log('2️⃣ Checking event statistics...');
    const statsResponse = await fetch(`${API_URL}/api/events/stats`);
    if (statsResponse.ok) {
      const { stats } = await statsResponse.json();
      console.log('   📊 Event Statistics:');
      console.log(`      Total Events: ${stats.totalEvents}`);
      console.log(`      Recent Events: ${stats.recentEvents}`);
      console.log(`      Memory Usage: ${stats.memoryUsage}`);
    }

    console.log('');
    console.log('💡 To test real notifications:');
    console.log('   1. Create/update a tattoo request through the UI');
    console.log('   2. Approve or reject a tattoo request');
    console.log('   3. Create or confirm an appointment');
    console.log('   4. Process a payment');
    console.log('');
    console.log('🔍 This window will display all notifications in real-time.');
    console.log('   Press Ctrl+C to exit.');

  } catch (error) {
    console.error('Error during testing:', error.message);
  }
}, 3000);

// Keep the script running
process.on('SIGINT', () => {
  console.log('\n👋 Closing notification stream...');
  eventSource.close();
  process.exit(0);
});