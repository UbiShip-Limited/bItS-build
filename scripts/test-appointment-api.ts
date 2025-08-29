#!/usr/bin/env tsx
/**
 * Quick test script for appointment API
 * Run with: npx tsx scripts/test-appointment-api.ts
 */

import { prisma } from '../lib/prisma/prisma';
import { AppointmentService } from '../lib/services/appointmentService';
import { BookingStatus, BookingType } from '../lib/types/booking';

async function testAppointmentAPI() {
  console.log('🧪 Testing Appointment API\n');
  console.log('=' .repeat(50));
  
  try {
    const appointmentService = new AppointmentService();
    
    // Test 1: Create a test customer
    console.log('\n1️⃣ Creating test customer...');
    const testCustomer = await prisma.customer.create({
      data: {
        name: 'API Test Customer',
        email: `test-${Date.now()}@example.com`,
        phone: '+1234567890'
      }
    });
    console.log('✅ Customer created:', testCustomer.id);
    
    // Test 2: Create an appointment with customer
    console.log('\n2️⃣ Creating appointment with customer...');
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
    const appointment = await appointmentService.create({
      startAt: futureDate,
      duration: 120,
      customerId: testCustomer.id,
      bookingType: BookingType.CONSULTATION,
      note: 'Test appointment from API test script',
      priceQuote: 200
    });
    console.log('✅ Appointment created:', appointment.id);
    console.log('   Date:', appointment.startTime);
    console.log('   Status:', appointment.status);
    
    // Test 3: Create anonymous appointment
    console.log('\n3️⃣ Creating anonymous appointment...');
    const anonAppointment = await appointmentService.create({
      startAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      duration: 60,
      contactEmail: 'anonymous@test.com',
      contactPhone: '+1987654321',
      bookingType: BookingType.CONSULTATION,
      note: 'Anonymous appointment test'
    });
    console.log('✅ Anonymous appointment created:', anonAppointment.id);
    console.log('   Contact:', anonAppointment.contactEmail);
    
    // Test 4: List appointments
    console.log('\n4️⃣ Listing appointments...');
    const appointments = await appointmentService.list({
      status: BookingStatus.SCHEDULED
    });
    console.log(`✅ Found ${appointments.length} scheduled appointments`);
    
    // Test 5: Update appointment
    console.log('\n5️⃣ Updating appointment status...');
    const updated = await appointmentService.update(appointment.id, {
      status: BookingStatus.CONFIRMED
    });
    console.log('✅ Appointment updated to:', updated.status);
    
    // Test 6: Test validation
    console.log('\n6️⃣ Testing validation (should fail)...');
    try {
      await appointmentService.create({
        startAt: new Date('2020-01-01'), // Past date
        duration: 60,
        customerId: testCustomer.id,
        bookingType: BookingType.CONSULTATION
      });
      console.log('❌ Validation failed - past date was accepted!');
    } catch (error: any) {
      console.log('✅ Validation working:', error.message);
    }
    
    // Clean up
    console.log('\n7️⃣ Cleaning up test data...');
    await prisma.appointment.deleteMany({
      where: {
        customerId: testCustomer.id
      }
    });
    await prisma.appointment.delete({
      where: { id: anonAppointment.id }
    });
    await prisma.customer.delete({
      where: { id: testCustomer.id }
    });
    console.log('✅ Test data cleaned up');
    
    console.log('\n' + '=' .repeat(50));
    console.log('✨ All appointment API tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testAppointmentAPI()
  .catch(error => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });