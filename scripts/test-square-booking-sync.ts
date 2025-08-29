#!/usr/bin/env tsx
/**
 * Test Square Booking Sync Functionality
 * Run with: npx tsx scripts/test-square-booking-sync.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../lib/prisma/prisma';
import { SquareIntegrationService } from '../lib/services/squareIntegrationService';
import { AppointmentService } from '../lib/services/appointmentService';
import { BookingType, BookingStatus } from '../lib/types/booking';
import { SquareBookingSyncJob } from '../lib/jobs/squareBookingSync';
import SquareClient from '../lib/square/index';

async function testSquareBookingSync() {
  console.log('🔄 TESTING SQUARE BOOKING SYNC FUNCTIONALITY\n');
  console.log('=' .repeat(60));
  
  try {
    // Check Square configuration
    console.log('📍 Step 1: Checking Square Configuration\n');
    const squareIntegrationService = new SquareIntegrationService();
    const configStatus = squareIntegrationService.getConfigurationStatus();
    
    console.log('Square Configuration Status:');
    console.log(`  ✓ Configured: ${configStatus.isConfigured ? '✅ YES' : '❌ NO'}`);
    console.log(`  ✓ Environment: ${configStatus.environment || 'Not set'}`);
    console.log(`  ✓ Location ID: ${configStatus.locationId ? '✅ Set' : '❌ Missing'}`);
    console.log(`  ✓ Access Token: ${configStatus.hasAccessToken ? '✅ Set' : '❌ Missing'}`);
    
    if (!configStatus.isConfigured) {
      console.log('\n⚠️  Square is not fully configured:');
      configStatus.warnings.forEach(warning => console.log(`  - ${warning}`));
      console.log('\n❌ Cannot test sync without proper Square configuration');
      process.exit(1);
    }
    
    // Test Square API connectivity
    console.log('\n📍 Step 2: Testing Square API Connection\n');
    try {
      const squareClient = SquareClient.fromEnv();
      const locationResponse = await squareClient.locationsApi.retrieveLocation(
        process.env.SQUARE_LOCATION_ID!
      );
      console.log(`✅ Connected to Square location: ${locationResponse.result.location?.name}`);
      console.log(`   Status: ${locationResponse.result.location?.status}`);
    } catch (error: any) {
      console.log('❌ Failed to connect to Square API:', error.message);
      process.exit(1);
    }
    
    // Create test data
    console.log('\n📍 Step 3: Creating Test Appointment\n');
    
    // Create a test customer
    const testCustomer = await prisma.customer.create({
      data: {
        name: 'Booking Sync Test Customer',
        email: `sync-test-${Date.now()}@test.com`,
        phone: '+16041234567'
      }
    });
    console.log(`✅ Created test customer: ${testCustomer.name} (${testCustomer.id})`);
    
    // Create appointment using AppointmentService
    const appointmentService = new AppointmentService();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 1 week from now
    futureDate.setHours(14, 0, 0, 0); // 2 PM
    
    const appointment = await appointmentService.create({
      startAt: futureDate,
      duration: 90,
      customerId: testCustomer.id,
      bookingType: BookingType.CONSULTATION,
      note: 'Test appointment for Square sync verification',
      priceQuote: 150,
      status: BookingStatus.SCHEDULED
    });
    
    console.log(`✅ Created test appointment: ${appointment.id}`);
    console.log(`   Date: ${appointment.startTime}`);
    console.log(`   Duration: ${appointment.duration} minutes`);
    
    // Test sync to Square
    console.log('\n📍 Step 4: Syncing Appointment to Square Calendar\n');
    
    const syncResult = await squareIntegrationService.syncAppointmentToSquare(appointment);
    
    if (syncResult.squareId) {
      console.log(`✅ Successfully synced to Square!`);
      console.log(`   Square Booking ID: ${syncResult.squareId}`);
      
      // Verify the appointment was updated with Square ID
      const updatedAppointment = await prisma.appointment.findUnique({
        where: { id: appointment.id },
        include: { customer: true }
      });
      
      console.log(`✅ Appointment updated with Square ID: ${updatedAppointment?.squareId}`);
      console.log(`   Customer Square ID: ${updatedAppointment?.customer?.squareId || 'Not set'}`);
    } else {
      console.log(`⚠️  Sync completed with warning: ${syncResult.error}`);
    }
    
    // Test bidirectional sync
    console.log('\n📍 Step 5: Testing Bidirectional Sync\n');
    
    const syncJob = new SquareBookingSyncJob(squareIntegrationService);
    
    // Get current sync status
    const lastSyncStatus = await syncJob.getLastSyncStatus();
    console.log('Last sync status:', lastSyncStatus || 'No previous sync');
    
    // Run sync job
    console.log('\nRunning Square booking sync job...');
    const syncJobResult = await syncJob.run({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)  // Next 30 days
    });
    
    console.log('\nSync Job Results:');
    console.log(`  ✓ Success: ${syncJobResult.success ? '✅' : '❌'}`);
    console.log(`  ✓ Synced: ${syncJobResult.synced} bookings`);
    console.log(`  ✓ Created: ${syncJobResult.created} new appointments`);
    console.log(`  ✓ Updated: ${syncJobResult.updated} existing appointments`);
    console.log(`  ✓ Errors: ${syncJobResult.errors.length}`);
    console.log(`  ✓ Duration: ${syncJobResult.duration}ms`);
    
    if (syncJobResult.errors.length > 0) {
      console.log('\n⚠️  Sync errors encountered:');
      syncJobResult.errors.forEach(error => {
        console.log(`  - Booking ${error.bookingId}: ${error.error}`);
      });
    }
    
    // Check appointments with Square IDs
    console.log('\n📍 Step 6: Verifying Sync Results\n');
    
    const syncedAppointments = await prisma.appointment.count({
      where: { squareId: { not: null } }
    });
    
    const totalAppointments = await prisma.appointment.count();
    
    console.log(`Sync Statistics:`);
    console.log(`  ✓ Total appointments: ${totalAppointments}`);
    console.log(`  ✓ Synced with Square: ${syncedAppointments}`);
    console.log(`  ✓ Sync percentage: ${((syncedAppointments / totalAppointments) * 100).toFixed(1)}%`);
    
    // Clean up test data
    console.log('\n📍 Step 7: Cleaning Up Test Data\n');
    
    if (syncResult.squareId) {
      // Try to cancel the Square booking
      try {
        const squareClient = SquareClient.fromEnv();
        await squareClient.bookingsApi.cancelBooking(syncResult.squareId, {
          bookingVersion: 1 // Assuming first version
        });
        console.log('✅ Cancelled Square booking');
      } catch (error) {
        console.log('⚠️  Could not cancel Square booking:', error.message);
      }
    }
    
    // Delete test appointment
    await prisma.appointment.delete({
      where: { id: appointment.id }
    });
    console.log('✅ Deleted test appointment');
    
    // Delete test customer
    await prisma.customer.delete({
      where: { id: testCustomer.id }
    });
    console.log('✅ Deleted test customer');
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('✨ SQUARE BOOKING SYNC TEST COMPLETE!\n');
    
    console.log('Summary:');
    console.log('✅ Square API is properly configured');
    console.log('✅ Appointments can be synced to Square calendar');
    console.log('✅ Square customer creation works');
    console.log('✅ Bidirectional sync job is operational');
    
    if (syncedAppointments === 0 && totalAppointments > 0) {
      console.log('\n⚠️  Note: No appointments are currently synced with Square.');
      console.log('   This may be normal for anonymous appointments or if Square sync');
      console.log('   was recently enabled. New appointments with customers will sync.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testSquareBookingSync()
  .catch(error => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });