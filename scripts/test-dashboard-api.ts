#!/usr/bin/env tsx

/**
 * Test script to verify dashboard API is returning correct data
 * Run with: npx tsx scripts/test-dashboard-api.ts
 */

import { createClient } from '@supabase/supabase-js';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jjozvqtgdutoidsylnoe.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqb3p2cXRnZHV0b2lkc3lsbm9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwODgzNjcsImV4cCI6MjA2MjY2NDM2N30.4dhgy5sC5ocX3qWXDkkyZ0Zepwd8rfuWlbsVV4yCvgU';

async function testDashboardAPI() {
  console.log('🚀 Testing Dashboard API\n');
  console.log('================================\n');

  try {
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Sign in as admin
    console.log('🔐 Authenticating as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'maxmusickdevelopment@gmail.com',
      password: 'test123456'
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      process.exit(1);
    }

    const token = authData.session?.access_token;
    if (!token) {
      console.error('❌ No access token received');
      process.exit(1);
    }

    console.log('✅ Authenticated successfully\n');

    // Test 1: Call dashboard/metrics endpoint
    console.log('📊 Test 1: Fetching dashboard metrics...');
    const metricsResponse = await fetch(`${BACKEND_URL}/api/v1/dashboard/metrics`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!metricsResponse.ok) {
      const errorText = await metricsResponse.text();
      console.error(`❌ Failed to fetch metrics: ${metricsResponse.status} ${metricsResponse.statusText}`);
      console.error('Error body:', errorText);
      process.exit(1);
    }

    const dashboardData = await metricsResponse.json();
    
    console.log('✅ Dashboard API Response:\n');
    console.log('📈 Metrics:');
    console.log('   Today\'s Appointments:', JSON.stringify(dashboardData.metrics?.todayAppointments, null, 2));
    console.log('   Requests:', JSON.stringify(dashboardData.metrics?.requests, null, 2));
    console.log('   Revenue:', JSON.stringify(dashboardData.metrics?.revenue, null, 2));
    console.log('   Action Items:', JSON.stringify(dashboardData.metrics?.actionItems, null, 2));
    console.log('\n📋 Priority Actions:', dashboardData.priorityActions?.length || 0, 'items');
    console.log('📝 Recent Activity:', dashboardData.recentActivity?.length || 0, 'items\n');

    // Test 2: Check individual endpoints
    console.log('🔍 Test 2: Checking individual endpoints...\n');

    // Check appointments
    const appointmentsResponse = await fetch(`${BACKEND_URL}/api/v1/appointments?status=all`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (appointmentsResponse.ok) {
      const appointments = await appointmentsResponse.json();
      console.log(`   📅 Total appointments: ${appointments.data?.length || 0}`);
      const todayAppts = appointments.data?.filter((a: any) => {
        const apptDate = new Date(a.startTime);
        const today = new Date();
        return apptDate.toDateString() === today.toDateString();
      });
      console.log(`   📅 Today's appointments: ${todayAppts?.length || 0}`);
    }

    // Check tattoo requests
    const requestsResponse = await fetch(`${BACKEND_URL}/api/v1/tattoo-requests?status=new`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (requestsResponse.ok) {
      const requests = await requestsResponse.json();
      console.log(`   🎨 New tattoo requests: ${requests.data?.length || 0}`);
    }

    // Check payments
    const paymentsResponse = await fetch(`${BACKEND_URL}/api/v1/payments?status=completed`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (paymentsResponse.ok) {
      const payments = await paymentsResponse.json();
      console.log(`   💰 Completed payments: ${payments.data?.length || 0}`);
    }

    console.log('\n================================');
    console.log('✅ Dashboard API test completed!');
    console.log('\n💡 If metrics show undefined:');
    console.log('   1. Check that there is data in the database');
    console.log('   2. Verify status values match (completed vs COMPLETED)');
    console.log('   3. Check date ranges in the queries');
    console.log('   4. Look at backend logs for any errors');

    // Sign out
    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDashboardAPI().catch(console.error);