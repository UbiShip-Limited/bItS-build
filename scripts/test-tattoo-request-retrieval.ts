#!/usr/bin/env npx tsx
import { PrismaClient } from '@prisma/client';
import { TattooRequestService } from '../lib/services/tattooRequestService';

const prisma = new PrismaClient();

async function testTattooRequestRetrieval() {
  console.log('🔍 Testing Tattoo Request Retrieval\n');
  
  const requestId = '81830f80-7ce5-4917-98a3-ffd63169b860';
  
  try {
    // Step 1: Check if the request exists in the database
    console.log('Step 1: Checking if request exists in database...');
    const directDbQuery = await prisma.tattooRequest.findUnique({
      where: { id: requestId }
    });
    
    if (!directDbQuery) {
      console.log('❌ Request not found in database');
      console.log('\nListing all tattoo requests to verify IDs:');
      const allRequests = await prisma.tattooRequest.findMany({
        select: { id: true, createdAt: true, status: true },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      console.log('Recent requests:', allRequests);
      return;
    }
    
    console.log('✅ Request found in database');
    console.log('   Status:', directDbQuery.status);
    console.log('   Has customer ID:', !!directDbQuery.customerId);
    console.log('   Created:', directDbQuery.createdAt);
    
    // Step 2: Check the images relation
    console.log('\nStep 2: Checking images relation...');
    const requestWithImages = await prisma.tattooRequest.findUnique({
      where: { id: requestId },
      include: { images: true }
    });
    
    console.log('   Images count:', requestWithImages?.images.length || 0);
    if (requestWithImages?.images && requestWithImages.images.length > 0) {
      console.log('   First image URL:', requestWithImages.images[0].url);
    }
    
    // Step 3: Check referenceImages JSON field
    console.log('\nStep 3: Checking referenceImages JSON field...');
    console.log('   referenceImages type:', typeof directDbQuery.referenceImages);
    console.log('   referenceImages value:', JSON.stringify(directDbQuery.referenceImages, null, 2));
    
    // Step 4: Test the service method
    console.log('\nStep 4: Testing TattooRequestService.findById()...');
    const service = new TattooRequestService();
    
    try {
      const serviceResult = await service.findById(requestId);
      console.log('✅ Service method succeeded');
      console.log('   Returned referenceImages count:', serviceResult.referenceImages?.length || 0);
    } catch (serviceError) {
      console.log('❌ Service method failed:', serviceError);
      console.log('   Error stack:', serviceError instanceof Error ? serviceError.stack : 'No stack');
    }
    
    // Step 5: Check if there's an issue with the customer relation
    console.log('\nStep 5: Checking customer relation...');
    const requestWithCustomer = await prisma.tattooRequest.findUnique({
      where: { id: requestId },
      include: { customer: true }
    });
    
    if (requestWithCustomer?.customer) {
      console.log('✅ Customer found:', requestWithCustomer.customer.name);
    } else {
      console.log('ℹ️  No customer linked to this request');
    }
    
    // Step 6: Test with all includes to see what might be failing
    console.log('\nStep 6: Testing with all includes...');
    try {
      const fullRequest = await prisma.tattooRequest.findUnique({
        where: { id: requestId },
        include: {
          customer: true,
          images: true,
          appointments: true,
          payment: true
        }
      });
      console.log('✅ Full query with all relations succeeded');
    } catch (fullError) {
      console.log('❌ Full query failed:', fullError);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testTattooRequestRetrieval().catch(console.error);