#!/usr/bin/env tsx

import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

interface CloudinaryResource {
  public_id: string;
  context?: {
    custom?: Record<string, string>;
  };
}

interface CloudinarySearchResult {
  resources: CloudinaryResource[];
  total_count: number;
  next_cursor?: string;
}

async function updateArtistMetadata() {
  console.log('🎨 Starting Cloudinary artist metadata update...');
  console.log('📁 Targeting shop_content folder');
  
  try {
    // Get all images from shop_content folder
    const result = await cloudinary.search
      .expression('folder:shop_content')
      .with_field('context')
      .max_results(500) // Adjust as needed
      .execute() as CloudinarySearchResult;
    
    console.log(`📊 Found ${result.total_count} images in shop_content folder`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const resource of result.resources) {
      const currentArtist = resource.context?.custom?.artist;
      
      if (currentArtist && currentArtist !== 'Unknown Artist' && currentArtist !== 'Kelly Miller') {
        console.log(`⏭️  Skipping ${resource.public_id} - already has artist: ${currentArtist}`);
        skippedCount++;
        continue;
      }
      
      if (currentArtist === 'Kelly Miller') {
        console.log(`✅ Skipping ${resource.public_id} - already set to Kelly Miller`);
        skippedCount++;
        continue;
      }
      
      try {
        // Update the context metadata to set artist
        await cloudinary.uploader.update_metadata(
          'artist=Kelly Miller',
          [resource.public_id]
        );
        
        console.log(`✅ Updated ${resource.public_id} - set artist to Kelly Miller`);
        updatedCount++;
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to update ${resource.public_id}:`, error.message);
      }
    }
    
    console.log('\n🎯 Update Summary:');
    console.log(`✅ Updated: ${updatedCount} images`);
    console.log(`⏭️  Skipped: ${skippedCount} images`);
    console.log(`📊 Total processed: ${result.total_count} images`);
    
    if (updatedCount > 0) {
      console.log('\n🚀 All images updated! The gallery will now show "Kelly Miller" as the artist.');
    } else {
      console.log('\n💡 No images needed updating. All are already properly attributed.');
    }
    
  } catch (error) {
    console.error('❌ Error updating Cloudinary metadata:', error);
    process.exit(1);
  }
}

// Add ability to update specific images by public ID
async function updateSpecificImages(publicIds: string[]) {
  console.log(`🎯 Updating specific images: ${publicIds.join(', ')}`);
  
  for (const publicId of publicIds) {
    try {
      await cloudinary.uploader.update_metadata(
        'artist=Kelly Miller',
        [publicId]
      );
      console.log(`✅ Updated ${publicId}`);
    } catch (error) {
      console.error(`❌ Failed to update ${publicId}:`, error.message);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Update specific images if public IDs are provided
    await updateSpecificImages(args);
  } else {
    // Update all images in shop_content folder
    await updateArtistMetadata();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { updateArtistMetadata, updateSpecificImages }; 