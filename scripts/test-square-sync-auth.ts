#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅' : '❌');
  process.exit(1);
}

async function testSquareSyncAuth() {
  console.log('🧪 Testing Square Sync Authorization\n');
  
  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Get current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error('❌ No active session. Please log in first.');
    process.exit(1);
  }
  
  console.log('✅ Authenticated as:', session.user.email);
  
  // Test 1: Get user role
  console.log('\n📋 Test 1: Checking user role...');
  try {
    const userResponse = await axios.get(`${BACKEND_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    console.log('✅ User role:', userResponse.data.user.role);
    
    if (userResponse.data.user.role !== 'artist' && userResponse.data.user.role !== 'admin') {
      console.warn('⚠️  User role is not artist or admin, sync may fail');
    }
  } catch (error: any) {
    console.error('❌ Failed to get user info:', error.response?.data || error.message);
  }
  
  // Test 2: Check Square sync status
  console.log('\n📋 Test 2: Getting Square sync status...');
  try {
    const statusResponse = await axios.get(`${BACKEND_URL}/square-sync/status`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    console.log('✅ Square sync status retrieved successfully');
    console.log('   Configuration:', statusResponse.data.configuration);
    console.log('   Last sync:', statusResponse.data.lastSync);
    console.log('   Is running:', statusResponse.data.isRunning);
  } catch (error: any) {
    console.error('❌ Failed to get sync status:', error.response?.status, error.response?.data || error.message);
  }
  
  // Test 3: Trigger a sync
  console.log('\n📋 Test 3: Triggering Square sync...');
  try {
    const syncResponse = await axios.post(`${BACKEND_URL}/square-sync/run`, 
      {}, // empty body
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Square sync triggered successfully');
    console.log('   Response:', syncResponse.data);
    
    // Wait a moment then check status again
    console.log('\n⏳ Waiting 2 seconds to check sync progress...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const statusCheck = await axios.get(`${BACKEND_URL}/square-sync/status`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    console.log('📊 Sync status after trigger:');
    console.log('   Is running:', statusCheck.data.isRunning);
    console.log('   Last sync:', statusCheck.data.lastSync);
    
  } catch (error: any) {
    if (error.response?.status === 409) {
      console.log('⚠️  Sync already in progress');
    } else if (error.response?.status === 403) {
      console.error('❌ Authorization failed - user does not have permission to trigger sync');
      console.error('   Error:', error.response?.data);
    } else {
      console.error('❌ Failed to trigger sync:', error.response?.status, error.response?.data || error.message);
    }
  }
  
  // Test 4: Get appointments with Square sync status
  console.log('\n📋 Test 4: Getting appointments with Square sync status...');
  try {
    const appointmentsResponse = await axios.get(`${BACKEND_URL}/square-sync/appointments?limit=5`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    console.log('✅ Appointments retrieved successfully');
    console.log('   Total appointments:', appointmentsResponse.data.stats.total);
    console.log('   Synced with Square:', appointmentsResponse.data.stats.synced);
    console.log('   Sample appointments:', appointmentsResponse.data.appointments.length);
  } catch (error: any) {
    console.error('❌ Failed to get appointments:', error.response?.status, error.response?.data || error.message);
  }
  
  console.log('\n✅ Square sync authorization test complete!');
}

testSquareSyncAuth().catch(console.error);